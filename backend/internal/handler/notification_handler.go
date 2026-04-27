package handler

import (
	"backend/internal/dto"
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	Service service.NotificationService
}

// GetNotifications 获取通知列表
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	userID := c.GetString("userId")
	var query dto.NotificationQuery

	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.Service.GetNotifications(userID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// GetUnreadCount 获取未读总数
func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	userID := c.GetString("userId")
	
	count, err := h.Service.GetUnreadCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread": count})
}

// MarkAsRead 标记单条已读
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userID := c.GetString("userId")
	notifID := c.Param("id")

	if err := h.Service.MarkAsRead(userID, notifID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// MarkAllAsRead 全部已读
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userID := c.GetString("userId")

	if err := h.Service.MarkAllAsRead(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
