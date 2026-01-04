package dto

// 入参保持不变
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Nickname string `json:"nickname" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

// --- 响应结构 ---

type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

// LoginResponse & RegisterResponse 统一结构
// 根据你之前的需求，注册/登录返回略有不同（注册扁平，登录嵌套），
// 但为了规范，建议统一。这里按你之前的接口文档：
// 注册：扁平化
type RegisterResponse struct {
	ID           string `json:"id"`
	Email        string `json:"email"`
	Nickname     string `json:"nickname"`
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"` // 新增
}

// 登录：嵌套 User
type LoginResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"` // 新增
	User         struct {
		ID       string `json:"id"`
		Email    string `json:"email"`
		Nickname string `json:"nickname"`
	} `json:"user"`
}

type RefreshResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"` // 新增：同时返回新的 RT
}
