package service

import (
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
)

type NotificationService struct{}

// CreateNotification 创建系统通知（供其他模块调用）
func (s *NotificationService) CreateNotification(userID string, nType model.NotificationType, title, content string, relatedID *string) (*dto.NotificationResponse, error) {
	n := model.Notification{
		UserID:    userID,
		Type:      nType,
		Title:     title,
		Content:   content,
		RelatedID: relatedID,
	}

	if err := database.DB.Create(&n).Error; err != nil {
		return nil, err
	}

	return s.mapToResponse(n), nil
}

// GetNotifications 获取通知列表
func (s *NotificationService) GetNotifications(userID string, q dto.NotificationQuery) (*dto.NotificationListResponse, error) {
	var notifications []model.Notification
	var total int64

	db := database.DB.Model(&model.Notification{}).Where("user_id = ?", userID)
	db.Count(&total)

	offset := (q.Page - 1) * q.PageSize
	err := db.Order("created_at DESC").
		Offset(offset).Limit(q.PageSize).
		Find(&notifications).Error

	if err != nil {
		return nil, err
	}

	items := make([]dto.NotificationResponse, len(notifications))
	for i, n := range notifications {
		items[i] = *s.mapToResponse(n)
	}

	return &dto.NotificationListResponse{
		Items:    items,
		Total:    total,
		Page:     q.Page,
		PageSize: q.PageSize,
	}, nil
}

// GetUnreadCount 获取未读通知总数
func (s *NotificationService) GetUnreadCount(userID string) (int64, error) {
	var count int64
	err := database.DB.Model(&model.Notification{}).
		Where("user_id = ? AND is_read = false", userID).
		Count(&count).Error
	return count, err
}

// MarkAsRead 标记单条已读
func (s *NotificationService) MarkAsRead(userID, notifID string) error {
	return database.DB.Model(&model.Notification{}).
		Where("id = ? AND user_id = ?", notifID, userID).
		Update("is_read", true).Error
}

// MarkAllAsRead 一键全读
func (s *NotificationService) MarkAllAsRead(userID string) error {
	return database.DB.Model(&model.Notification{}).
		Where("user_id = ? AND is_read = false", userID).
		Update("is_read", true).Error
}

func (s *NotificationService) mapToResponse(n model.Notification) *dto.NotificationResponse {
	return &dto.NotificationResponse{
		ID:        n.ID,
		UserID:    n.UserID,
		Type:      n.Type,
		Title:     n.Title,
		Content:   n.Content,
		RelatedID: n.RelatedID,
		IsRead:    n.IsRead,
		CreatedAt: n.CreatedAt,
	}
}
