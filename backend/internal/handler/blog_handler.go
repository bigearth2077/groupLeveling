package handler

import (
	"backend/internal/dto"
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type BlogHandler struct {
	Service *service.BlogService
}

func NewBlogHandler(s *service.BlogService) *BlogHandler {
	return &BlogHandler{Service: s}
}

// CreateBlog 创建博客
func (h *BlogHandler) CreateBlog(c *gin.Context) {
	userID := c.GetString("userId")
	var req dto.CreateBlogRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	blog, err := h.Service.CreateBlog(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := h.Service.ToBlogResponsePublic(blog, userID)
	c.JSON(http.StatusCreated, resp)
}

// GetBlog 获取单篇博客详情
func (h *BlogHandler) GetBlog(c *gin.Context) {
	userID := c.GetString("userId")
	blogID := c.Param("id")

	blog, err := h.Service.GetBlog(blogID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	resp := h.Service.ToBlogResponsePublic(blog, userID)
	c.JSON(http.StatusOK, resp)
}

// GetBlogs 博客广场（公开已发布的博客列表）
func (h *BlogHandler) GetBlogs(c *gin.Context) {
	var q dto.GetBlogsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.Service.GetBlogs(q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetMyBlogs 获取当前用户的博客（含草稿）
func (h *BlogHandler) GetMyBlogs(c *gin.Context) {
	userID := c.GetString("userId")
	var q dto.GetBlogsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.Service.GetMyBlogs(userID, q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// UpdateBlog 更新博客
func (h *BlogHandler) UpdateBlog(c *gin.Context) {
	userID := c.GetString("userId")
	blogID := c.Param("id")
	var req dto.UpdateBlogRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	blog, err := h.Service.UpdateBlog(userID, blogID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp := h.Service.ToBlogResponsePublic(blog, userID)
	c.JSON(http.StatusOK, resp)
}

// DeleteBlog 删除博客
func (h *BlogHandler) DeleteBlog(c *gin.Context) {
	userID := c.GetString("userId")
	blogID := c.Param("id")

	if err := h.Service.DeleteBlog(userID, blogID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// LikeBlog 点赞
func (h *BlogHandler) LikeBlog(c *gin.Context) {
	userID := c.GetString("userId")
	blogID := c.Param("id")

	if err := h.Service.LikeBlog(userID, blogID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// UnlikeBlog 取消点赞
func (h *BlogHandler) UnlikeBlog(c *gin.Context) {
	userID := c.GetString("userId")
	blogID := c.Param("id")

	if err := h.Service.UnlikeBlog(userID, blogID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// BookmarkBlog 收藏
func (h *BlogHandler) BookmarkBlog(c *gin.Context) {
	userID := c.GetString("userId")
	blogID := c.Param("id")

	if err := h.Service.BookmarkBlog(userID, blogID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// UnbookmarkBlog 取消收藏
func (h *BlogHandler) UnbookmarkBlog(c *gin.Context) {
	userID := c.GetString("userId")
	blogID := c.Param("id")

	if err := h.Service.UnbookmarkBlog(userID, blogID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetUserBlogs 获取指定用户的公开博客
func (h *BlogHandler) GetUserBlogs(c *gin.Context) {
	targetUserID := c.Param("id")
	var q dto.GetBlogsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	q.UserID = targetUserID

	resp, err := h.Service.GetBlogs(q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}
