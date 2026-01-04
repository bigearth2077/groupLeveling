package dto

import (
	"backend/internal/model"
	"time"
)

// --- HTTP REST API DTOs ---

type CreateRoomRequest struct {
	Name string `json:"name" binding:"required"`
}

type RoomResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	// 可以选择是否返回当前在线人数
	OnlineCount int `json:"onlineCount"`
}

type RoomListResponse struct {
	Items    []RoomResponse `json:"items"`
	Total    int64          `json:"total"`
	Page     int            `json:"page"`
	PageSize int            `json:"pageSize"`
}

// --- Socket Event DTOs ---

// Client -> Server: join_room
type JoinRoomPayload struct {
	RoomID string `json:"roomId"`
}

// Client -> Server: send_message
type SendMessagePayload struct {
	RoomID  string `json:"roomId"`
	Content string `json:"content"`
}

// Client -> Server: update_status
type UpdateStatusPayload struct {
	RoomID string           `json:"roomId"`
	Status model.RoomStatus `json:"status"`
}

// --- Socket Broadcast DTOs (Server -> Client) ---

// event: user_joined
type UserJoinedEvent struct {
	User UserSimple `json:"user"`
}

// event: user_left
type UserLeftEvent struct {
	UserID string `json:"userId"`
}

// event: new_message
type NewMessageEvent struct {
	ID        string     `json:"id"` // 消息ID (UUID)
	Content   string     `json:"content"`
	CreatedAt time.Time  `json:"createdAt"`
	Sender    UserSimple `json:"sender"`
}

// event: status_updated
type StatusUpdatedEvent struct {
	UserID string           `json:"userId"`
	Status model.RoomStatus `json:"status"`
}

type RoomMemberResponse struct {
	UserID    string           `json:"userId"`
	Nickname  string           `json:"nickname"`
	AvatarURL *string          `json:"avatarUrl"`
	Status    model.RoomStatus `json:"status"` // learning, rest, idle
	JoinedAt  time.Time        `json:"joinedAt"`
}
