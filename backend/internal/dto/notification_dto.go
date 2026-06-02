package dto

import (
	"backend/internal/model"
	"time"
)

type NotificationResponse struct {
	ID        string                 `json:"id"`
	UserID    string                 `json:"userId"`
	Type      model.NotificationType `json:"type"`
	Title     string                 `json:"title"`
	Content   string                 `json:"content"`
	RelatedID *string                `json:"relatedId"`
	IsRead    bool                   `json:"isRead"`
	CreatedAt time.Time              `json:"createdAt"`
}

type NotificationQuery struct {
	Page     int `form:"page,default=1"`
	PageSize int `form:"pageSize,default=20"`
}

type NotificationListResponse struct {
	Items    []NotificationResponse `json:"items"`
	Total    int64                  `json:"total"`
	Page     int                    `json:"page"`
	PageSize int                    `json:"pageSize"`
}

// Socket Broadcast Event
type NewNotificationEvent struct {
	Notification NotificationResponse `json:"notification"`
}
