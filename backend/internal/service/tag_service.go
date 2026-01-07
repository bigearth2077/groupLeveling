package service

import (
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"errors"
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type TagService struct{}

// FindOrCreateTag 查找或创建标签 (自动处理标准化)
func (s *TagService) FindOrCreateTag(name string) (*model.Tag, error) {
	name = strings.TrimSpace(strings.ToLower(name))
	if name == "" {
		return nil, errors.New("tag name cannot be empty")
	}

	var tag model.Tag
	err := database.DB.Where("name = ?", name).First(&tag).Error

	if err == nil {
		// 找到了，检查是否有别名 (ParentID)
		if tag.ParentID != nil {
			// 递归查一次父标签，确保返回的是标准标签
			var parentTag model.Tag
			if err := database.DB.Where("id = ?", tag.ParentID).First(&parentTag).Error; err == nil {
				return &parentTag, nil
			}
			// 如果父标签没找到(数据异常)，就返回当前标签
		}
		return &tag, nil
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		// 没找到，创建新的
		newTag := model.Tag{
			Name: name,
		}
		if err := database.DB.Create(&newTag).Error; err != nil {
			// 并发安全：如果刚才有人创建了，这里会报错，重新查一次
			if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
				return s.FindOrCreateTag(name)
			}
			return nil, err
		}
		return &newTag, nil
	}

	return nil, err
}

// SearchTags 搜索标签
func (s *TagService) SearchTags(query string) ([]dto.TagResponse, error) {
	query = strings.TrimSpace(strings.ToLower(query))
	var tags []model.Tag

	// 简单模糊搜索，限制 10 个
	if err := database.DB.Where("name LIKE ?", "%"+query+"%").Limit(10).Find(&tags).Error; err != nil {
		return nil, err
	}

	// 转换为 DTO
	dtos := make([]dto.TagResponse, len(tags))
	for i, t := range tags {
		dtos[i] = dto.TagResponse{
			ID:   t.ID,
			Name: t.Name,
		}
	}
	return dtos, nil
}

// AttachTagToUser 用户订阅/添加标签
func (s *TagService) AttachTagToUser(userID string, tagName string) (*dto.UserTagResponse, error) {
	// 1. 找/建 Tag (公共库)
	tag, err := s.FindOrCreateTag(tagName)
	if err != nil {
		return nil, err
	}

	// 2. 建立关联 (UserTagStat)
	// 使用 Upsert 防止重复添加报错，如果已存在则什么都不做
	userTagStat := model.UserTagStat{
		UserID: userID,
		TagID:  tag.ID,
	}

	// OnConflict Do Nothing (如果已经有了，就直接返回现有状态)
	err = database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "tag_id"}},
		DoNothing: true,
	}).Create(&userTagStat).Error

	if err != nil {
		return nil, err
	}

	// 3. 查出最新状态 (为了返回 current XP/Level)
	// 如果是刚 Create 的，TotalMinutes 是 0
	// 如果 DoNothing，可能原来就有 XP
	var freshStat model.UserTagStat
	if err := database.DB.Where("user_id = ? AND tag_id = ?", userID, tag.ID).First(&freshStat).Error; err != nil {
		return nil, err
	}

	// 计算等级
	levelService := &LevelService{}
	levelInfo := levelService.CalculateLevel(freshStat.TotalMinutes)

	return &dto.UserTagResponse{
		TagID:        tag.ID,
		TagName:      tag.Name,
		TotalMinutes: freshStat.TotalMinutes,
		Level:        levelInfo,
		LastStudied:  freshStat.UpdatedAt, // 粗略用 UpdatedAt 近似
	}, nil
}

// DetachTagFromUser 用户移除标签
func (s *TagService) DetachTagFromUser(userID string, tagID string) error {
	// 物理删除关系
	result := database.DB.Where("user_id = ? AND tag_id = ?", userID, tagID).Delete(&model.UserTagStat{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("tag not found in your list")
	}
	return nil
}

// GetUserTags 获取用户的标签列表
func (s *TagService) GetUserTags(userID string) ([]dto.UserTagResponse, error) {
	var stats []model.UserTagStat

	// 预加载 Tag 信息，按最近更新排序
	if err := database.DB.Preload("Tag").
		Where("user_id = ?", userID).
		Order("updated_at DESC").
		Find(&stats).Error; err != nil {
		return nil, err
	}

	levelService := &LevelService{}
	res := make([]dto.UserTagResponse, len(stats))

	for i, stat := range stats {
		levelInfo := levelService.CalculateLevel(stat.TotalMinutes)
		res[i] = dto.UserTagResponse{
			TagID:        stat.TagID,
			TagName:      stat.Tag.Name,
			TotalMinutes: stat.TotalMinutes,
			Level:        levelInfo,
			LastStudied:  stat.UpdatedAt,
		}
	}

	return res, nil
}

// GetPopularTags 获取热门标签 (按订阅人数排序)
func (s *TagService) GetPopularTags() ([]dto.TagResponse, error) {
	var results []struct {
		ID    string
		Name  string
		Count int
	}

	// 聚合查询：count(user_id) 
	// JOIN tags on user_tag_stats.tag_id = tags.id
	err := database.DB.Table("user_tag_stats").
		Select("tags.id, tags.name, count(user_tag_stats.user_id) as count").
		Joins("JOIN tags ON tags.id = user_tag_stats.tag_id").
		Group("tags.id, tags.name").
		Order("count DESC").
		Limit(20).
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	dtos := make([]dto.TagResponse, len(results))
	for i, r := range results {
		dtos[i] = dto.TagResponse{
			ID:   r.ID,
			Name: r.Name,
		}
	}
	return dtos, nil
}

