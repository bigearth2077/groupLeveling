package dto

import (
	"backend/internal/model"
	"time"
)

// --- Request DTOs ---

type StartSessionRequest struct {
	Type    model.SessionType `json:"type" binding:"required,oneof=learning rest"`
	TagName string            `json:"tagName"` // 可选：用户输入的标签名
	TagID   string            `json:"tagId"`   // 可选：直接传 ID
}

type EndSessionRequest struct {
	// 目前不需要传入字段，后端自行计算时间和时长
}

type GetSessionsQuery struct {
	From     string            `form:"from"` // 格式: YYYY-MM-DD
	To       string            `form:"to"`
	Type     model.SessionType `form:"type"`
	Page     int               `form:"page,default=1"`
	PageSize int               `form:"pageSize,default=20"`
}

type GetStatsQuery struct {
	From  string `form:"from"`
	To    string `form:"to"`
	Range string `form:"range"` // "7", "30" 等
	Type  string `form:"type,default=learning"`
	Tz    string `form:"tz,default=Asia/Shanghai"` // 时区
}

// --- Response DTOs ---

type StudySessionResponse struct {
	ID              string            `json:"id"`
	UserID          string            `json:"userId"`
	Type            model.SessionType `json:"type"`
	StartTime       time.Time         `json:"startTime"`
	EndTime         *time.Time        `json:"endTime"` // 指针允许 null
	DurationMinutes *int              `json:"durationMinutes"`
	CreatedAt       time.Time         `json:"createdAt"`
}

type DeleteActiveResponse struct {
	Ok      bool  `json:"ok"`
	Deleted int64 `json:"deleted"`
}

type SessionsListResponse struct {
	Items    []StudySessionResponse `json:"items"`
	Total    int64                  `json:"total"`
	Page     int                    `json:"page"`
	PageSize int                    `json:"pageSize"`
}

// 统计相关
type DailyStat struct {
	Date    string `json:"date"`    // "2025-08-17"
	Minutes int    `json:"minutes"` // 180
}

type StatsSummaryResponse struct {
	Type          string      `json:"type"`
	Tz            string      `json:"tz"`
	From          time.Time   `json:"from"`
	To            time.Time   `json:"to"`
	TotalMinutes  int         `json:"totalMinutes"`
	Daily         []DailyStat `json:"daily"`
	
	// Gamification Info
	LevelInfo     LevelInfo   `json:"levelInfo"`
	CurrentStreak int         `json:"currentStreak"`
	LongestStreak int         `json:"longestStreak"` // 这通常需要更复杂的计算，MVP 先不做或者简化
}

type LevelInfo struct {
	Level        int     `json:"level"`
	CurrentXP    int     `json:"currentXP"`
	LevelFloorXP int     `json:"levelFloorXP"`
	NextLevelXP  int     `json:"nextLevelXP"`
	Progress     float64 `json:"progress"`
}
