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
func (s *RoomService) GetRooms(page, pageSize int, tagID, search string) (*dto.RoomListResponse, error) {
	var results []struct {
		model.Room
		OnlineCount int
	}
	var total int64

	db := database.DB.Model(&model.Room{}).
		Select("rooms.*, (SELECT count(*) FROM room_members WHERE room_members.room_id = rooms.id AND room_members.left_at IS NULL) as online_count").
		Preload("Tag")

	if tagID != "" {
		db = db.Where("tag_id = ?", tagID)
	}

	if search != "" {
		searchPattern := "%" + search + "%"
		db = db.Where("name ILIKE ? OR description ILIKE ?", searchPattern, searchPattern)
	}

	db.Count(&total)

	offset := (page - 1) * pageSize
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&results).Error; err != nil {
		return nil, err
	}

	items := make([]dto.RoomResponse, len(results))
	for i, r := range results {
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
			OnlineCount: r.OnlineCount,
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

// GetRoom 获取房间详情 (HTTP)
func (s *RoomService) GetRoom(roomID string) (*dto.RoomResponse, error) {
	var room model.Room
	if err := database.DB.Preload("Tag").First(&room, "id = ?", roomID).Error; err != nil {
		return nil, errors.New("room not found")
	}

	// 统计实时人数
	var count int64
	database.DB.Model(&model.RoomMember{}).
		Where("room_id = ? AND left_at IS NULL", room.ID).
		Count(&count)

	tagName := ""
	if room.Tag != nil {
		tagName = room.Tag.Name
	}

	resp := &dto.RoomResponse{
		ID:          room.ID,
		Name:        room.Name,
		Description: room.Description,
		TagID:       room.TagID,
		TagName:     tagName,
		IsPrivate:   room.IsPrivate,
		MaxMembers:  room.MaxMembers,
		CreatorID:   room.CreatorID,
		CreatedAt:   room.CreatedAt,
		OnlineCount: int(count),
		HasPassword: room.Password != nil && *room.Password != "",
	}
	return resp, nil
}

// DeleteRoom 删除房间 (HTTP)
func (s *RoomService) DeleteRoom(userID, roomID string) error {
	var room model.Room
	if err := database.DB.First(&room, "id = ?", roomID).Error; err != nil {
		return errors.New("room not found")
	}

	// 权限检查: 只有房主可以删除
	if room.CreatorID != userID {
		return errors.New("permission denied")
	}
    
    // Debug Log
    println("Deleting room members for room:", roomID)

	// 手动级联删除：先删除相关的 RoomMember 记录
	if err := database.DB.Where("room_id = ?", roomID).Delete(&model.RoomMember{}).Error; err != nil {
		return err
	}

	return database.DB.Delete(&room).Error
}

// UpdateRoom 更新房间 (HTTP)
func (s *RoomService) UpdateRoom(userID, roomID string, req dto.UpdateRoomRequest) (*model.Room, error) {
	var room model.Room
	if err := database.DB.First(&room, "id = ?", roomID).Error; err != nil {
		return nil, errors.New("room not found")
	}

	// 权限检查
	if room.CreatorID != userID {
		return nil, errors.New("permission denied")
	}

	// 更新字段
	if req.Name != "" {
		room.Name = req.Name
	}
	room.Description = req.Description // 指针类型，允许为 nil 或新值
	room.TagID = req.TagID
	room.IsPrivate = req.IsPrivate
	room.Password = req.Password
	
	if req.MaxMembers > 0 {
		room.MaxMembers = req.MaxMembers
	}

	if err := database.DB.Save(&room).Error; err != nil {
		return nil, err
	}
	return &room, nil
}

// JoinRoom 记录加入数据库 (Socket 调用)
func (s *RoomService) JoinRoom(userID, roomID string, password *string) error {
	// 1. 检查房间是否存在
	var room model.Room
	if err := database.DB.First(&room, "id = ?", roomID).Error; err != nil {
		return errors.New("room not found")
	}

	// 2. 检查密码 (如果是私密房间)
	if room.IsPrivate {
		if room.Password != nil && *room.Password != "" {
			if password == nil || *password != *room.Password {
				return errors.New("invalid password")
			}
		}
	}

	// 3. 检查人数上限
	var currentCount int64
	database.DB.Model(&model.RoomMember{}).
		Where("room_id = ? AND left_at IS NULL", roomID).
		Count(&currentCount)

	if int(currentCount) >= room.MaxMembers {
		return errors.New("room is full")
	}

	// 4. 创建 RoomMember 记录 (如果已经加入过且未离开，不需要重复创建，或者更新状态)
	var existingMember model.RoomMember
	if err := database.DB.Where("room_id = ? AND user_id = ? AND left_at IS NULL", roomID, userID).First(&existingMember).Error; err == nil {
		// Already in room
		return nil
	}

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

// ValidatePassword 验证房间密码
func (s *RoomService) ValidatePassword(roomID, password string) error {
	var room model.Room
	if err := database.DB.First(&room, "id = ?", roomID).Error; err != nil {
		return errors.New("room not found")
	}

	if !room.IsPrivate {
		return nil // 公开房间不需要密码
	}

	if room.Password == nil || *room.Password == "" {
		return nil // 虽然是私密但没设密码？视为通过
	}

	if *room.Password != password {
		return errors.New("invalid password")
	}

	return nil
}
