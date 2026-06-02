package dto

import "time"

// --- 请求 ---

type CreateBlogRequest struct {
	Title   string `json:"title" binding:"required"`
	Content string `json:"content" binding:"required"`
	Format  string `json:"format"` // "markdown" | "richtext", 默认 "markdown"
	Status  string `json:"status"` // "draft" | "published", 默认 "published"
}

type UpdateBlogRequest struct {
	Title   *string `json:"title"`
	Content *string `json:"content"`
	Format  *string `json:"format"`
	Status  *string `json:"status"`
}

type GetBlogsQuery struct {
	Page     int    `form:"page"`
	PageSize int    `form:"pageSize"`
	Tag      string `form:"tag"`      // 按标签名筛选
	Search   string `form:"search"`   // 搜索关键词
	Sort     string `form:"sort"`     // "latest" | "popular", 默认 "latest"
	UserID   string `form:"userId"`   // 按用户 ID 筛选
}

// --- 响应 ---

type BlogResponse struct {
	ID        string       `json:"id"`
	UserID    string       `json:"userId"`
	Title     string       `json:"title"`
	Content   string       `json:"content"`
	Format    string       `json:"format"`
	Summary   *string      `json:"summary"`
	Status    string       `json:"status"`
	AIQuality *string      `json:"aiQuality"`
	AIXpPerTag *int        `json:"aiXpPerTag"`

	LikeCount     int  `json:"likeCount"`
	BookmarkCount int  `json:"bookmarkCount"`

	// 当前用户的互动状态（详情页用）
	Liked      bool `json:"liked"`
	Bookmarked bool `json:"bookmarked"`

	// 关联数据
	Tags   []TagResponse      `json:"tags"`
	Author BlogAuthorResponse `json:"author"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type BlogAuthorResponse struct {
	ID        string  `json:"id"`
	Nickname  string  `json:"nickname"`
	AvatarUrl *string `json:"avatarUrl"`
}

type BlogListResponse struct {
	Items    []BlogResponse `json:"items"`
	Total    int64          `json:"total"`
	Page     int            `json:"page"`
	PageSize int            `json:"pageSize"`
}
