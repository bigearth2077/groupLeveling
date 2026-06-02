package handler

import (
	"backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AnalyticsHandler struct {
	Service *service.AnalyticsService
}

func NewAnalyticsHandler(s *service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{Service: s}
}

// GetActivityHeatmap returns data for the yearly contribution graph
func (h *AnalyticsHandler) GetActivityHeatmap(c *gin.Context) {
	userID := c.GetString("userId")
	yearStr := c.Query("year")
	
	year := 0
	if yearStr != "" {
		if y, err := strconv.Atoi(yearStr); err == nil {
			year = y
		}
	}

	resp, err := h.Service.GetActivityHeatmap(userID, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetTimeMatrix returns data for the 24x7 time-of-day matrix
func (h *AnalyticsHandler) GetTimeMatrix(c *gin.Context) {
	userID := c.GetString("userId")
	daysStr := c.Query("days")
	
	days := 30
	if daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil {
			days = d
		}
	}

	resp, err := h.Service.GetTimeMatrix(userID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}
