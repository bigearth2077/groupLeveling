package dto

import "time"

type MessageResponse struct {
	ID         string    `json:"id"`
	SenderID   string    `json:"senderId"`
	ReceiverID string    `json:"receiverId"`
	Content    string    `json:"content"`
	IsRead     bool      `json:"isRead"`
	CreatedAt  time.Time `json:"createdAt"`
}

type MessageHistoryQuery struct {
	FriendID string `form:"friendId" binding:"required"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"pageSize,default=50"`
}

type MessageHistoryResponse struct {
	Items    []MessageResponse `json:"items"`
	Total    int64             `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"pageSize"`
}

// --- Socket DTOs ---

// Client -> Server
type SendPrivateMessagePayload struct {
	ReceiverID string `json:"receiverId"`
	Content    string `json:"content"`
}

// Server -> Client
type PrivateMessageEvent struct {
	Message MessageResponse `json:"message"`
}
