package service

import (
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type HealthService struct {
	AIService *AIService
}

// CheckIn 每日自评提交（Upsert 语义：同一天重复提交会覆盖）
func (s *HealthService) CheckIn(userID string, req dto.HealthCheckInRequest) error {
	now := time.Now()
	// 归一化到 UTC 当天 0:00
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)

	data := model.HealthData{
		UserID:          userID,
		Date:            today,
		SleepHours:      req.SleepHours,
		SleepQuality:    req.SleepQuality,
		ExerciseMinutes: req.ExerciseMinutes,
		StudyQuality:    req.StudyQuality,
		MoodScore:       req.MoodScore,
		FatigueLevel:    req.FatigueLevel,
	}

	// 构建更新字段映射（只更新非 nil 的字段）
	updates := map[string]interface{}{}
	if req.SleepHours != nil {
		updates["sleep_hours"] = *req.SleepHours
	}
	if req.SleepQuality != nil {
		updates["sleep_quality"] = *req.SleepQuality
	}
	if req.ExerciseMinutes != nil {
		updates["exercise_minutes"] = *req.ExerciseMinutes
	}
	if req.StudyQuality != nil {
		updates["study_quality"] = *req.StudyQuality
	}
	if req.MoodScore != nil {
		updates["mood_score"] = *req.MoodScore
	}
	if req.FatigueLevel != nil {
		updates["fatigue_level"] = *req.FatigueLevel
	}

	// 如果没有任何字段，也允许提交（空白打卡）
	if len(updates) == 0 {
		// 仅创建记录，不做 update
		err := database.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "user_id"}, {Name: "date"}},
			DoNothing: true,
		}).Create(&data).Error
		return err
	}

	err := database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "date"}},
		DoUpdates: clause.Assignments(updates),
	}).Create(&data).Error

	return err
}

// GetToday 获取今天的打卡状态
func (s *HealthService) GetToday(userID string) (*dto.HealthTodayResponse, error) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)

	var data model.HealthData
	err := database.DB.Where("user_id = ? AND date = ?", userID, today).First(&data).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return &dto.HealthTodayResponse{CheckedIn: false}, nil
	}
	if err != nil {
		return nil, err
	}

	return &dto.HealthTodayResponse{
		CheckedIn:       true,
		SleepHours:      data.SleepHours,
		SleepQuality:    data.SleepQuality,
		ExerciseMinutes: data.ExerciseMinutes,
		StudyQuality:    data.StudyQuality,
		MoodScore:       data.MoodScore,
		FatigueLevel:    data.FatigueLevel,
	}, nil
}

// GetHistory 获取历史健康数据
func (s *HealthService) GetHistory(userID string, days int) (*dto.HealthHistoryResponse, error) {
	if days <= 0 || days > 365 {
		days = 30
	}

	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC).AddDate(0, 0, -days+1)

	var records []model.HealthData
	err := database.DB.Where("user_id = ? AND date >= ?", userID, startDate).
		Order("date DESC").
		Find(&records).Error

	if err != nil {
		return nil, err
	}

	items := make([]dto.HealthHistoryItem, len(records))
	for i, r := range records {
		items[i] = dto.HealthHistoryItem{
			Date:            r.Date.Format("2006-01-02"),
			SleepHours:      r.SleepHours,
			SleepQuality:    r.SleepQuality,
			ExerciseMinutes: r.ExerciseMinutes,
			StudyQuality:    r.StudyQuality,
			MoodScore:       r.MoodScore,
			FatigueLevel:    r.FatigueLevel,
		}
	}

	return &dto.HealthHistoryResponse{
		Items: items,
		Days:  days,
	}, nil
}

// GenerateHealthReport 聚合近 7 天数据生成 AI 健康报告
func (s *HealthService) GenerateHealthReport(userID string) (*model.AIReport, error) {
	if s.AIService == nil {
		return nil, errors.New("AIService not initialized")
	}

	// 1. 获取最近 7 天的每日统计 (学习时间)
	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC).AddDate(0, 0, -6)

	var dailyStats []model.DailyStat
	database.DB.Where("user_id = ? AND date >= ?", userID, startDate).
		Order("date ASC").
		Find(&dailyStats)

	// 2. 获取最近 7 天的健康自评数据
	var healthData []model.HealthData
	database.DB.Where("user_id = ? AND date >= ?", userID, startDate).
		Order("date ASC").
		Find(&healthData)

	// 如果两边都没数据，就不生成报告了
	if len(dailyStats) == 0 && len(healthData) == 0 {
		return nil, errors.New("not enough data to generate report")
	}

	// 构建数据摘要给 AI
	summaryBuilder := strings.Builder{}
	summaryBuilder.WriteString("用户近 7 天数据总结：\n")

	// 学习时长
	studyMinutes := make([]int, 7)
	for _, ds := range dailyStats {
		daysDiff := int(ds.Date.Sub(startDate).Hours() / 24)
		if daysDiff >= 0 && daysDiff < 7 {
			studyMinutes[daysDiff] = ds.TotalMinutes
		}
	}
	summaryBuilder.WriteString(fmt.Sprintf("- 每日学习分钟数：%v\n", studyMinutes))

	// 自评数据
	summaryBuilder.WriteString("- 每日自评：\n")
	for _, hd := range healthData {
		dateStr := hd.Date.Format("01-02")
		sleep := "未记录"
		if hd.SleepHours != nil {
			sleep = fmt.Sprintf("%.1fh", *hd.SleepHours)
		}
		quality := "未记录"
		if hd.StudyQuality != nil {
			quality = fmt.Sprintf("%d/5", *hd.StudyQuality)
		}
		mood := "未记录"
		if hd.MoodScore != nil {
			mood = fmt.Sprintf("%d/5", *hd.MoodScore)
		}
		fatigue := "未记录"
		if hd.FatigueLevel != nil {
			fatigue = fmt.Sprintf("%d/5", *hd.FatigueLevel)
		}
		summaryBuilder.WriteString(fmt.Sprintf("  [%s] 睡眠:%s, 学习质量:%s, 心情:%s, 疲劳度:%s\n", dateStr, sleep, quality, mood, fatigue))
	}

	// 3. 调用 AI 分析
	userDataSummary := summaryBuilder.String()
	aiRes, err := s.AIService.GenerateHealthReport(userDataSummary)
	if err != nil {
		return nil, err
	}

	// 4. 落库
	// 简单起见，这里将 AI 返回的 JSON 序列化为文本存入 AIReport 表，或者以后扩展 AIReport 模型
	reportTextBytes, _ := json.Marshal(aiRes)
	reportText := string(reportTextBytes)

	report := model.AIReport{
		UserID:     userID,
		ReportText: reportText, // 存入 JSON 文本
	}

	if err := database.DB.Create(&report).Error; err != nil {
		return nil, err
	}

	return &report, nil
}
