package service

import (
	"backend/internal/model"
	"backend/pkg/database"
	"context"
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
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
					
					// 使用事务处理清理逻辑，确保 DailyStats 同步更新
					err = database.DB.Transaction(func(tx *gorm.DB) error {
						if err := tx.Save(&session).Error; err != nil {
							return err
						}
			
									// 调用 DailyStats 更新
									s := &StudyService{}
									if err := s.updateDailyStats(tx, session.UserID, session.StartTime, duration); err != nil {
										return err
									}
						
									// 调用 TagStats 更新
									if session.TagID != nil {
										if err := s.updateUserTagStats(tx, session.UserID, *session.TagID, duration); err != nil {
											return err
										}
									}
									
									return nil
								})			
					if err != nil {
						log.Printf("[Reaper] Failed to save session %s: %v\n", session.ID, err)
						continue
					}
			
					// 4. 更新排行榜 (调用统一的辅助方法)
					s := &StudyService{}
					// 注意: Redis 更新可以放在事务外，或者只要不报错就行
					if err := s.updateRankings(ctx, session.UserID, duration, endTime); err != nil {
						log.Printf("[Reaper] Failed to update rankings for session %s: %v\n", session.ID, err)
					}
					
					// 5. 确保删除心跳 Key
					database.RDB.Del(ctx, key)
				}
			}
