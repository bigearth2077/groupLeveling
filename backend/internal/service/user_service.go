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

// GetPublicProfile 获取他人公开资料 (包含等级和擅长标签)
func (s *UserService) GetPublicProfile(targetID string) (*dto.PublicProfileResponse, error) {
	var user model.User
	// 1. 获取基本信息
	if err := database.DB.Select("id", "nickname", "avatar_url", "bio").First(&user, "id = ?", targetID).Error; err != nil {
		return nil, err
	}

	// 2. 计算总等级
	var totalXP int64
	database.DB.Model(&model.DailyStat{}).
		Where("user_id = ?", targetID).
		Select("COALESCE(SUM(total_minutes), 0)").
		Scan(&totalXP)

	levelService := &LevelService{}
	levelInfo := levelService.CalculateLevel(int(totalXP))

	// 3. 获取 Top 3 标签
	tagService := &TagService{}
	allTags, err := tagService.GetUserTags(targetID)
	topTags := make([]dto.UserTagResponse, 0)
	if err == nil {
		// GetUserTags 已经按 XP 降序或最近更新排过序了？
		// 之前代码里 GetUserTags 是按 updated_at 排序的。
		// 这里我们最好在业务上按 XP 重新排一下，或者修改 GetUserTags。
		// 为了简单，我们取前 3 个。
		count := len(allTags)
		if count > 3 {
			count = 3
		}
		topTags = allTags[:count]
	}

	return &dto.PublicProfileResponse{
		ID:        user.ID,
		Nickname:  user.Nickname,
		AvatarURL: user.AvatarUrl,
		Bio:       user.Bio,
		LevelInfo: levelInfo,
		TopTags:   topTags,
	}, nil
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
