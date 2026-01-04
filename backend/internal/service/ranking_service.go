package service

import (
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/redis/go-redis/v9"
)

type RankingService struct{}

// GetGlobalRankings 获取全站排行榜
func (s *RankingService) GetGlobalRankings(scope string, limit int) ([]dto.RankingItem, error) {
	ctx := context.Background()
	var key string

	// 确定 Redis Key
	if scope == "week" {
		year, week := time.Now().ISOWeek()
		key = fmt.Sprintf("ranking:week:%d-%d", year, week)
	} else {
		key = "ranking:total"
	}

	// 1. 从 Redis 获取前 N 名 (ZRevRangeWithScores: 分数从高到低)
	// Start: 0, Stop: limit - 1
	redisResults, err := database.RDB.ZRevRangeWithScores(ctx, key, 0, int64(limit-1)).Result()
	if err != nil {
		return nil, err
	}

	if len(redisResults) == 0 {
		return []dto.RankingItem{}, nil
	}

	// 2. 提取 UserIDs 并构建分数 Map
	userIDs := make([]string, 0, len(redisResults))
	scoreMap := make(map[string]int)

	for _, z := range redisResults {
		uid := z.Member.(string) // Member 是 interface{}，需要断言
		userIDs = append(userIDs, uid)
		scoreMap[uid] = int(z.Score)
	}

	// 3. 批量查询用户信息 (Postgres)
	var users []model.User
	if err := database.DB.Where("id IN ?", userIDs).Find(&users).Error; err != nil {
		return nil, err
	}

	// 4. 组装结果 (注意：DB返回的 users 顺序可能和 userIDs 不一致，需要重新对齐)
	userMap := make(map[string]model.User)
	for _, u := range users {
		userMap[u.ID] = u
	}

	items := make([]dto.RankingItem, 0, len(userIDs))
	for _, uid := range userIDs {
		if u, ok := userMap[uid]; ok {
			items = append(items, dto.RankingItem{
				UserID:    uid,
				Minutes:   scoreMap[uid],
				Nickname:  u.Nickname,
				AvatarURL: u.AvatarUrl,
			})
		}
	}

	return items, nil
}

// GetFriendRankings 获取好友圈排行榜
func (s *RankingService) GetFriendRankings(myID string, scope string, limit int) ([]dto.RankingItem, error) {
	ctx := context.Background()

	// 1. 确定 Key
	var key string
	if scope == "week" {
		year, week := time.Now().ISOWeek()
		key = fmt.Sprintf("ranking:week:%d-%d", year, week)
	} else {
		key = "ranking:total"
	}

	// 2. 获取所有好友 ID (复用 FriendService 的逻辑或直接查库)
	// 这里直接查库获取 accepted 的好友 ID
	var friends []model.Friend
	// 查询作为 User 和作为 Friend 的所有关系
	err := database.DB.Where("status = ? AND (user_id = ? OR friend_id = ?)", model.FriendStatusAccepted, myID, myID).Find(&friends).Error
	if err != nil {
		return nil, err
	}

	// 收集所有涉及的 UserID (包括自己)
	targetIDs := make([]string, 0)
	targetIDs = append(targetIDs, myID) // 加上自己

	for _, f := range friends {
		if f.UserID == myID {
			targetIDs = append(targetIDs, f.FriendID)
		} else {
			targetIDs = append(targetIDs, f.UserID)
		}
	}

	// 去重 (以防数据异常，虽然逻辑上不应该重复)
	targetIDs = removeDuplicate(targetIDs)

	// 3. 批量从 Redis 获取这些 ID 的分数 (Pipeline 优化)
	pipe := database.RDB.Pipeline()
	cmds := make(map[string]*redis.FloatCmd) // 存储命令结果

	for _, id := range targetIDs {
		cmds[id] = pipe.ZScore(ctx, key, id)
	}

	_, err = pipe.Exec(ctx)
	// 注意：Exec 如果有 Key 不存在，ZScore 会返回 redis.Nil 错误，但这在 Pipeline 中通常需要单独处理
	// go-redis 的 pipeline Exec 通常只要有一个错就会返回 err，但 redis.Nil 这种业务错误可以忽略
	if err != nil && err != redis.Nil {
		// 这里简单处理，实际应检查是否只是 Nil 错误
		// 在 go-redis v9 中，pipe.Exec 可能会返回 Nil 错误，我们稍后逐个检查 cmd.Err()
	}

	// 4. 获取用户信息
	var users []model.User
	if err := database.DB.Where("id IN ?", targetIDs).Find(&users).Error; err != nil {
		return nil, err
	}
	userMap := make(map[string]model.User)
	for _, u := range users {
		userMap[u.ID] = u
	}

	// 5. 组装列表
	var rankingList []dto.RankingItem
	for _, id := range targetIDs {
		cmd := cmds[id]
		score := 0.0
		// 检查是否有分数
		if cmd.Err() == nil {
			score = cmd.Val()
		}
		// 如果 cmd.Err() == redis.Nil，说明该用户没学过，score 保持 0.0

		if u, ok := userMap[id]; ok {
			rankingList = append(rankingList, dto.RankingItem{
				UserID:    id,
				Minutes:   int(score),
				Nickname:  u.Nickname,
				AvatarURL: u.AvatarUrl,
			})
		}
	}

	// 6. 内存排序 (分数从高到低)
	sort.Slice(rankingList, func(i, j int) bool {
		return rankingList[i].Minutes > rankingList[j].Minutes
	})

	// 7. 截取 limit
	if len(rankingList) > limit {
		rankingList = rankingList[:limit]
	}

	return rankingList, nil
}

func removeDuplicate(strSlice []string) []string {
	allKeys := make(map[string]bool)
	list := []string{}
	for _, item := range strSlice {
		if _, value := allKeys[item]; !value {
			allKeys[item] = true
			list = append(list, item)
		}
	}
	return list
}
