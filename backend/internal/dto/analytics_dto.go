package dto

// HeatmapItem represents a single day's total study minutes
type HeatmapItem struct {
	Date  string `json:"date"`  // format: YYYY-MM-DD
	Count int    `json:"count"` // total minutes for that day
}

// ActivityHeatmapResponse is the response for the activity heatmap (year view)
type ActivityHeatmapResponse struct {
	Items []HeatmapItem `json:"items"`
}

// TimeMatrixItem represents the study duration for a specific day of week and hour
type TimeMatrixItem struct {
	DayOfWeek int `json:"day"`   // 0: Sunday, 1: Monday, ..., 6: Saturday
	Hour      int `json:"hour"`  // 0 - 23
	Count     int `json:"count"` // total minutes
}

// TimeMatrixResponse is the response for the 24-hour distribution matrix
type TimeMatrixResponse struct {
	Items []TimeMatrixItem `json:"items"`
}
