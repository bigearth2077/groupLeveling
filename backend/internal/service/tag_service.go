package service

import (
	"backend/internal/model"
	"backend/pkg/database"
	"errors"
	"strings"

	"gorm.io/gorm"
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
func (s *TagService) SearchTags(query string) ([]model.Tag, error) {
	query = strings.TrimSpace(strings.ToLower(query))
	var tags []model.Tag
	// 简单模糊搜索，限制 10 个
	err := database.DB.Where("name LIKE ?", "%"+query+"%").Limit(10).Find(&tags).Error
	return tags, err
}
