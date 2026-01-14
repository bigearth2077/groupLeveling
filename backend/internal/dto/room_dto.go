package dto

import (
	"backend/internal/model"
	"time"
)

// --- HTTP REST API DTOs ---

type CreateRoomRequest struct {
	Name        string  `json:"name" binding:"required,max=50"`
	Description *string `json:"description"`
	TagID       *string `json:"tagId"`
	IsPrivate   bool    `json:"isPrivate"`
	Password    *string `json:"password"`   // 只有私密房才需要
	MaxMembers  int     `json:"maxMembers"` // 默认50
}

type UpdateRoomRequest struct {
	Name        string  `json:"name" binding:"max=50"`
	Description *string `json:"description"`
	TagID       *string `json:"tagId"`
	IsPrivate   bool    `json:"isPrivate"`
	Password    *string `json:"password"`
	MaxMembers  int     `json:"maxMembers"`
}

type RoomResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	TagID       *string   `json:"tagId"`
	TagName     string    `json:"tagName"` // 为了方便展示
	IsPrivate   bool      `json:"isPrivate"`
	MaxMembers  int       `json:"maxMembers"`
	CreatorID   string    `json:"creatorId"`
	CreatedAt   time.Time `json:"createdAt"`
	OnlineCount int       `json:"onlineCount"`
	HasPassword bool      `json:"hasPassword"` // 不返回真实密码，只返回是否有密码
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
	RoomID   string  `json:"roomId"`
	Password *string `json:"password"` // Optional: for private rooms
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

type ValidateRoomPasswordRequest struct {
	RoomID   string `json:"roomId" binding:"required"`
	Password string `json:"password" binding:"required"`
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
