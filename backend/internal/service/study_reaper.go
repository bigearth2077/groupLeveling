package service

import (
	"backend/internal/model"
	"backend/pkg/database"
	"context"
	"fmt"
	"log"
	"time"
)

// StartSessionReaper 启动后台清理任务
// 建议在 main.go 中 go service.StartSessionReaper() 调用
func StartSessionReaper() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		reapSessions()
	}
}

func reapSessions() {
	log.Println("[Reaper] Checking for inactive sessions...")
	ctx := context.Background()
	var activeSessions []model.StudySession

	// 1. 查询所有未结束的会话
	if err := database.DB.Where("end_time IS NULL").Find(&activeSessions).Error; err != nil {
		log.Printf("[Reaper] Error fetching sessions: %v\n", err)
		return
	}

		for _, session := range activeSessions {
			// 2. 检查 Redis 心跳 Key
			key := fmt.Sprintf("study:heartbeat:%s", session.ID)
			_, err := database.RDB.Get(ctx, key).Result()
	
			// 情况 A: Key 存在 (用户在线)
			if err == nil {
				continue
			}
	
			log.Printf("[Reaper] Session %s seems dead. Cleaning up...", session.ID)
	
			endTime := time.Now().Add(-3 * time.Minute)
			if endTime.Before(session.StartTime) {
				endTime = session.StartTime
			}
	
			duration := int(endTime.Sub(session.StartTime).Minutes())
	
			// 更新 DB
			session.EndTime = &endTime
			session.DurationMinutes = &duration
			
			if err := database.DB.Save(&session).Error; err != nil {
				log.Printf("[Reaper] Failed to save session %s: %v\n", session.ID, err)
				continue
			}
	
			// 4. 更新排行榜 (调用统一的辅助方法)
			s := &StudyService{}
			if err := s.updateRankings(ctx, session.UserID, duration, endTime); err != nil {
				log.Printf("[Reaper] Failed to update rankings for session %s: %v\n", session.ID, err)
			}
			
			// 5. 确保删除心跳 Key
			database.RDB.Del(ctx, key)
		}
	}
