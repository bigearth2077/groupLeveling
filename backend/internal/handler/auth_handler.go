package handler

import (
	"backend/internal/dto"
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	Service service.AuthService
}

// Register
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Service 返回了两个 token
	user, at, rt, err := h.Service.Register(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 构造扁平化返回
	resp := dto.RegisterResponse{
		ID:           user.ID,
		Email:        user.Email,
		Nickname:     user.Nickname,
		AccessToken:  at,
		RefreshToken: rt,
	}

	c.JSON(http.StatusCreated, resp)
}

// Login
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, at, rt, err := h.Service.Login(req)
	if err != nil {
		// 登录失败通常返回 401
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// 构造嵌套返回
	resp := dto.LoginResponse{
		AccessToken:  at,
		RefreshToken: rt,
		User: struct {
			ID       string `json:"id"`
			Email    string `json:"email"`
			Nickname string `json:"nickname"`
		}{
			ID:       user.ID,
			Email:    user.Email,
			Nickname: user.Nickname,
		},
	}

	c.JSON(http.StatusOK, resp)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req dto.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 接收两个 Token
	newAT, newRT, err := h.Service.Refresh(req)
	if err != nil {
		// 401 Unauthorized 让前端知道需要跳转登录页
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// 返回一对新的
	c.JSON(http.StatusOK, dto.RefreshResponse{
		AccessToken:  newAT,
		RefreshToken: newRT,
	})
}
