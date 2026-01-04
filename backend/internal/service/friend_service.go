package service

import (
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"errors"
)

type FriendService struct{}

// SendRequest 发送好友请求
func (s *FriendService) SendRequest(userID, friendID string) (*model.Friend, bool, error) {
	if userID == friendID {
		return nil, false, errors.New("cannot add yourself")
	}

	// 1. 检查是否存在反向的 Pending 请求 (即对方已经申请加我)
	var reverseReq model.Friend
	err := database.DB.Where("user_id = ? AND friend_id = ?", friendID, userID).First(&reverseReq).Error

	if err == nil {
		// 找到了反向记录
		if reverseReq.Status == model.FriendStatusPending {
			// case 1: 对方已申请 -> 自动接受
			reverseReq.Status = model.FriendStatusAccepted
			if err := database.DB.Save(&reverseReq).Error; err != nil {
				return nil, false, err
			}
			return &reverseReq, true, nil // true 表示是"匹配成功/自动接受"
		} else if reverseReq.Status == model.FriendStatusAccepted {
			return nil, false, errors.New("already friends")
		}
	}

	// 2. 检查正向是否已存在
	var existingReq model.Friend
	err = database.DB.Where("user_id = ? AND friend_id = ?", userID, friendID).First(&existingReq).Error
	if err == nil {
		if existingReq.Status == model.FriendStatusPending {
			return nil, false, errors.New("request already sent")
		}
		if existingReq.Status == model.FriendStatusAccepted {
			return nil, false, errors.New("already friends")
		}
	}

	// 3. 创建新的 Pending 请求
	newReq := model.Friend{
		UserID:   userID,
		FriendID: friendID,
		Status:   model.FriendStatusPending,
	}

	if err := database.DB.Create(&newReq).Error; err != nil {
		return nil, false, err
	}

	return &newReq, false, nil // false 表示是"新建 Pending"
}

// GetIncomingRequests 获取我收到的请求
func (s *FriendService) GetIncomingRequests(userID string, q dto.FriendQuery) (*dto.FriendRequestListResponse, error) {
	var reqs []model.Friend
	var total int64

	// 查询条件：FriendID 是我，且状态是 Pending
	db := database.DB.Model(&model.Friend{}).
		Where("friend_id = ? AND status = ?", userID, model.FriendStatusPending)

	db.Count(&total)

	offset := (q.Page - 1) * q.PageSize
	// Preload User (发送者) 和 FriendUser (接收者，其实就是我，但为了格式统一也查出来)
	err := db.Preload("User").Preload("FriendUser").
		Order("created_at DESC").
		Offset(offset).Limit(q.PageSize).
		Find(&reqs).Error

	if err != nil {
		return nil, err
	}

	return s.mapToRequestResponse(reqs, total, q.Page, q.PageSize), nil
}

// GetOutgoingRequests 获取我发出的请求
func (s *FriendService) GetOutgoingRequests(userID string, q dto.FriendQuery) (*dto.FriendRequestListResponse, error) {
	var reqs []model.Friend
	var total int64

	// 查询条件：UserID 是我，且状态是 Pending
	db := database.DB.Model(&model.Friend{}).
		Where("user_id = ? AND status = ?", userID, model.FriendStatusPending)

	db.Count(&total)

	offset := (q.Page - 1) * q.PageSize
	err := db.Preload("User").Preload("FriendUser").
		Order("created_at DESC").
		Offset(offset).Limit(q.PageSize).
		Find(&reqs).Error

	if err != nil {
		return nil, err
	}

	return s.mapToRequestResponse(reqs, total, q.Page, q.PageSize), nil
}

// HandleRequest 处理请求 (接受/拒绝)
func (s *FriendService) HandleRequest(userID, reqID string, action string) (*model.Friend, error) {
	var req model.Friend
	// 必须是发给我的请求 (FriendID == Me) 且状态是 Pending
	if err := database.DB.Where("id = ? AND friend_id = ? AND status = ?", reqID, userID, model.FriendStatusPending).First(&req).Error; err != nil {
		return nil, errors.New("request not found")
	}

	if action == "reject" {
		// 拒绝通常是直接删除记录，或者标记为 Rejected。根据接口文档"Record not found"，删除比较合适
		if err := database.DB.Delete(&req).Error; err != nil {
			return nil, err
		}
		return nil, nil // 返回 nil 表示已被删除
	}

	// Accept
	req.Status = model.FriendStatusAccepted
	if err := database.DB.Save(&req).Error; err != nil {
		return nil, err
	}
	return &req, nil
}

// GetFriendList 获取好友列表 (最复杂的部分)
func (s *FriendService) GetFriendList(userID string, q dto.FriendQuery) (*dto.FriendListResponse, error) {
	var friends []model.Friend
	var total int64

	// 好友是双向的：(A->B Accepted) OR (B->A Accepted)
	// GORM 的 Where 嵌套写法
	db := database.DB.Model(&model.Friend{}).
		Where("status = ?", model.FriendStatusAccepted).
		Where(database.DB.Where("user_id = ?", userID).Or("friend_id = ?", userID))

	db.Count(&total)

	offset := (q.Page - 1) * q.PageSize
	// 需要预加载双方信息，因为我不确定哪一边是"对方"
	err := db.Preload("User").Preload("FriendUser").
		Offset(offset).Limit(q.PageSize).
		Find(&friends).Error

	if err != nil {
		return nil, err
	}

	// 转换逻辑：找出"对方"是谁
	items := make([]dto.FriendItem, 0, len(friends))
	for _, f := range friends {
		var targetUser model.User
		if f.UserID == userID {
			targetUser = f.FriendUser // 我是申请方，朋友是 FriendUser
		} else {
			targetUser = f.User // 我是接收方，朋友是 User
		}

		items = append(items, dto.FriendItem{
			ID:        targetUser.ID,
			Nickname:  targetUser.Nickname,
			AvatarURL: targetUser.AvatarUrl,
			Bio:       targetUser.Bio,
		})
	}

	return &dto.FriendListResponse{
		Items:    items,
		Total:    total,
		Page:     q.Page,
		PageSize: q.PageSize,
	}, nil
}

// DeleteFriend 删除好友
func (s *FriendService) DeleteFriend(myID, otherID string) error {
	// 删除 (Me -> Other) 或 (Other -> Me) 的记录
	result := database.DB.Where(
		"(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
		myID, otherID, otherID, myID,
	).Delete(&model.Friend{})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("friend relation not found")
	}
	return nil
}

// 辅助方法：DTO 映射
func (s *FriendService) mapToRequestResponse(reqs []model.Friend, total int64, page, pageSize int) *dto.FriendRequestListResponse {
	items := make([]dto.FriendRequestResponse, len(reqs))
	for i, r := range reqs {
		items[i] = dto.FriendRequestResponse{
			ID:        r.ID,
			UserID:    r.UserID,
			FriendID:  r.FriendID,
			Status:    r.Status,
			CreatedAt: r.CreatedAt,
			User: &dto.UserSimple{
				ID:        r.User.ID,
				Nickname:  r.User.Nickname,
				AvatarURL: r.User.AvatarUrl,
			},
			Friend: &dto.UserSimple{
				ID:        r.FriendUser.ID,
				Nickname:  r.FriendUser.Nickname,
				AvatarURL: r.FriendUser.AvatarUrl,
			},
		}
	}
	return &dto.FriendRequestListResponse{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}
}
