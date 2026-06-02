package dto

// HealthCheckInRequest 每日自评提交（所有字段可选）
type HealthCheckInRequest struct {
	SleepHours      *float64 `json:"sleepHours"`                                      // 睡眠时长（小时）
	SleepQuality    *string  `json:"sleepQuality"`                                    // "bad", "okay", "great"
	ExerciseMinutes *int     `json:"exerciseMinutes"`                                 // 运动时长（分钟）
	StudyQuality    *int     `json:"studyQuality" binding:"omitempty,min=1,max=5"`    // 1-5 学习质量自评
	MoodScore       *int     `json:"moodScore" binding:"omitempty,min=1,max=5"`       // 1-5 心情
	FatigueLevel    *int     `json:"fatigueLevel" binding:"omitempty,min=1,max=5"`    // 1-5 疲劳度
}

// HealthTodayResponse 今日打卡状态
type HealthTodayResponse struct {
	CheckedIn       bool     `json:"checkedIn"`                // 今天是否已打卡
	SleepHours      *float64 `json:"sleepHours,omitempty"`
	SleepQuality    *string  `json:"sleepQuality,omitempty"`
	ExerciseMinutes *int     `json:"exerciseMinutes,omitempty"`
	StudyQuality    *int     `json:"studyQuality,omitempty"`
	MoodScore       *int     `json:"moodScore,omitempty"`
	FatigueLevel    *int     `json:"fatigueLevel,omitempty"`
}

// HealthHistoryItem 历史数据条目
type HealthHistoryItem struct {
	Date            string   `json:"date"`
	SleepHours      *float64 `json:"sleepHours,omitempty"`
	SleepQuality    *string  `json:"sleepQuality,omitempty"`
	ExerciseMinutes *int     `json:"exerciseMinutes,omitempty"`
	StudyQuality    *int     `json:"studyQuality,omitempty"`
	MoodScore       *int     `json:"moodScore,omitempty"`
	FatigueLevel    *int     `json:"fatigueLevel,omitempty"`
}

// HealthHistoryResponse 历史数据列表
type HealthHistoryResponse struct {
	Items []HealthHistoryItem `json:"items"`
	Days  int                 `json:"days"`
}
