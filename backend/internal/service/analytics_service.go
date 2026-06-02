package service

import (
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"fmt"
	"time"
)

type AnalyticsService struct{}

// GetActivityHeatmap returns total study minutes per day for the given year
func (s *AnalyticsService) GetActivityHeatmap(userID string, year int) (*dto.ActivityHeatmapResponse, error) {
	// Fallback to current year if 0
	if year == 0 {
		year = time.Now().Year()
	}

	startDate := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(year, 12, 31, 23, 59, 59, 999999999, time.UTC)

	var dailyStats []model.DailyStat
	err := database.DB.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate, endDate).
		Find(&dailyStats).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch daily stats: %w", err)
	}

	items := make([]dto.HeatmapItem, 0, len(dailyStats))
	for _, stat := range dailyStats {
		if stat.TotalMinutes > 0 {
			items = append(items, dto.HeatmapItem{
				Date:  stat.Date.Format("2006-01-02"),
				Count: stat.TotalMinutes,
			})
		}
	}

	return &dto.ActivityHeatmapResponse{
		Items: items,
	}, nil
}

// GetTimeMatrix calculates study duration spread across a 24x7 grid for the past N days.
// Bins duration precisely according to start and end times spanning across hour boundaries.
func (s *AnalyticsService) GetTimeMatrix(userID string, days int) (*dto.TimeMatrixResponse, error) {
	if days <= 0 {
		days = 30 // Default to last 30 days
	}

	now := time.Now()
	startDate := now.AddDate(0, 0, -days)

	// Fetch all completed study sessions in the time range
	var sessions []model.StudySession
	err := database.DB.Where("user_id = ? AND start_time >= ? AND end_time IS NOT NULL", userID, startDate).
		Find(&sessions).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch study sessions: %w", err)
	}

	// 7 days x 24 hours grid
	grid := make([][]int, 7)
	for i := range grid {
		grid[i] = make([]int, 24)
	}

	// Process each session
	for _, session := range sessions {
		curTime := session.StartTime
		endTime := *session.EndTime

		// Distribute the duration minute-by-minute (or by chunk) into the grid.
		// Since sessions are relatively short, minute iteration is fine, but chunking is safer.
		for curTime.Before(endTime) {
			// Find the next hour boundary
			nextHour := time.Date(curTime.Year(), curTime.Month(), curTime.Day(), curTime.Hour()+1, 0, 0, 0, curTime.Location())
			
			// Determine period end (either session end or hour boundary limit)
			var periodEnd time.Time
			if endTime.Before(nextHour) {
				periodEnd = endTime
			} else {
				periodEnd = nextHour
			}

			// Calculate minutes contributed to this hour bin
			durationMinutes := int(periodEnd.Sub(curTime).Minutes())
			if durationMinutes > 0 {
				dayOfWeek := int(curTime.Weekday()) // 0 = Sunday, 6 = Saturday
				hour := curTime.Hour()
				grid[dayOfWeek][hour] += durationMinutes
			}

			curTime = periodEnd
		}
	}

	items := make([]dto.TimeMatrixItem, 0, 7*24)
	for d := 0; d < 7; d++ {
		for h := 0; h < 24; h++ {
			if grid[d][h] > 0 {
				items = append(items, dto.TimeMatrixItem{
					DayOfWeek: d,
					Hour:      h,
					Count:     grid[d][h],
				})
			}
		}
	}

	return &dto.TimeMatrixResponse{
		Items: items,
	}, nil
}
