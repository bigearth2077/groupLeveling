package handler

import (
	"backend/internal/dto"
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type HealthHandler struct {
	Service *service.HealthService
}

func NewHealthHandler(s *service.HealthService) *HealthHandler {
	return &HealthHandler{Service: s}
}

// CheckIn records morning sleep status
func (h *HealthHandler) CheckIn(c *gin.Context) {
	userID := c.GetString("userId")
	var req dto.HealthCheckInRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Service.CheckIn(userID, req.SleepHours, req.SleepQuality); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
