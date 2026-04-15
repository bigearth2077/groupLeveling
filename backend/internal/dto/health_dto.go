package dto

type HealthCheckInRequest struct {
	SleepHours   float64 `json:"sleepHours"`
	SleepQuality string  `json:"sleepQuality"` // "bad", "okay", "great"
}
