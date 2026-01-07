package dto

// GetMeResponse
type UserProfileResponse struct {
	ID        string  `json:"id"`
	Email     string  `json:"email"`
	Nickname  string  `json:"nickname"`
	AvatarURL *string `json:"avatarUrl"` // 指针允许返回 null
	Bio       *string `json:"bio"`       // 指针允许返回 null
}

// UpdateMeRequest
type UpdateProfileRequest struct {
	Nickname  string  `json:"nickname" binding:"required,max=50"` // 必填且最大50
	AvatarURL *string `json:"avatarUrl" binding:"omitempty,url"`  // 可选，若有值必须是URL
	Bio       *string `json:"bio" binding:"omitempty,max=200"`    // 可选，最大200字
}

// ChangePasswordRequest
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
}

// PublicProfileResponse
type PublicProfileResponse struct {
	ID        string            `json:"id"`
	Nickname  string            `json:"nickname"`
	AvatarURL *string           `json:"avatarUrl"`
	Bio       *string           `json:"bio"`
	LevelInfo LevelInfo         `json:"levelInfo"` // 总等级信息
	TopTags   []UserTagResponse `json:"topTags"`   // 最擅长的 3 个标签
}

// SearchUserResponse (单项)
type SearchUserItem struct {
	ID        string  `json:"id"`
	Email     string  `json:"email"`
	Nickname  string  `json:"nickname"`
	AvatarURL *string `json:"avatarUrl"`
	Bio       *string `json:"bio"`
}

// SearchUserResult (分页返回)
type SearchUserResult struct {
	Items    []SearchUserItem `json:"items"`
	Total    int64            `json:"total"`
	Page     int              `json:"page"`
	PageSize int              `json:"pageSize"`
}
