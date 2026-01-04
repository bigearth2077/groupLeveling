package service

import (
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"backend/pkg/utils"
	"errors"
	"time"

	"gorm.io/gorm"
)

type AuthService struct{}

// Register 注册：生成双 Token
func (s *AuthService) Register(req dto.RegisterRequest) (*model.User, string, string, error) {
	// 1. 检查邮箱
	var existingUser model.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return nil, "", "", errors.New("email already exists")
	}

	// 2. 密码加密
	hashedPwd, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, "", "", err
	}

	// 3. 创建用户
	newUser := model.User{
		Email:        req.Email,
		PasswordHash: hashedPwd,
		Nickname:     req.Nickname,
	}
	if err := database.DB.Create(&newUser).Error; err != nil {
		return nil, "", "", err
	}

	// 4. 生成双 Token 并存储 RefreshToken
	accessToken, refreshToken, err := s.generateAndSaveTokens(newUser.ID)
	if err != nil {
		return nil, "", "", err
	}

	return &newUser, accessToken, refreshToken, nil
}

// Login 登录：生成双 Token
func (s *AuthService) Login(req dto.LoginRequest) (*model.User, string, string, error) {
	// 1. 查找用户
	var user model.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", "", errors.New("invalid email or password")
		}
		return nil, "", "", err
	}

	// 2. 校验密码
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		return nil, "", "", errors.New("invalid email or password")
	}

	// 3. 生成双 Token 并存储 RefreshToken
	accessToken, refreshToken, err := s.generateAndSaveTokens(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	return &user, accessToken, refreshToken, nil
}

// Refresh 刷新：实现轮换机制 (Rotation)
// 返回值改变：(newAccessToken, newRefreshToken, error)
func (s *AuthService) Refresh(req dto.RefreshRequest) (string, string, error) {
	// 1. 解析校验 JWT
	claims, err := utils.ParseToken(req.RefreshToken)
	if err != nil {
		return "", "", errors.New("invalid refresh token format")
	}

	// 2. 计算哈希
	tokenHash := utils.HashToken(req.RefreshToken)

	// 3. 开启数据库事务 (因为涉及读、写、再写，保证原子性)
	var newAccessToken, newRefreshToken string

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		var rt model.RefreshToken
		// 3.1 查找该 Token
		// 注意：这里使用 tx 而不是 database.DB
		if err := tx.Where("user_id = ? AND token_hash = ?", claims.UserID, tokenHash).First(&rt).Error; err != nil {
			// [进阶安全策略]：如果这里没找到，或者找到的是一个"已撤销"的Token，
			// 说明可能发生了令牌复用攻击(Token Reuse)。
			// 在严格模式下，这里应该把该用户的所有 RefreshToken 全部清空，强制用户重新登录。
			return errors.New("refresh token invalid")
		}

		// 3.2 校验状态
		if rt.RevokedAt != nil {
			// 发现复用已撤销的令牌 -> 潜在的盗号风险 -> 可以在这里清空该用户所有 Token
			// tx.Where("user_id = ?", claims.UserID).Delete(&model.RefreshToken{})
			return errors.New("refresh token has been revoked")
		}
		if rt.ExpiresAt.Before(time.Now()) {
			return errors.New("refresh token expired")
		}

		// 3.3 【关键步骤】撤销当前使用的 Refresh Token
		// 方法A：物理删除 (简单)
		// if err := tx.Delete(&rt).Error; err != nil { return err }

		// 方法B：标记删除 (推荐，保留审计日志，且能用于检测复用攻击)
		now := time.Now()
		rt.RevokedAt = &now
		if err := tx.Save(&rt).Error; err != nil {
			return err
		}

		// 3.4 生成新的一对 Token
		newAccessToken, err = utils.GenerateAccessToken(claims.UserID)
		if err != nil {
			return err
		}

		newRefreshToken, err = utils.GenerateRefreshToken(claims.UserID)
		if err != nil {
			return err
		}

		// 3.5 保存新的 Refresh Token 到数据库
		newRtRecord := model.RefreshToken{
			UserID:    claims.UserID,
			TokenHash: utils.HashToken(newRefreshToken),
			ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 重新续期7天
		}
		if err := tx.Create(&newRtRecord).Error; err != nil {
			return err
		}

		return nil // 提交事务
	})

	if err != nil {
		return "", "", err
	}

	return newAccessToken, newRefreshToken, nil
}

// generateAndSaveTokens 内部辅助函数
func (s *AuthService) generateAndSaveTokens(userID string) (string, string, error) {
	// 1. 生成 Access Token
	accessToken, err := utils.GenerateAccessToken(userID)
	if err != nil {
		return "", "", err
	}

	// 2. 生成 Refresh Token
	refreshToken, err := utils.GenerateRefreshToken(userID)
	if err != nil {
		return "", "", err
	}

	// 3. 保存 Refresh Token 的 Hash 到数据库
	rtRecord := model.RefreshToken{
		UserID:    userID,
		TokenHash: utils.HashToken(refreshToken),      // 存 Hash
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 保持和 JWT 声明一致
	}

	if err := database.DB.Create(&rtRecord).Error; err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}
