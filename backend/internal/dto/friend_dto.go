package dto

import (
	"backend/internal/model"
	"time"
)

// --- Request ---

type SendFriendRequest struct {
	FriendID string `json:"friendId" binding:"required"`
}

type ActFriendRequest struct {
	Action string `json:"action" binding:"required,oneof=accept reject"`
}

type FriendQuery struct {
	Page     int `form:"page,default=1"`
	PageSize int `form:"pageSize,default=20"`
}

// --- Response ---

// FriendRequestResponse 用于返回请求详情
type FriendRequestResponse struct {
	ID        string             `json:"id"`
	UserID    string             `json:"userId"`
	FriendID  string             `json:"friendId"`
	Status    model.FriendStatus `json:"status"`
	CreatedAt time.Time          `json:"createdAt"`
	User      *UserSimple        `json:"user,omitempty"`   // 发送方简要信息
	Friend    *UserSimple        `json:"friend,omitempty"` // 接收方简要信息
}

type UserSimple struct {
	ID        string  `json:"id"`
	Nickname  string  `json:"nickname"`
	AvatarURL *string `json:"avatarUrl"`
}

type FriendRequestListResponse struct {
	Items    []FriendRequestResponse `json:"items"`
	Total    int64                   `json:"total"`
	Page     int                     `json:"page"`
	PageSize int                     `json:"pageSize"`
}

// FriendItem 用于好友列表
type FriendItem struct {
	ID        string  `json:"id"` // 对方的 UserID
	Nickname  string  `json:"nickname"`
	AvatarURL *string `json:"avatarUrl"`
	Bio       *string `json:"bio"`
}

type FriendListResponse struct {
	Items    []FriendItem `json:"items"`
	Total    int64        `json:"total"`
	Page     int          `json:"page"`
	PageSize int          `json:"pageSize"`
}
