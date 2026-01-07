package handler

import (
	"backend/internal/dto"
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type TagHandler struct {
	Service service.TagService
}

// Search (Public)
func (h *TagHandler) Search(c *gin.Context) {
	query := c.Query("q")
	
	// 如果没有查询词，返回热门标签
	if query == "" {
		tags, err := h.Service.GetPopularTags()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, tags)
		return
	}

	tags, err := h.Service.SearchTags(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tags)
}

// GetPopular (Explicit Endpoint)
func (h *TagHandler) GetPopular(c *gin.Context) {
	tags, err := h.Service.GetPopularTags()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tags)
}

// GetMyTags
func (h *TagHandler) GetMyTags(c *gin.Context) {
	userID := c.GetString("userId")
	
	tags, err := h.Service.GetUserTags(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, tags)
}

// AddTag (Attach)
func (h *TagHandler) AddTag(c *gin.Context) {
	userID := c.GetString("userId")
	var req dto.AddTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.Service.AttachTagToUser(userID, req.TagName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, res)
}

// RemoveTag (Detach)
func (h *TagHandler) RemoveTag(c *gin.Context) {
	userID := c.GetString("userId")
	tagID := c.Param("id")

	if err := h.Service.DetachTagFromUser(userID, tagID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}) // 可能是 id 不对
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
