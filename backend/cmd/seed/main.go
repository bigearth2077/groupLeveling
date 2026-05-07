package main

import (
	"backend/internal/model"
	"backend/pkg/database"
	"context"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Initialize Database Connection
	database.InitDB()
	database.InitRedis()

	// 1. Nuclear Option: Clear ALL data from the database for a truly clean start
	fmt.Println("Cleaning up all old data from database...")
	
	// Order matters due to foreign keys. Delete join tables and dependent tables first.
	database.DB.Exec("DELETE FROM blog_tags")
	database.DB.Exec("DELETE FROM refresh_tokens")
	database.DB.Exec("DELETE FROM room_members")
	database.DB.Exec("DELETE FROM rooms")
	database.DB.Exec("DELETE FROM study_sessions")
	database.DB.Exec("DELETE FROM user_tag_stats")
	database.DB.Exec("DELETE FROM daily_stats")
	database.DB.Exec("DELETE FROM health_data")
	database.DB.Exec("DELETE FROM blog_likes")
	database.DB.Exec("DELETE FROM blog_bookmarks")
	database.DB.Exec("DELETE FROM blogs")
	database.DB.Exec("DELETE FROM friends")
	database.DB.Exec("DELETE FROM notifications")
	database.DB.Exec("DELETE FROM users")
	database.DB.Exec("DELETE FROM tags")

	// 2. Ensure target user exists
	var targetUser model.User
	email := "test@test.com"
	hash, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
	nickname := "小王"
	avatar := "https://api.dicebear.com/7.x/avataaars/svg?seed=XiaoWang"
	
	targetUser = model.User{
		Email:        email,
		PasswordHash: string(hash),
		Nickname:     nickname,
		AvatarUrl:    &avatar,
	}
	if err := database.DB.Create(&targetUser).Error; err != nil {
		log.Fatalf("Failed to create test user: %v", err)
	}
	fmt.Printf("Created Fresh Test User: %s (pw: 123456)\n", email)

	// 3. Create Basic Tags (Chinese)
	tagNames := []string{"Go语言", "前端开发", "云原生", "机器学习", "高等数学"}
	var tags []model.Tag
	for _, n := range tagNames {
		var tag model.Tag
		if err := database.DB.Where("name = ?", n).FirstOrCreate(&tag, model.Tag{Name: n}).Error; err == nil {
			tags = append(tags, tag)
		}
	}

	// 4. Generate 365 Days of DailyStats (for GitHub Heatmap)
	fmt.Println("Generating ActivityHeatmap (DailyStat) mock data...")
	startOfThisYear := time.Date(time.Now().Year(), 1, 1, 0, 0, 0, 0, time.UTC)
	var dailyStats []model.DailyStat

	for i := 0; i < 365; i++ {
		date := startOfThisYear.AddDate(0, 0, i)
		if date.After(time.Now()) {
			break
		}

		// Random probability: 30% chance to skip study, else 30-180 minutes
		mins := 0
		if rand.Float32() > 0.3 {
			mins = rand.Intn(150) + 30
		}

		if mins > 0 {
			dailyStats = append(dailyStats, model.DailyStat{
				UserID:       targetUser.ID,
				Date:         date,
				TotalMinutes: mins,
			})
		}
	}
	if len(dailyStats) > 0 {
		database.DB.Create(&dailyStats)
	}

	// 5. Generate Study Sessions (for 24h Time Matrix) - mixed habits
	fmt.Println("Generating TimeMatrix (StudySession) mock data (last 30 days)...")
	var sessions []model.StudySession
	now := time.Now()
	for i := 0; i < 60; i++ { // 60 sessions
		daysAgo := rand.Intn(30)
		// Random distribution across the day
		hour := rand.Intn(24)
		
		start := time.Date(now.Year(), now.Month(), now.Day()-daysAgo, hour, rand.Intn(60), 0, 0, time.Local)
		dur := rand.Intn(90) + 30 // 30-120 mins
		end := start.Add(time.Duration(dur) * time.Minute)
		
		tagID := &tags[rand.Intn(len(tags))].ID

		sessions = append(sessions, model.StudySession{
			UserID:          targetUser.ID,
			StartTime:       start,
			EndTime:         &end,
			DurationMinutes: &dur,
			Type:            model.SessionTypeLearning,
			TagID:           tagID,
		})
	}
	if len(sessions) > 0 {
		database.DB.Create(&sessions)
	}

	// 6. Give User some TagStats
	fmt.Println("Assigning user Tag weights to trigger algorithms...")
	for _, tg := range tags {
		database.DB.Create(&model.UserTagStat{
			UserID:       targetUser.ID,
			TagID:        tg.ID,
			TotalMinutes: rand.Intn(2000) + 500, // Very experienced
		})
	}

	// 7. Create Ambient Buddies (Algorithm Matches)
	fmt.Println("Generating fake ambient buddies with diverse habits...")
	buddyConfigs := []struct {
		Name     string
		HourBias int // Base hour for sessions
	}{
		{"张三", 8},  // 早起鸟
		{"李四", 14}, // 下午茶
		{"王五", 20}, // 晚高峰
		{"赵六", 1},  // 夜猫子
	}
	
	var buddies []model.User
	for _, config := range buddyConfigs {
		email := config.Name + "@mock.com"
		var buddy model.User
		
		if err := database.DB.Where("email = ?", email).First(&buddy).Error; err != nil {
			avatar := "https://api.dicebear.com/7.x/avataaars/svg?seed=" + config.Name
			buddy = model.User{
				Email:        email,
				PasswordHash: "nil",
				Nickname:     config.Name,
				AvatarUrl:    &avatar,
				Bio:          ptrString("专注于" + tagNames[rand.Intn(len(tagNames))] + "的学习者"),
			}
			database.DB.Create(&buddy)
		}
		
		// clear old data
		database.DB.Where("user_id = ?", buddy.ID).Delete(&model.UserTagStat{})
		database.DB.Where("user_id = ?", buddy.ID).Delete(&model.StudySession{})
		database.DB.Where("user_id = ?", buddy.ID).Delete(&model.Blog{})
		buddies = append(buddies, buddy)

		// Generate habit sessions for this buddy
		var bSessions []model.StudySession
		for i := 0; i < 40; i++ {
			daysAgo := rand.Intn(30)
			hour := (config.HourBias + rand.Intn(4)) % 24 // 4 hour window
			start := time.Date(now.Year(), now.Month(), now.Day()-daysAgo, hour, rand.Intn(60), 0, 0, time.Local)
			dur := rand.Intn(60) + 30
			end := start.Add(time.Duration(dur) * time.Minute)
			
			bSessions = append(bSessions, model.StudySession{
				UserID:          buddy.ID,
				StartTime:       start,
				EndTime:         &end,
				DurationMinutes: &dur,
				Type:            model.SessionTypeLearning,
			})
		}
		database.DB.Create(&bSessions)
	}

	// 8. Create Active Rooms populated with buddies
	fmt.Println("Populating active recommended rooms...")
	database.DB.Model(&model.Room{}).Where("1=1").Update("is_private", true) // make old rooms private to clean view
	for i, b := range buddies {
		roomDesc := "专注自习，谢绝闲聊，共勉！"
		room := model.Room{
			Name:        fmt.Sprintf("%s的沉浸自习室", b.Nickname),
			Description: &roomDesc,
			CreatorID:   b.ID,
			TagID:       &tags[i%len(tags)].ID,
			IsPrivate:   false,
			MaxMembers:  10,
		}
		database.DB.Create(&room)
		
		// Join room
		database.DB.Create(&model.RoomMember{
			RoomID: room.ID,
			UserID: b.ID,
			Status: model.RoomStatusLearning,
		})
	}

	// 9. Generate HealthData for last 7 days
	fmt.Println("Generating HealthData mock data (last 7 days)...")
	var healthData []model.HealthData
	for i := 0; i < 7; i++ {
		date := time.Date(now.Year(), now.Month(), now.Day()-i, 0, 0, 0, 0, time.UTC)
		
		sleep := float64(rand.Intn(4)) + 5.5 // 5.5 to 8.5
		studyQuality := rand.Intn(3) + 3 // 3 to 5
		mood := rand.Intn(3) + 3 // 3 to 5
		fatigue := rand.Intn(3) + 1 // 1 to 3
		exercise := rand.Intn(60)

		healthData = append(healthData, model.HealthData{
			UserID: targetUser.ID,
			Date: date,
			SleepHours: &sleep,
			StudyQuality: &studyQuality,
			MoodScore: &mood,
			FatigueLevel: &fatigue,
			ExerciseMinutes: &exercise,
		})
	}
	database.DB.Create(&healthData)

	// 10. Generate Blogs & Social interactions
	fmt.Println("Generating Blogs mock data...")
	var blogs []model.Blog
	
	qualityGood := model.BlogQualityGood
	qualityExcellent := model.BlogQualityExcellent
	
	summary1 := "这是一篇关于Go并发编程的深入剖析，探讨了Goroutine的底层原理。强烈推荐给有一定基础的开发者。"
	summary2 := "React 19 的新特性让状态管理变得更简单了。分享一下我在项目中应用 use() 钩子的体验。"
	xp1 := 25
	xp2 := 15

	blogs = append(blogs, model.Blog{
		UserID: targetUser.ID,
		Title: "深入理解 Go 并发模型与协程调度",
		Content: "在这篇文章中，我们将深入探讨 Go 语言的并发模型，包括 Goroutine 和 Channel 的内部实现原理。Go 的 GMP 调度器是其高并发性能的核心...\n\n```go\nfunc main() {\n  go doWork()\n}\n```\n非常硬核的一篇文章。",
		Format: "markdown",
		Status: model.BlogStatusPublished,
		AIQuality: &qualityExcellent,
		Summary: &summary1,
		AIXpPerTag: &xp1,
		LikeCount: 12,
		BookmarkCount: 5,
	})

	blogs = append(blogs, model.Blog{
		UserID: targetUser.ID,
		Title: "React 19 新特性尝鲜记录与避坑指南",
		Content: "今天试用了一下 React 最新的实验性功能，感觉在状态管理方面有了一些新的思路。特别是 use() 这个 hook，它能完美地处理 Promise 并且让代码结构更扁平。但是也有一些陷阱需要注意...",
		Format: "richtext",
		Status: model.BlogStatusPublished,
		AIQuality: &qualityGood,
		Summary: &summary2,
		AIXpPerTag: &xp2,
		LikeCount: 3,
		BookmarkCount: 1,
	})

	for _, b := range buddies {
		blogs = append(blogs, model.Blog{
			UserID: b.ID,
			Title: fmt.Sprintf("%s 的全栈学习周报", b.Nickname),
			Content: "这周主要学习了 Docker 和 K8s，遇到了一些网络配置的坑，也算是顺利解决了。感觉自己在 DevOps 的路上越走越远了...",
			Format: "markdown",
			Status: model.BlogStatusPublished,
			LikeCount: rand.Intn(20),
			BookmarkCount: rand.Intn(5),
		})
	}

	if err := database.DB.Create(&blogs).Error; err != nil {
		fmt.Printf("Failed to create blogs: %v\n", err)
	} else {
		// Assign tags using IDs
		for _, blog := range blogs {
			var bTags []model.Tag
			bTags = append(bTags, tags[rand.Intn(len(tags))])
			bTags = append(bTags, tags[rand.Intn(len(tags))])
			
			// We manually build pq.StringArray
			var tIDs pq.StringArray
			for _, t := range bTags {
				tIDs = append(tIDs, t.ID)
			}
			database.DB.Model(&blog).Update("ai_tag_ids", tIDs)
			database.DB.Model(&blog).Association("BlogTags").Replace(bTags)

			// Randomly let target user like some buddy blogs
			if blog.UserID != targetUser.ID && rand.Float32() > 0.5 {
				database.DB.Create(&model.BlogLike{
					UserID: targetUser.ID,
					BlogID: blog.ID,
				})
			}
		}
	}

	// 11. Sync Data to Redis for Rankings
	fmt.Println("Syncing scores to Redis rankings...")
	ctx := context.Background()
	// CLEAR OLD GARBAGE REDIS DATA caused by failed runs
	database.RDB.FlushAll(ctx)
	
	year, week := time.Now().ISOWeek()
	keyWeek := fmt.Sprintf("ranking:week:%d-%d", year, week)
	keyTotal := "ranking:total"

	// Add exact matching data to Redis to populate leaderboard UI
	database.RDB.ZAdd(ctx, keyWeek, redis.Z{Score: 840, Member: targetUser.ID})
	database.RDB.ZAdd(ctx, keyTotal, redis.Z{Score: 8400, Member: targetUser.ID})

	for i, b := range buddies {
		weekScore := float64(700 + i*100)
		totalScore := weekScore * 10 
		database.RDB.ZAdd(ctx, keyWeek, redis.Z{Score: weekScore, Member: b.ID})
		database.RDB.ZAdd(ctx, keyTotal, redis.Z{Score: totalScore, Member: b.ID})

		// Make them friends with target user so they appear in Friend Rankings
		database.DB.Where("user_id = ? AND friend_id = ?", targetUser.ID, b.ID).FirstOrCreate(&model.Friend{
			UserID:   targetUser.ID,
			FriendID: b.ID,
			Status:   model.FriendStatusAccepted,
		})
	}

	fmt.Println("\n✅ 播种成功！")
	fmt.Println("现在可以在前端查看模拟博客、健康数据以及基于习惯匹配的同频学伴了。")
}

func ptrString(s string) *string {
	return &s
}
