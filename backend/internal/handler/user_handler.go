package handler

import (
	"net/http"
	"strconv"

	"backend/internal/dto"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	Service service.UserService
}

// GetMe 获取当前用户信息
func (h *UserHandler) GetMe(c *gin.Context) {
	userID := c.GetString("userId") // 从中间件获取

	user, err := h.Service.GetProfile(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, dto.UserProfileResponse{
		ID:        user.ID,
		Email:     user.Email,
		Nickname:  user.Nickname,
		AvatarURL: user.AvatarUrl,
		Bio:       user.Bio,
	})
}

// UpdateMe 更新资料
func (h *UserHandler) UpdateMe(c *gin.Context) {
	userID := c.GetString("userId")
	var req dto.UpdateProfileRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedUser, err := h.Service.UpdateProfile(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.UserProfileResponse{
		ID:        updatedUser.ID,
		Email:     updatedUser.Email,
		Nickname:  updatedUser.Nickname,
		AvatarURL: updatedUser.AvatarUrl,
		Bio:       updatedUser.Bio,
	})
}

// ChangePassword 修改密码
func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID := c.GetString("userId")
	var req dto.ChangePasswordRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Service.ChangePassword(userID, req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}) // 密码错误返回 400
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetPublicProfile 获取他人公开资料
func (h *UserHandler) GetPublicProfile(c *gin.Context) {
	targetID := c.Param("id")

	profile, err := h.Service.GetPublicProfile(targetID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// SearchUsers 搜索用户
func (h *UserHandler) SearchUsers(c *gin.Context) {
	query := c.Query("query")
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("pageSize", "20")

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter is required"})
		return
	}

	page, _ := strconv.Atoi(pageStr)
	pageSize, _ := strconv.Atoi(pageSizeStr)

	result, err := h.Service.SearchUsers(query, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// DeleteAccount 注销账号
func (h *UserHandler) DeleteAccount(c *gin.Context) {
	userID := c.GetString("userId")

	if err := h.Service.DeleteAccount(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
