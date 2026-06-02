package handler

import (
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AIHandler struct {
	Service *service.AIService
}

func NewAIHandler(aiService *service.AIService) *AIHandler {
	return &AIHandler{Service: aiService}
}

// GenerateRoomChat 生成房间模拟聊天消息
func (h *AIHandler) GenerateRoomChat(c *gin.Context) {
	roomName := c.Query("roomName")
	tags := c.Query("tags")

	if roomName == "" {
		roomName = "自习室"
	}

	messages, err := h.Service.GenerateRoomChat(roomName, tags)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}
