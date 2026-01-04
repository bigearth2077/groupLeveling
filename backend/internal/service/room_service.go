package service

import (
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"errors"
	"time"
)

type RoomService struct{}

// CreateRoom 创建房间 (HTTP)
func (s *RoomService) CreateRoom(name string) (*model.Room, error) {
	room := model.Room{
		Name: name,
	}
	if err := database.DB.Create(&room).Error; err != nil {
		return nil, err
	}
	return &room, nil
}

// GetRooms 获取房间列表 (HTTP)
func (s *RoomService) GetRooms(page, pageSize int) (*dto.RoomListResponse, error) {
	var rooms []model.Room
	var total int64

	db := database.DB.Model(&model.Room{})
	db.Count(&total)

	offset := (page - 1) * pageSize
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&rooms).Error; err != nil {
		return nil, err
	}

	items := make([]dto.RoomResponse, len(rooms))
	for i, r := range rooms {
		// 这里暂不统计实时人数，或者通过 Redis 统计
		items[i] = dto.RoomResponse{
			ID:          r.ID,
			Name:        r.Name,
			CreatedAt:   r.CreatedAt,
			OnlineCount: 0, // TODO: 连接 Socket Server 获取
		}
	}

	return &dto.RoomListResponse{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

// JoinRoom 记录加入数据库 (Socket 调用)
func (s *RoomService) JoinRoom(userID, roomID string) error {
	// 1. 检查房间是否存在
	var room model.Room
	if err := database.DB.First(&room, "id = ?", roomID).Error; err != nil {
		return errors.New("room not found")
	}

	// 2. 创建 RoomMember 记录
	member := model.RoomMember{
		RoomID:   roomID,
		UserID:   userID,
		Status:   model.RoomStatusIdle, // 默认状态
		JoinedAt: time.Now(),
		LeftAt:   nil,
	}
	return database.DB.Create(&member).Error
}

// LeaveRoom 记录离开数据库 (Socket 调用)
func (s *RoomService) LeaveRoom(userID, roomID string) error {
	// 更新该用户在该房间最后一条未离开的记录
	return database.DB.Model(&model.RoomMember{}).
		Where("user_id = ? AND room_id = ? AND left_at IS NULL", userID, roomID).
		Update("left_at", time.Now()).Error
}

// UpdateStatus 更新状态 (Socket 调用)
func (s *RoomService) UpdateStatus(userID, roomID string, status model.RoomStatus) error {
	return database.DB.Model(&model.RoomMember{}).
		Where("user_id = ? AND room_id = ? AND left_at IS NULL", userID, roomID).
		Update("status", status).Error
}

// GetRoomMembers 获取房间内当前在线成员
func (s *RoomService) GetRoomMembers(roomID string) ([]dto.RoomMemberResponse, error) {
	var members []model.RoomMember

	// 查询条件：指定房间 ID，且 left_at 为 NULL (表示还在房间里)
	// Preload("User") 是为了把用户信息带出来
	err := database.DB.Model(&model.RoomMember{}).
		Preload("User").
		Where("room_id = ? AND left_at IS NULL", roomID).
		Find(&members).Error

	if err != nil {
		return nil, err
	}

	// 转换为 DTO
	resp := make([]dto.RoomMemberResponse, len(members))
	for i, m := range members {
		resp[i] = dto.RoomMemberResponse{
			UserID:    m.UserID,
			Nickname:  m.User.Nickname,
			AvatarURL: m.User.AvatarUrl,
			Status:    m.Status, // 状态：learning / rest / idle
			JoinedAt:  m.JoinedAt,
		}
	}

	return resp, nil
}
