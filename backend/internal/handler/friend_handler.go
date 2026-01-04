package handler

import (
	"backend/internal/dto"
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type FriendHandler struct {
	Service service.FriendService
}

// SendRequest
func (h *FriendHandler) SendRequest(c *gin.Context) {
	userID := c.GetString("userId")
	var req dto.SendFriendRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, isMatched, err := h.Service.SendRequest(userID, req.FriendID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	// 构造返回
	response := gin.H{
		"id":        result.ID,
		"userId":    result.UserID,
		"friendId":  result.FriendID,
		"status":    result.Status,
		"createdAt": result.CreatedAt,
	}

	// 如果是新建的 pending，返回 201；如果是自动接受（匹配已有），通常返回 200 或 201 均可，
	// 根据你的文档示例，"成功（对方已有pending直接接受）" 也是返回完整对象。
	// 这里统一用 201 或者根据 isMatched 区分
	if isMatched {
		c.JSON(http.StatusOK, response) // 状态改变
	} else {
		c.JSON(http.StatusCreated, response) // 新建
	}
}

// GetIncomingRequests
func (h *FriendHandler) GetIncomingRequests(c *gin.Context) {
	userID := c.GetString("userId")
	var query dto.FriendQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.Service.GetIncomingRequests(userID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetOutgoingRequests
func (h *FriendHandler) GetOutgoingRequests(c *gin.Context) {
	userID := c.GetString("userId")
	var query dto.FriendQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.Service.GetOutgoingRequests(userID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// HandleRequest
func (h *FriendHandler) HandleRequest(c *gin.Context) {
	userID := c.GetString("userId")
	reqID := c.Param("id")
	var req dto.ActFriendRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.Service.HandleRequest(userID, reqID, req.Action)
	if err != nil {
		if err.Error() == "request not found" {
			c.JSON(http.StatusNotFound, gin.H{"message": "Request not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	if req.Action == "reject" {
		c.JSON(http.StatusOK, gin.H{"ok": true})
		return
	}

	// Accept 返回更新后的对象
	c.JSON(http.StatusCreated, gin.H{
		"id":        result.ID,
		"userId":    result.UserID,
		"friendId":  result.FriendID,
		"status":    result.Status,
		"createdAt": result.CreatedAt,
	})
}

// GetFriendList
func (h *FriendHandler) GetFriendList(c *gin.Context) {
	userID := c.GetString("userId")
	var query dto.FriendQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.Service.GetFriendList(userID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// DeleteFriend
func (h *FriendHandler) DeleteFriend(c *gin.Context) {
	userID := c.GetString("userId")
	otherID := c.Param("id") // 注意路由参数名

	err := h.Service.DeleteFriend(userID, otherID)
	if err != nil {
		if err.Error() == "friend relation not found" {
			c.JSON(http.StatusNotFound, gin.H{"message": "Friend relation not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
