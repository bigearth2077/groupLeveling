package handler

import (
	"backend/internal/service"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type RankingHandler struct {
	Service service.RankingService
}

// GetGlobalRankings 全站榜单
func (h *RankingHandler) GetGlobalRankings(c *gin.Context) {
	// Query 参数解析
	scopeStr := c.DefaultQuery("scope", "week") // 简化，这里假设只传单个 scope，如果前端传 array 需要额外处理
	// 兼容前端传 array 格式 ?scope=week&scope=all 实际上我们通常一次返回一个榜单
	// 或者如果前端传的是 scope=["week"] 字符串，需要 strings.Trim
	// 根据你的接口文档：Query 参数 scope 是 string，但示例值是 ["week|all"]，通常 RESTful 推荐 ?scope=week
	// 这里我们简单处理：默认取 week，如果传了就用传的

	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 {
		limit = 50
	}

	// 处理 scope
	// 如果业务需要一次返回 "items": [weekList, allList]，结构体会很复杂。
	// 这里假设一次请求只返回一种 scope 的列表，或者根据业务逻辑默认返回 week
	targetScope := "week"
	if strings.Contains(scopeStr, "all") {
		targetScope = "all"
	}
	
	tagName := c.Query("tag")

	items, err := h.Service.GetGlobalRankings(targetScope, limit, tagName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
	})
}

// GetFriendRankings 好友榜单
func (h *RankingHandler) GetFriendRankings(c *gin.Context) {
	userID := c.GetString("userId")
	scopeStr := c.DefaultQuery("scope", "week")
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 {
		limit = 50
	}

	targetScope := "week"
	if strings.Contains(scopeStr, "all") {
		targetScope = "all"
	}

	items, err := h.Service.GetFriendRankings(userID, targetScope, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
	})
}
