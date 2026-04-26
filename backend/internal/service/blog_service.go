package service

import (
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"errors"
	"log"
	"strings"
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type BlogService struct {
	AIService *AIService
}

// CreateBlog 创建博客
func (s *BlogService) CreateBlog(userID string, req dto.CreateBlogRequest) (*model.Blog, error) {
	format := "markdown"
	if req.Format == "richtext" {
		format = "richtext"
	}

	status := model.BlogStatusPublished
	if req.Status == "draft" {
		status = model.BlogStatusDraft
	}

	blog := model.Blog{
		UserID:  userID,
		Title:   req.Title,
		Content: req.Content,
		Format:  format,
		Status:  status,
	}

	// 开始落库
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		// 先保存博客本体
		if err := tx.Create(&blog).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	// 只有发布且字数 >= 200 才触发 AI（后台异步执行）
	if status == model.BlogStatusPublished && len([]rune(blog.Content)) >= 200 {
		go func(bID string, uID string) {
			// 在后台重新获取 blog 对象进行分析，避免并发读写内存对象
			if err := s.processAITaggingAndXP(bID, uID); err != nil {
				log.Printf("[BlogService] Async AI Analysis failed for blog %s: %v", bID, err)
			}
		}(blog.ID, userID)
	}

	if err != nil {
		return nil, err
	}

	// 重新查询以获取完整数据（含 User 预加载）
	if err := database.DB.Preload("User").Preload("BlogTags").First(&blog, "id = ?", blog.ID).Error; err != nil {
		return nil, err
	}

	return &blog, nil
}

// GetBlog 获取单篇博客
func (s *BlogService) GetBlog(blogID string) (*model.Blog, error) {
	var blog model.Blog
	err := database.DB.Preload("User").Preload("BlogTags").
		First(&blog, "id = ?", blogID).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("blog not found")
	}
	return &blog, err
}

// GetBlogs 分页获取博客列表
func (s *BlogService) GetBlogs(q dto.GetBlogsQuery) (*dto.BlogListResponse, error) {
	var blogs []model.Blog
	var total int64

	db := database.DB.Model(&model.Blog{}).Where("status = ?", model.BlogStatusPublished)

	// 按用户筛选
	if q.UserID != "" {
		db = db.Where("user_id = ?", q.UserID)
	}

	// 搜索
	if q.Search != "" {
		search := "%" + strings.ToLower(q.Search) + "%"
		db = db.Where("LOWER(title) LIKE ? OR LOWER(content) LIKE ?", search, search)
	}

	// 按标签筛选
	if q.Tag != "" {
		tagSearch := strings.ToLower(q.Tag)
		db = db.Where("id IN (SELECT blog_id FROM blog_tags bt JOIN tags t ON bt.tag_id = t.id WHERE LOWER(t.name) = ?)", tagSearch)
	}

	// 统计总数
	db.Count(&total)

	// 分页参数
	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize < 1 || pageSize > 50 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	// 排序
	orderBy := "created_at DESC"
	if q.Sort == "popular" {
		orderBy = "like_count DESC, created_at DESC"
	}

	err := db.Preload("User").Preload("BlogTags").
		Order(orderBy).Offset(offset).Limit(pageSize).
		Find(&blogs).Error
	if err != nil {
		return nil, err
	}

	// 转换为 Response DTO
	items := make([]dto.BlogResponse, len(blogs))
	for i, b := range blogs {
		items[i] = s.ToBlogResponsePublic(&b, "")
	}

	return &dto.BlogListResponse{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

// GetMyBlogs 获取当前用户的博客（含草稿）
func (s *BlogService) GetMyBlogs(userID string, q dto.GetBlogsQuery) (*dto.BlogListResponse, error) {
	var blogs []model.Blog
	var total int64

	db := database.DB.Model(&model.Blog{}).Where("user_id = ?", userID)

	db.Count(&total)

	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize < 1 || pageSize > 50 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	err := db.Preload("User").Preload("BlogTags").
		Order("created_at DESC").Offset(offset).Limit(pageSize).
		Find(&blogs).Error
	if err != nil {
		return nil, err
	}

	items := make([]dto.BlogResponse, len(blogs))
	for i, b := range blogs {
		items[i] = s.ToBlogResponsePublic(&b, userID)
	}

	return &dto.BlogListResponse{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

// UpdateBlog 更新博客
func (s *BlogService) UpdateBlog(userID, blogID string, req dto.UpdateBlogRequest) (*model.Blog, error) {
	var blog model.Blog
	if err := database.DB.First(&blog, "id = ? AND user_id = ?", blogID, userID).Error; err != nil {
		return nil, errors.New("blog not found or not owned by you")
	}

	updates := map[string]interface{}{}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Content != nil {
		updates["content"] = *req.Content
	}
	if req.Format != nil {
		updates["format"] = *req.Format
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}

	if len(updates) > 0 {
		if err := database.DB.Model(&blog).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	// 如果内容或状态改变，并且是发布状态，且字数足够，触发 AI 重新评估
	// 简单起见，如果之前没有 AI 分析过（AIQuality == nil），才在编辑时触发，避免重复刷经验
	// 或者要求每次编辑都重新评估？为了防刷经验，这里如果是从 draft -> published 才触发
	if req.Status != nil && *req.Status == "published" && blog.AIQuality == nil && len([]rune(blog.Content)) >= 200 {
		go func(bID string, uID string) {
			if err := s.processAITaggingAndXP(bID, uID); err != nil {
				log.Printf("[BlogService] Async AI Analysis failed during update for blog %s: %v", bID, err)
			}
		}(blogID, userID)
	}

	// 重新加载
	if err := database.DB.Preload("User").Preload("BlogTags").First(&blog, "id = ?", blogID).Error; err != nil {
		return nil, err
	}

	return &blog, nil
}

// DeleteBlog 删除博客
func (s *BlogService) DeleteBlog(userID, blogID string) error {
	result := database.DB.Where("id = ? AND user_id = ?", blogID, userID).Delete(&model.Blog{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("blog not found or not owned by you")
	}
	return nil
}

// LikeBlog 点赞
func (s *BlogService) LikeBlog(userID, blogID string) error {
	// 检查博客是否存在
	var blog model.Blog
	if err := database.DB.First(&blog, "id = ?", blogID).Error; err != nil {
		return errors.New("blog not found")
	}

	like := model.BlogLike{
		BlogID: blogID,
		UserID: userID,
	}

	// 尝试创建，忽略唯一约束冲突（幂等操作）
	result := database.DB.Where("blog_id = ? AND user_id = ?", blogID, userID).FirstOrCreate(&like)
	if result.Error != nil {
		return result.Error
	}

	// 只有新创建时才更新计数并给作者发 XP
	if result.RowsAffected > 0 {
		database.DB.Model(&blog).UpdateColumn("like_count", gorm.Expr("like_count + 1"))

		// 发放 XP 给作者 (点赞：基础1, good*2, excellent*3)
		xp := 1
		if blog.AIQuality != nil {
			if *blog.AIQuality == model.BlogQualityGood {
				xp = 2
			} else if *blog.AIQuality == model.BlogQualityExcellent {
				xp = 3
			}
		}
		
		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
		
		dailyStat := model.DailyStat{
			UserID:       blog.UserID, // 发给作者
			Date:         today,
			TotalMinutes: xp,
		}
		database.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "user_id"}, {Name: "date"}},
			DoUpdates: clause.Assignments(map[string]interface{}{
				"total_minutes": gorm.Expr("daily_stats.total_minutes + ?", xp),
			}),
		}).Create(&dailyStat)
	}

	return nil
}

// UnlikeBlog 取消点赞
func (s *BlogService) UnlikeBlog(userID, blogID string) error {
	result := database.DB.Where("blog_id = ? AND user_id = ?", blogID, userID).Delete(&model.BlogLike{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected > 0 {
		database.DB.Model(&model.Blog{}).Where("id = ?", blogID).
			UpdateColumn("like_count", gorm.Expr("GREATEST(like_count - 1, 0)"))
	}
	return nil
}

// BookmarkBlog 收藏
func (s *BlogService) BookmarkBlog(userID, blogID string) error {
	var blog model.Blog
	if err := database.DB.First(&blog, "id = ?", blogID).Error; err != nil {
		return errors.New("blog not found")
	}

	bm := model.BlogBookmark{
		BlogID: blogID,
		UserID: userID,
	}

	result := database.DB.Where("blog_id = ? AND user_id = ?", blogID, userID).FirstOrCreate(&bm)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected > 0 {
		database.DB.Model(&blog).UpdateColumn("bookmark_count", gorm.Expr("bookmark_count + 1"))

		// 发放 XP 给作者 (收藏：基础2, good*3, excellent*5)
		xp := 2
		if blog.AIQuality != nil {
			if *blog.AIQuality == model.BlogQualityGood {
				xp = 3
			} else if *blog.AIQuality == model.BlogQualityExcellent {
				xp = 5
			}
		}
		
		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
		
		dailyStat := model.DailyStat{
			UserID:       blog.UserID, // 发给作者
			Date:         today,
			TotalMinutes: xp,
		}
		database.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "user_id"}, {Name: "date"}},
			DoUpdates: clause.Assignments(map[string]interface{}{
				"total_minutes": gorm.Expr("daily_stats.total_minutes + ?", xp),
			}),
		}).Create(&dailyStat)
	}

	return nil
}

// UnbookmarkBlog 取消收藏
func (s *BlogService) UnbookmarkBlog(userID, blogID string) error {
	result := database.DB.Where("blog_id = ? AND user_id = ?", blogID, userID).Delete(&model.BlogBookmark{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected > 0 {
		database.DB.Model(&model.Blog{}).Where("id = ?", blogID).
			UpdateColumn("bookmark_count", gorm.Expr("GREATEST(bookmark_count - 1, 0)"))
	}
	return nil
}

// CheckUserInteraction 检查用户对博客的点赞/收藏状态
func (s *BlogService) CheckUserInteraction(userID, blogID string) (liked bool, bookmarked bool) {
	if userID == "" {
		return false, false
	}

	var likeCount int64
	database.DB.Model(&model.BlogLike{}).
		Where("blog_id = ? AND user_id = ?", blogID, userID).
		Count(&likeCount)
	liked = likeCount > 0

	var bmCount int64
	database.DB.Model(&model.BlogBookmark{}).
		Where("blog_id = ? AND user_id = ?", blogID, userID).
		Count(&bmCount)
	bookmarked = bmCount > 0

	return
}

// ToBlogResponsePublic 模型转 DTO（公开方法，供 Handler 调用）
func (s *BlogService) ToBlogResponsePublic(blog *model.Blog, currentUserID string) dto.BlogResponse {
	tags := make([]dto.TagResponse, len(blog.BlogTags))
	for i, t := range blog.BlogTags {
		tags[i] = dto.TagResponse{
			ID:   t.ID,
			Name: t.Name,
		}
	}

	var aiQuality *string
	if blog.AIQuality != nil {
		q := string(*blog.AIQuality)
		aiQuality = &q
	}

	liked, bookmarked := false, false
	if currentUserID != "" {
		liked, bookmarked = s.CheckUserInteraction(currentUserID, blog.ID)
	}

	return dto.BlogResponse{
		ID:            blog.ID,
		UserID:        blog.UserID,
		Title:         blog.Title,
		Content:       blog.Content,
		Format:        blog.Format,
		Summary:       blog.Summary,
		Status:        string(blog.Status),
		AIQuality:     aiQuality,
		AIXpPerTag:    blog.AIXpPerTag,
		LikeCount:     blog.LikeCount,
		BookmarkCount: blog.BookmarkCount,
		Liked:         liked,
		Bookmarked:    bookmarked,
		Tags:          tags,
		Author: dto.BlogAuthorResponse{
			ID:        blog.User.ID,
			Nickname:  blog.User.Nickname,
			AvatarUrl: blog.User.AvatarUrl,
		},
		CreatedAt: blog.CreatedAt,
		UpdatedAt: blog.UpdatedAt,
	}
}

// processAITaggingAndXP 内部辅助方法，异步调用 AI 并处理 Tag 和 XP
func (s *BlogService) processAITaggingAndXP(blogID string, userID string) error {
	if s.AIService == nil {
		return errors.New("AIService not initialized")
	}

	// 1. 获取博客内容
	var blog model.Blog
	if err := database.DB.First(&blog, "id = ?", blogID).Error; err != nil {
		return err
	}

	// 2. 获取最热门的 10 个标签，作为 AI 的参考
	var popStats []model.UserTagStat
	database.DB.Model(&model.UserTagStat{}).
		Select("tag_id, SUM(total_minutes) as total_minutes").
		Group("tag_id").
		Order("total_minutes DESC").
		Limit(10).
		Preload("Tag").
		Find(&popStats)

	var popTagNames []string
	for _, pt := range popStats {
		if pt.Tag.Name != "" {
			popTagNames = append(popTagNames, pt.Tag.Name)
		}
	}

	// 2. 调用 AI
	aiRes, err := s.AIService.AnalyzeBlogContent(blog.Title, blog.Content, popTagNames)
	if err != nil {
		return err
	}

	// 3. 处理标签 (Find or Create)
	var finalTags []model.Tag
	var finalTagIDs pq.StringArray

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		for _, tagName := range aiRes.Tags {
			name := strings.ToLower(strings.TrimSpace(tagName))
			if name == "" {
				continue
			}
			var tag model.Tag
			if err := tx.Where("name = ?", name).FirstOrCreate(&tag, model.Tag{Name: name}).Error; err == nil {
				finalTags = append(finalTags, tag)
				finalTagIDs = append(finalTagIDs, tag.ID)
			}
		}

		// 4. 关联标签到博客
		if len(finalTags) > 0 {
			if err := tx.Model(&blog).Association("BlogTags").Replace(finalTags); err != nil {
				return err
			}
		}

		// 5. 更新博客的 AI 字段
		quality := model.BlogQuality(aiRes.Quality)

		updates := map[string]interface{}{
			"summary":       aiRes.Summary,
			"ai_tag_ids":    finalTagIDs,
			"ai_quality":    quality,
			"ai_xp_per_tag": aiRes.XpPerTag,
		}
		if err := tx.Model(&blog).Updates(updates).Error; err != nil {
			return err
		}

		// 6. 发放 XP (更新 UserTagStat 和 DailyStat)
		if aiRes.XpPerTag > 0 && len(finalTags) > 0 {
			now := time.Now()
			today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
			totalXPAdded := 0

			for _, tag := range finalTags {
				stat := model.UserTagStat{
					UserID: userID,
					TagID:  tag.ID,
				}
				// Upsert UserTagStat
				if err := tx.Clauses(clause.OnConflict{
					Columns:   []clause.Column{{Name: "user_id"}, {Name: "tag_id"}},
					DoUpdates: clause.Assignments(map[string]interface{}{
						"total_minutes": gorm.Expr("user_tag_stats.total_minutes + ?", aiRes.XpPerTag),
					}),
				}).Create(&stat).Error; err != nil {
					return err
				}
				totalXPAdded += aiRes.XpPerTag
			}

			// Upsert DailyStat
			dailyStat := model.DailyStat{
				UserID:       userID,
				Date:         today,
				TotalMinutes: totalXPAdded,
			}
			if err := tx.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "user_id"}, {Name: "date"}},
				DoUpdates: clause.Assignments(map[string]interface{}{
					"total_minutes": gorm.Expr("daily_stats.total_minutes + ?", totalXPAdded),
				}),
			}).Create(&dailyStat).Error; err != nil {
				return err
			}
		}
		return nil
	})

	return err
}
