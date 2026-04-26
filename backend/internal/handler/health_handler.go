package handler

import (
	"backend/internal/dto"
	"backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type HealthHandler struct {
	Service *service.HealthService
}

func NewHealthHandler(s *service.HealthService) *HealthHandler {
	return &HealthHandler{Service: s}
}

// CheckIn 每日自评提交
func (h *HealthHandler) CheckIn(c *gin.Context) {
	userID := c.GetString("userId")
	var req dto.HealthCheckInRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Service.CheckIn(userID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetToday 获取今天的打卡状态
func (h *HealthHandler) GetToday(c *gin.Context) {
	userID := c.GetString("userId")

	resp, err := h.Service.GetToday(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetHistory 获取历史健康数据
func (h *HealthHandler) GetHistory(c *gin.Context) {
	userID := c.GetString("userId")

	days := 30
	if d := c.Query("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil {
			days = parsed
		}
	}

	resp, err := h.Service.GetHistory(userID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetAIReport 生成或获取最新的健康报告
func (h *HealthHandler) GetAIReport(c *gin.Context) {
	userID := c.GetString("userId")

	report, err := h.Service.GenerateHealthReport(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 将 JSON 字符串写回响应
	c.Data(http.StatusOK, "application/json", []byte(report.ReportText))
}
