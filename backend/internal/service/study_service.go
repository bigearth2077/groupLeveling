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
)

type StudyService struct{}

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

	// 2. 确定开始时间
	startTime := time.Now()
	if req.StartTime != nil {
		startTime = *req.StartTime
	}

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

	return &session, nil
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

	// 更新
	session.EndTime = &req.EndTime
	session.DurationMinutes = &req.DurationMinutes

	if err := database.DB.Save(&session).Error; err != nil {
		return nil, err
	}

	go func() {
		ctx := context.Background()
		duration := float64(req.DurationMinutes)

		// 1. 更新总榜
		database.RDB.ZIncrBy(ctx, "ranking:total", duration, userID)

		// 2. 更新周榜
		// 获取当前 ISO 年和周
		year, week := time.Now().ISOWeek()
		weekKey := fmt.Sprintf("ranking:week:%d-%d", year, week)

		// 增加分数
		database.RDB.ZIncrBy(ctx, weekKey, duration, userID)

		// 设置周榜过期时间 (例如保留 2 周，避免垃圾数据堆积)
		database.RDB.Expire(ctx, weekKey, 14*24*time.Hour)
	}()

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
		// 假设前端传的是 UTC 或者带时区的字符串，或者简单的 YYYY-MM-DD (视为当天的0点)
		// 这里简化处理，直接比较
		db = db.Where("start_time >= ?", q.From)
	}
	if q.To != "" {
		// 为了包含 To 那一天的结尾，通常需要处理时间，这里简单处理
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

	if q.Range == "custom" || q.Range == "" && q.From != "" {
		// 解析 From/To
		// 实际项目中建议使用 helper 解析多种时间格式，这里简化假定 ISO8601
		t1, _ := time.Parse(time.RFC3339, q.From) // 简单处理错误
		t2, _ := time.Parse(time.RFC3339, q.To)
		startTime = t1
		endTime = t2
	} else {
		// 默认处理 Range (比如 "7")
		days := 7
		if q.Range != "" {
			days, _ = strconv.Atoi(q.Range)
		}
		endTime = now
		startTime = now.AddDate(0, 0, -days)
	}

	// 2. 数据库聚合查询
	// 目标：按日期分组求和 duration_minutes
	// 注意：日期必须基于用户请求的时区 (q.Tz)
	// PostgreSQL: to_char(start_time AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD')

	type Result struct {
		DateStr      string
		TotalMinutes int
	}

	var results []Result

	err := database.DB.Model(&model.StudySession{}).
		// Select 中定义了别名 date_str
		Select("TO_CHAR(start_time AT TIME ZONE ?, 'YYYY-MM-DD') as date_str, SUM(duration_minutes) as total_minutes", q.Tz).
		Where("user_id = ? AND type = ? AND start_time BETWEEN ? AND ? AND duration_minutes IS NOT NULL", userID, q.Type, startTime, endTime).
		// 【修改点】不要用 "1"，直接用别名 "date_str"
		Group("date_str").
		Order("date_str").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	// 3. 组装数据
	dailyStats := make([]dto.DailyStat, 0)
	grandTotal := 0

	for _, r := range results {
		dailyStats = append(dailyStats, dto.DailyStat{
			Date:    r.DateStr,
			Minutes: r.TotalMinutes,
		})
		grandTotal += r.TotalMinutes
	}

	// 补充：如果需要填充中间缺失的日期（例如某天没学习，要是0），需要在 Go 代码里循环 startTime 到 endTime 补全。
	// 为了符合 MVP 说明，这里暂只返回有数据的天数。

	return &dto.StatsSummaryResponse{
		Type:         q.Type,
		Tz:           q.Tz,
		From:         startTime,
		To:           endTime,
		TotalMinutes: grandTotal,
		Daily:        dailyStats,
	}, nil
}
