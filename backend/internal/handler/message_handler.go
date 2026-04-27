package handler

import (
	"backend/internal/dto"
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type MessageHandler struct {
	Service service.MessageService
}

// GetHistory 获取私信历史
func (h *MessageHandler) GetHistory(c *gin.Context) {
	userID := c.GetString("userId")
	var query dto.MessageHistoryQuery

	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.Service.GetMessageHistory(userID, query.FriendID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// GetUnread 获取未读私信总数
func (h *MessageHandler) GetUnread(c *gin.Context) {
	userID := c.GetString("userId")
	
	count, err := h.Service.GetUnreadCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread": count})
}

// GetUnreadPerFriend 获取每个好友分别的未读消息数
func (h *MessageHandler) GetUnreadPerFriend(c *gin.Context) {
	userID := c.GetString("userId")
	
	counts, err := h.Service.GetUnreadCountsPerFriend(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, counts)
}
