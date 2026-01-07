package service

import (
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type StudyService struct{}

// updateDailyStats 内部辅助函数，更新每日统计表 (Upsert)
func (s *StudyService) updateDailyStats(tx *gorm.DB, userID string, startTime time.Time, durationMinutes int) error {
	if durationMinutes <= 0 {
		return nil
	}

	// 简单策略：归属到 StartTime 所在的 UTC 日期
	date := time.Date(startTime.Year(), startTime.Month(), startTime.Day(), 0, 0, 0, 0, time.UTC)

	// Upsert: 如果存在则累加，不存在则插入
	// PostgreSQL: INSERT ... ON CONFLICT (user_id, date) DO UPDATE SET total_minutes = daily_stats.total_minutes + ?
	err := tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "date"}},
		DoUpdates: clause.Assignments(map[string]interface{}{"total_minutes": gorm.Expr("daily_stats.total_minutes + ?", durationMinutes)}),
	}).Create(&model.DailyStat{
		UserID:       userID,
		Date:         date,
		TotalMinutes: durationMinutes,
	}).Error

	return err
}

// StartSession 开始会话
func (s *StudyService) StartSession(userID string, req dto.StartSessionRequest) (*model.StudySession, error) {
	// 1. 检查是否已有进行中的会话 (EndTime 为空的)
	var activeCount int64
	database.DB.Model(&model.StudySession{}).
		Where("user_id = ? AND end_time IS NULL", userID).
		Count(&activeCount)

	if activeCount > 0 {
		return nil, errors.New("you already have an active session")
	}

	// 2. 确定开始时间 (统一使用后端时间)
	startTime := time.Now()

	// 3. 创建
	session := model.StudySession{
		UserID:    userID,
		Type:      req.Type,
		StartTime: startTime,
		EndTime:   nil, // 明确为空
	}

	if err := database.DB.Create(&session).Error; err != nil {
		return nil, err
	}

	// 4. 设置初始心跳
	go func() {
		ctx := context.Background()
		database.RDB.Set(ctx, fmt.Sprintf("study:heartbeat:%s", session.ID), startTime.Unix(), 3*time.Minute)
	}()

	return &session, nil
}

// Heartbeat 接收心跳
func (s *StudyService) Heartbeat(userID, sessionID string) error {
	// 简单校验该 Session 是否属于该用户且正在进行中
	// 也可以为了性能只依靠 Redis，但查一下 DB 更稳妥
	var count int64
	err := database.DB.Model(&model.StudySession{}).
		Where("id = ? AND user_id = ? AND end_time IS NULL", sessionID, userID).
		Count(&count).Error

	if err != nil {
		return err
	}
	if count == 0 {
		return errors.New("session not found or inactive")
	}

	// 更新 Redis
	ctx := context.Background()
	key := fmt.Sprintf("study:heartbeat:%s", sessionID)
	return database.RDB.Set(ctx, key, time.Now().Unix(), 3*time.Minute).Err()
}

// updateRankings 内部辅助函数，同步更新排行榜
func (s *StudyService) updateRankings(ctx context.Context, userID string, duration int, endTime time.Time) error {
	if duration <= 0 {
		return nil
	}

	score := float64(duration)

	// 1. 更新总榜
	if err := database.RDB.ZIncrBy(ctx, "ranking:total", score, userID).Err(); err != nil {
		return err
	}

	// 2. 更新周榜
	year, week := endTime.ISOWeek()
	weekKey := fmt.Sprintf("ranking:week:%d-%d", year, week)

	if err := database.RDB.ZIncrBy(ctx, weekKey, score, userID).Err(); err != nil {
		return err
	}

	// 设置周榜过期时间
	database.RDB.Expire(ctx, weekKey, 14*24*time.Hour)
	return nil
}

// EndSession 结束会话
func (s *StudyService) EndSession(userID, sessionID string, req dto.EndSessionRequest) (*model.StudySession, error) {
	var session model.StudySession

	// 查找属于该用户的特定会话
	if err := database.DB.Where("id = ? AND user_id = ?", sessionID, userID).First(&session).Error; err != nil {
		return nil, errors.New("session not found")
	}

	// 简单的校验：不能重复结束
	if session.EndTime != nil {
		return nil, errors.New("session is already ended")
	}

	// 更新 (后端自动计算结束时间和时长)
	now := time.Now()
	duration := int(now.Sub(session.StartTime).Minutes())

	session.EndTime = &now
	session.DurationMinutes = &duration

	// 使用事务确保数据一致性
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&session).Error; err != nil {
			return err
		}

		// 1. 更新每日统计表 (预计算)
		if err := s.updateDailyStats(tx, userID, session.StartTime, duration); err != nil {
			return fmt.Errorf("failed to update daily stats: %v", err)
		}

		// 2. 同步更新排行榜
		ctx := context.Background()
		if err := s.updateRankings(ctx, userID, duration, now); err != nil {
			return fmt.Errorf("failed to update rankings: %v", err)
		}

		// 3. 删除心跳 Key
		database.RDB.Del(ctx, fmt.Sprintf("study:heartbeat:%s", session.ID))

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &session, nil
}

// GetActiveSession 获取当前进行中的会话
func (s *StudyService) GetActiveSession(userID string) (*model.StudySession, error) {
	var session model.StudySession
	err := database.DB.Where("user_id = ? AND end_time IS NULL", userID).First(&session).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil // 没有进行中会话，返回 nil
	}
	if err != nil {
		return nil, err
	}

	return &session, nil
}

// CancelActiveSession 取消当前会话
func (s *StudyService) CancelActiveSession(userID string) (int64, error) {
	// 物理删除 endTime 为空的记录
	result := database.DB.Where("user_id = ? AND end_time IS NULL", userID).Delete(&model.StudySession{})
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}

// GetSessionsList 查询列表（分页、筛选）
func (s *StudyService) GetSessionsList(userID string, q dto.GetSessionsQuery) (*dto.SessionsListResponse, error) {
	var sessions []model.StudySession
	var total int64

	db := database.DB.Model(&model.StudySession{}).Where("user_id = ?", userID)

	// 筛选条件
	if q.Type != "" {
		db = db.Where("type = ?", q.Type)
	}
	if q.From != "" {
		db = db.Where("start_time >= ?", q.From)
	}
	if q.To != "" {
		db = db.Where("start_time <= ?", q.To)
	}

	// 统计总数
	db.Count(&total)

	// 分页查询
	offset := (q.Page - 1) * q.PageSize
	// 排序：默认按创建时间倒序
	err := db.Order("created_at DESC").Offset(offset).Limit(q.PageSize).Find(&sessions).Error
	if err != nil {
		return nil, err
	}

	// 转换为 Response DTO
	items := make([]dto.StudySessionResponse, len(sessions))
	for i, v := range sessions {
		items[i] = dto.StudySessionResponse{
			ID:              v.ID,
			UserID:          v.UserID,
			Type:            v.Type,
			StartTime:       v.StartTime,
			EndTime:         v.EndTime,
			DurationMinutes: v.DurationMinutes,
			CreatedAt:       v.CreatedAt,
		}
	}

	return &dto.SessionsListResponse{
		Items:    items,
		Total:    total,
		Page:     q.Page,
		PageSize: q.PageSize,
	}, nil
}

// GetStatsSummary 统计仪表盘
func (s *StudyService) GetStatsSummary(userID string, q dto.GetStatsQuery) (*dto.StatsSummaryResponse, error) {
	// 1. 计算时间范围
	var startTime, endTime time.Time
	now := time.Now()

	// 默认使用 UTC 处理
	if q.Range == "custom" || q.Range == "" && q.From != "" {
		t1, _ := time.Parse("2006-01-02", q.From) // 假设传入 YYYY-MM-DD
		t2, _ := time.Parse("2006-01-02", q.To)
		startTime = t1
		endTime = t2
	} else {
		// 默认处理 Range (比如 "7")
		days := 7
		if q.Range != "" {
			days, _ = strconv.Atoi(q.Range)
		}
		// 归一化到 UTC 0点
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
		endTime = today
		startTime = today.AddDate(0, 0, -days+1) // +1 是为了包含今天
	}

	// 2. 查询 DailyStat 表 (高效)
	var stats []model.DailyStat
	err := database.DB.Model(&model.DailyStat{}).
		Where("user_id = ? AND date BETWEEN ? AND ?", userID, startTime, endTime).
		Order("date ASC").
		Find(&stats).Error

	if err != nil {
		return nil, err
	}

	// 3. 组装数据 & 补全缺失日期
	dailyStats := make([]dto.DailyStat, 0)
	grandTotal := 0
	statsMap := make(map[string]int)

	for _, s := range stats {
		dateStr := s.Date.Format("2006-01-02")
		statsMap[dateStr] = s.TotalMinutes
		grandTotal += s.TotalMinutes
	}

	// 循环补全日期
	for d := startTime; !d.After(endTime); d = d.AddDate(0, 0, 1) {
		dateStr := d.Format("2006-01-02")
		minutes := 0
		if val, ok := statsMap[dateStr]; ok {
			minutes = val
		}
		dailyStats = append(dailyStats, dto.DailyStat{
			Date:    dateStr,
			Minutes: minutes,
		})
	}

	return &dto.StatsSummaryResponse{
		Type:         q.Type, // 注意：DailyStat 目前没分 Type，如果是 MVP 可以忽略 Type 筛选，或者 DailyStat 表加 Type 字段
		Tz:           "UTC",  // 强制 UTC
		From:         startTime,
		To:           endTime,
		TotalMinutes: grandTotal,
		Daily:        dailyStats,
	}, nil
}
