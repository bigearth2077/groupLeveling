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
func (s *RoomService) CreateRoom(creatorID string, req dto.CreateRoomRequest) (*model.Room, error) {
	maxMembers := 50
	if req.MaxMembers > 0 {
		maxMembers = req.MaxMembers
	}

	room := model.Room{
		Name:        req.Name,
		Description: req.Description,
		CreatorID:   creatorID,
		TagID:       req.TagID,
		IsPrivate:   req.IsPrivate,
		Password:    req.Password,
		MaxMembers:  maxMembers,
	}
	
	if err := database.DB.Create(&room).Error; err != nil {
		return nil, err
	}
	return &room, nil
}

// GetRooms 获取房间列表 (HTTP)
func (s *RoomService) GetRooms(page, pageSize int, tagID string) (*dto.RoomListResponse, error) {
	var rooms []model.Room
	var total int64

	// 过滤条件：公开房间 或者 只是隐藏了？通常私密房间不出现在大厅，或者带锁显示。
	// 这里假设：只显示 IsPrivate=false 的，或者显示 IsPrivate=true 但需要密码的。
	// 简单起见：显示所有，但在前端用锁图标区分。
	db := database.DB.Model(&model.Room{}).Preload("Tag")

	if tagID != "" {
		db = db.Where("tag_id = ?", tagID)
	}

	db.Count(&total)

	offset := (page - 1) * pageSize
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&rooms).Error; err != nil {
		return nil, err
	}

	items := make([]dto.RoomResponse, len(rooms))
	for i, r := range rooms {
		// 统计实时人数
		var count int64
		database.DB.Model(&model.RoomMember{}).
			Where("room_id = ? AND left_at IS NULL", r.ID).
			Count(&count)

		tagName := ""
		if r.Tag != nil {
			tagName = r.Tag.Name
		}

		items[i] = dto.RoomResponse{
			ID:          r.ID,
			Name:        r.Name,
			Description: r.Description,
			TagID:       r.TagID,
			TagName:     tagName,
			IsPrivate:   r.IsPrivate,
			MaxMembers:  r.MaxMembers,
			CreatorID:   r.CreatorID,
			CreatedAt:   r.CreatedAt,
			OnlineCount: int(count),
			HasPassword: r.Password != nil && *r.Password != "",
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
