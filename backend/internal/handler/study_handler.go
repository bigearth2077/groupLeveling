package handler

import (
	"backend/internal/dto"
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type StudyHandler struct {
	Service service.StudyService
}

// StartSession
func (h *StudyHandler) StartSession(c *gin.Context) {
	userID := c.GetString("userId")
	var req dto.StartSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sess, err := h.Service.StartSession(userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 格式化返回
	c.JSON(http.StatusCreated, dto.StudySessionResponse{
		ID:              sess.ID,
		UserID:          sess.UserID,
		Type:            sess.Type,
		StartTime:       sess.StartTime,
		EndTime:         sess.EndTime,
		DurationMinutes: sess.DurationMinutes,
		CreatedAt:       sess.CreatedAt,
	})
}

// EndSession
func (h *StudyHandler) EndSession(c *gin.Context) {
	userID := c.GetString("userId")
	sessionID := c.Param("id")
	var req dto.EndSessionRequest

	// 如果有 Body 则绑定，没有也不强制报错，因为现在后端自计算
	_ = c.ShouldBindJSON(&req)

	sess, err := h.Service.EndSession(userID, sessionID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.StudySessionResponse{
		ID:              sess.ID,
		UserID:          sess.UserID,
		Type:            sess.Type,
		StartTime:       sess.StartTime,
		EndTime:         sess.EndTime,
		DurationMinutes: sess.DurationMinutes,
		CreatedAt:       sess.CreatedAt,
	})
}

// GetActiveSession
func (h *StudyHandler) GetActiveSession(c *gin.Context) {
	userID := c.GetString("userId")

	sess, err := h.Service.GetActiveSession(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if sess == nil {
		c.JSON(http.StatusOK, nil) // 返回 null
		return
	}

	c.JSON(http.StatusOK, dto.StudySessionResponse{
		ID:              sess.ID,
		UserID:          sess.UserID,
		Type:            sess.Type,
		StartTime:       sess.StartTime,
		EndTime:         sess.EndTime,
		DurationMinutes: sess.DurationMinutes,
		CreatedAt:       sess.CreatedAt,
	})
}

// CancelActiveSession
func (h *StudyHandler) CancelActiveSession(c *gin.Context) {
	userID := c.GetString("userId")

	rowsAffected, err := h.Service.CancelActiveSession(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.DeleteActiveResponse{
		Ok:      true,
		Deleted: rowsAffected,
	})
}

// Heartbeat
func (h *StudyHandler) Heartbeat(c *gin.Context) {
	userID := c.GetString("userId")
	sessionID := c.Param("id")

	if err := h.Service.Heartbeat(userID, sessionID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GetSessions (History)
func (h *StudyHandler) GetSessions(c *gin.Context) {
	userID := c.GetString("userId")
	var query dto.GetSessionsQuery

	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.Service.GetSessionsList(userID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetStatsSummary
func (h *StudyHandler) GetStatsSummary(c *gin.Context) {
	userID := c.GetString("userId")
	var query dto.GetStatsQuery

	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.Service.GetStatsSummary(userID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}
