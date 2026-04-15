package service

import (
	"backend/internal/model"
	"backend/pkg/database"
	"time"

	"gorm.io/gorm/clause"
)

type HealthService struct{}

func (s *HealthService) CheckIn(userID string, sleepHours float64, quality string) error {
	now := time.Now()
	// Normalize to UTC 0:00 for the day
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)

	err := database.DB.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "user_id"}, {Name: "date"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"sleep_hours":   sleepHours,
			"sleep_quality": quality,
		}),
	}).Create(&model.HealthData{
		UserID:       userID,
		Date:         today,
		SleepHours:   &sleepHours,
		SleepQuality: &quality,
	}).Error

	return err
}
