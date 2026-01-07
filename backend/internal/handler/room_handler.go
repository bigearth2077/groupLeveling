package handler

import (
	"backend/internal/dto"
	"backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type RoomHandler struct {
	Service service.RoomService
}

func (h *RoomHandler) CreateRoom(c *gin.Context) {
	userID := c.GetString("userId")
	var req dto.CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	room, err := h.Service.CreateRoom(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dto.RoomResponse{
		ID:          room.ID,
		Name:        room.Name,
		Description: room.Description,
		TagID:       room.TagID,
		TagName:     "", // 创建时暂不查标签名，或者如果 Service 里做了 Preload 可以加
		IsPrivate:   room.IsPrivate,
		MaxMembers:  room.MaxMembers,
		CreatorID:   room.CreatorID,
		CreatedAt:   room.CreatedAt,
		OnlineCount: 0,
		HasPassword: room.Password != nil && *room.Password != "",
	})
}

func (h *RoomHandler) GetRooms(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	tagID := c.Query("tag") // 支持按标签筛选

	resp, err := h.Service.GetRooms(page, pageSize, tagID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetRoomMembers 获取成员列表
func (h *RoomHandler) GetRoomMembers(c *gin.Context) {
	roomID := c.Param("id") // 从路径参数获取 /rooms/:id/members

	members, err := h.Service.GetRoomMembers(roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": members,
		"total": len(members),
	})
}
