package main

import (
	"backend/internal/model"
	"backend/pkg/database"
	"context"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Initialize Database Connection
	database.InitDB()
	database.InitRedis()

	// 1. Ensure target user exists (or create one)
	var targetUser model.User
	email := "test@test.com"
	if err := database.DB.Where("email = ?", email).First(&targetUser).Error; err != nil {
		hash, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
		nickname := "Edward"
		avatar := "https://api.dicebear.com/7.x/avataaars/svg?seed=Edward"
		
		targetUser = model.User{
			Email:        email,
			PasswordHash: string(hash),
			Nickname:     nickname,
			AvatarUrl:    &avatar,
		}
		if err := database.DB.Create(&targetUser).Error; err != nil {
			log.Fatalf("Failed to create test user: %v", err)
		}
		fmt.Printf("Created Test User: %s (pw: 123456)\n", email)
	} else {
		fmt.Printf("Found Target User: %s\n", email)
	}

	// 2. Clear old test data for this user to avoid unique constraint mess
	database.DB.Where("user_id = ?", targetUser.ID).Delete(&model.DailyStat{})
	database.DB.Where("user_id = ?", targetUser.ID).Delete(&model.StudySession{})
	database.DB.Where("user_id = ?", targetUser.ID).Delete(&model.UserTagStat{})

	// 3. Create Basic Tags
	tagNames := []string{"Go", "React", "Docker", "Machine Learning", "Math"}
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

	// 5. Generate Study Sessions (for 24h Time Matrix) - focus typically at night
	fmt.Println("Generating TimeMatrix (StudySession) mock data (last 30 days)...")
	var sessions []model.StudySession
	now := time.Now()
	for i := 0; i < 60; i++ { // 60 sessions
		daysAgo := rand.Intn(30)
		// Bias towards 8 PM to 2 AM
		hour := rand.Intn(6) + 20
		if hour > 23 {
			hour = hour - 24
		}
		
		start := time.Date(now.Year(), now.Month(), now.Day()-daysAgo, hour, rand.Intn(60), 0, 0, time.UTC)
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
	fmt.Println("Generating fake ambient buddies...")
	buddyNames := []string{"Alex", "Jessica", "Bob", "Sam"}
	var buddies []model.User
	for _, bName := range buddyNames {
		email := bName + "@mock.com"
		var buddy model.User
		
		if err := database.DB.Where("email = ?", email).First(&buddy).Error; err != nil {
			avatar := "https://api.dicebear.com/7.x/avataaars/svg?seed=" + bName
			buddy = model.User{
				Email:        email,
				PasswordHash: "nil",
				Nickname:     bName,
				AvatarUrl:    &avatar,
			}
			database.DB.Create(&buddy)
		}
		
		// clear old stats for this buddy to prevent duplicate keys
		database.DB.Where("user_id = ?", buddy.ID).Delete(&model.UserTagStat{})
		buddies = append(buddies, buddy)

		// Give them EXACT SAME TAGS as user to guarantee high Match Score
		for i := 0; i < 3; i++ {
			database.DB.Create(&model.UserTagStat{
				UserID:       buddy.ID,
				TagID:        tags[i].ID,
				TotalMinutes: rand.Intn(2000),
			})
		}
	}

	// 8. Create Active Rooms populated with buddies
	fmt.Println("Populating active recommended rooms...")
	database.DB.Update("is_private", true) // make old rooms private to clean view
	for i, b := range buddies {
		roomDesc := "Hardcore coding session"
		room := model.Room{
			Name:        fmt.Sprintf("%s's Deep Work Squad", b.Nickname),
			Description: &roomDesc,
			CreatorID:   b.ID,
			TagID:       &tags[i].ID, // Highly matched tags
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

	// 9. Sync Data to Redis for Rankings
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
		// Mock buddy points (slightly higher or lower for good leaderboard spread)
		weekScore := float64(700 + i*100)
		totalScore := weekScore * 10 
		database.RDB.ZAdd(ctx, keyWeek, redis.Z{Score: weekScore, Member: b.ID})
		database.RDB.ZAdd(ctx, keyTotal, redis.Z{Score: totalScore, Member: b.ID})

		// Make them friends with target user so they appear in Friend Rankings
		database.DB.Create(&model.Friend{
			UserID:   targetUser.ID,
			FriendID: b.ID,
			Status:   model.FriendStatusAccepted,
		})
	}

	fmt.Println("\n✅ SEEDING COMPLETE!")
	fmt.Println("Check the browser! Your UI should now explode with beautiful data visuals.")
}
