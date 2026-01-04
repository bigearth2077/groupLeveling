package service

import (
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"backend/pkg/utils"
	"errors"
)

type UserService struct{}

// GetProfile 获取当前用户信息
func (s *UserService) GetProfile(userID string) (*model.User, error) {
	var user model.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateProfile 更新资料
func (s *UserService) UpdateProfile(userID string, req dto.UpdateProfileRequest) (*model.User, error) {
	var user model.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return nil, err
	}

	// 更新字段
	user.Nickname = req.Nickname
	user.AvatarUrl = req.AvatarURL
	user.Bio = req.Bio

	if err := database.DB.Save(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

// ChangePassword 修改密码
func (s *UserService) ChangePassword(userID string, req dto.ChangePasswordRequest) error {
	var user model.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return err
	}

	// 1. 验证旧密码
	if !utils.CheckPasswordHash(req.CurrentPassword, user.PasswordHash) {
		return errors.New("current password is incorrect")
	}

	// 2. 加密新密码
	newHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	// 3. 保存
	return database.DB.Model(&user).Update("password_hash", newHash).Error
}

// GetPublicProfile 获取他人公开资料
func (s *UserService) GetPublicProfile(targetID string) (*model.User, error) {
	var user model.User
	// 只查需要的字段以优化性能 (可选)
	if err := database.DB.Select("id", "nickname", "avatar_url").First(&user, "id = ?", targetID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// SearchUsers 搜索用户 (支持分页、模糊查询)
func (s *UserService) SearchUsers(query string, page, pageSize int) (*dto.SearchUserResult, error) {
	var users []model.User
	var total int64
	offset := (page - 1) * pageSize

	// 构建查询：Postgres 大小写不敏感搜索用 ILIKE
	dbQuery := database.DB.Model(&model.User{})

	if query != "" {
		keyword := "%" + query + "%"
		dbQuery = dbQuery.Where("email ILIKE ? OR nickname ILIKE ?", keyword, keyword)
	}

	// 1. 查总数
	if err := dbQuery.Count(&total).Error; err != nil {
		return nil, err
	}

	// 2. 查数据
	if err := dbQuery.Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		return nil, err
	}

	// 3. 转换格式
	items := make([]dto.SearchUserItem, 0)
	for _, u := range users {
		items = append(items, dto.SearchUserItem{
			ID:        u.ID,
			Email:     u.Email,
			Nickname:  u.Nickname,
			AvatarURL: u.AvatarUrl,
			Bio:       u.Bio,
		})
	}

	return &dto.SearchUserResult{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

// DeleteAccount 注销账号
func (s *UserService) DeleteAccount(userID string) error {
	// GORM 的 Delete 默认是软删除(如果Model有DeletedAt)。
	// 你的 Schema 没有 DeletedAt，所以这里是物理删除。
	// 由于设置了 Cascade，关联的 RefreshToken 等会被自动删除。
	return database.DB.Delete(&model.User{}, "id = ?", userID).Error
}
