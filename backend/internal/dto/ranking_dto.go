package dto

// RankingItem 单个排名项
type RankingItem struct {
	UserID    string  `json:"userId"`
	Minutes   int     `json:"minutes"`
	Nickname  string  `json:"nickname"`
	AvatarURL *string `json:"avatarUrl"`
}

// GlobalRankingResponse 全站榜单返回
type GlobalRankingResponse struct {
	Items []RankingItem `json:"items"`
}
