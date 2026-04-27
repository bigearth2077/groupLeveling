package service

import (
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
)

type MessageService struct{}

// SaveMessage 保存私信并返回 DTO
func (s *MessageService) SaveMessage(senderID, receiverID, content string) (*dto.MessageResponse, error) {
	msg := model.Message{
		SenderID:   senderID,
		ReceiverID: receiverID,
		Content:    content,
		IsRead:     false,
	}

	if err := database.DB.Create(&msg).Error; err != nil {
		return nil, err
	}

	return &dto.MessageResponse{
		ID:         msg.ID,
		SenderID:   msg.SenderID,
		ReceiverID: msg.ReceiverID,
		Content:    msg.Content,
		IsRead:     msg.IsRead,
		CreatedAt:  msg.CreatedAt,
	}, nil
}

// GetMessageHistory 获取聊天历史记录 (双向)
func (s *MessageService) GetMessageHistory(userID, friendID string, q dto.MessageHistoryQuery) (*dto.MessageHistoryResponse, error) {
	var messages []model.Message
	var total int64

	db := database.DB.Model(&model.Message{}).
		Where("(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
			userID, friendID, friendID, userID)

	db.Count(&total)

	offset := (q.Page - 1) * q.PageSize
	// 获取时按时间降序(最新的在前)，但返回给前端通常会倒序或前端处理。我们按时间降序拉取
	err := db.Order("created_at DESC").
		Offset(offset).Limit(q.PageSize).
		Find(&messages).Error

	if err != nil {
		return nil, err
	}

	items := make([]dto.MessageResponse, len(messages))
	for i, m := range messages {
		items[i] = dto.MessageResponse{
			ID:         m.ID,
			SenderID:   m.SenderID,
			ReceiverID: m.ReceiverID,
			Content:    m.Content,
			IsRead:     m.IsRead,
			CreatedAt:  m.CreatedAt,
		}
	}

	// 标记未读为已读 (如果是对方发给我的)
	database.DB.Model(&model.Message{}).
		Where("sender_id = ? AND receiver_id = ? AND is_read = false", friendID, userID).
		Update("is_read", true)

	return &dto.MessageHistoryResponse{
		Items:    items,
		Total:    total,
		Page:     q.Page,
		PageSize: q.PageSize,
	}, nil
}

// GetUnreadCount 获取总未读消息数
func (s *MessageService) GetUnreadCount(userID string) (int64, error) {
	var count int64
	err := database.DB.Model(&model.Message{}).
		Where("receiver_id = ? AND is_read = false", userID).
		Count(&count).Error
	return count, err
}
