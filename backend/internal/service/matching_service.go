package service

import (
	"backend/internal/model"
	"backend/internal/dto"
	"backend/pkg/database"
	"fmt"
	"math"
	"sort"
	"time"
)

type MatchingService struct {
	AnalyticsService *AnalyticsService
}

// UserHabitProfile represents the calculated profile for matching based on usage habits
type UserHabitProfile struct {
	UserID             string
	MorningRatio       float64 // 06:00 - 12:00
	AfternoonRatio     float64 // 12:00 - 18:00
	EveningRatio       float64 // 18:00 - 24:00
	NightRatio         float64 // 00:00 - 06:00
	NormalizedAvgDur   float64 // Avg session duration normalized (e.g., max 120 min -> 1.0)
	NormalizedDailyMin float64 // Daily avg minutes normalized (e.g., max 480 min -> 1.0)
	RawAvgDur          int
	TotalMins          int
	PrimaryHabitLabel  string  // E.g., "夜猫子"
}

// fetchUserHabitProfile builds a user's habit profile from their recent 30-day study sessions
func (s *MatchingService) fetchUserHabitProfile(userID string) (*UserHabitProfile, error) {
	var sessions []model.StudySession
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	
	if err := database.DB.Where("user_id = ? AND start_time > ? AND duration_minutes IS NOT NULL", userID, thirtyDaysAgo).Find(&sessions).Error; err != nil {
		return nil, err
	}

	profile := &UserHabitProfile{
		UserID: userID,
	}

	if len(sessions) == 0 {
		return profile, nil
	}

	var morning, afternoon, evening, night float64
	var totalSessions int
	var totalMins int

	for _, session := range sessions {
		if session.DurationMinutes == nil || *session.DurationMinutes <= 0 {
			continue
		}
		mins := *session.DurationMinutes
		totalMins += mins
		totalSessions++

		hour := session.StartTime.Hour()
		if hour >= 6 && hour < 12 {
			morning += float64(mins)
		} else if hour >= 12 && hour < 18 {
			afternoon += float64(mins)
		} else if hour >= 18 && hour <= 23 {
			evening += float64(mins)
		} else {
			night += float64(mins)
		}
	}

	if totalMins > 0 {
		profile.MorningRatio = morning / float64(totalMins)
		profile.AfternoonRatio = afternoon / float64(totalMins)
		profile.EveningRatio = evening / float64(totalMins)
		profile.NightRatio = night / float64(totalMins)
		
		// Find primary label
		maxRatio := profile.MorningRatio
		profile.PrimaryHabitLabel = "早起鸟"
		if profile.AfternoonRatio > maxRatio {
			maxRatio = profile.AfternoonRatio
			profile.PrimaryHabitLabel = "下午茶"
		}
		if profile.EveningRatio > maxRatio {
			maxRatio = profile.EveningRatio
			profile.PrimaryHabitLabel = "晚高峰"
		}
		if profile.NightRatio > maxRatio {
			profile.PrimaryHabitLabel = "夜猫子"
		}

		profile.RawAvgDur = totalMins / totalSessions
		// Normalize avg duration (cap at 120)
		profile.NormalizedAvgDur = math.Min(float64(profile.RawAvgDur)/120.0, 1.0)
		
		// Normalize daily mins (cap at 480)
		dailyMins := float64(totalMins) / 30.0
		profile.NormalizedDailyMin = math.Min(dailyMins/480.0, 1.0)
	}
	
	profile.TotalMins = totalMins

	return profile, nil
}

// calculateCosineSimilarity calculates similarity between two users based on their habit vectors
func (s *MatchingService) calculateCosineSimilarity(p1, p2 *UserHabitProfile) float64 {
	if p1.TotalMins == 0 || p2.TotalMins == 0 {
		return 0.0 // No shared baseline
	}

	// 6D Vector: [Morning, Afternoon, Evening, Night, AvgDur, DailyMin]
	v1 := []float64{p1.MorningRatio, p1.AfternoonRatio, p1.EveningRatio, p1.NightRatio, p1.NormalizedAvgDur, p1.NormalizedDailyMin}
	v2 := []float64{p2.MorningRatio, p2.AfternoonRatio, p2.EveningRatio, p2.NightRatio, p2.NormalizedAvgDur, p2.NormalizedDailyMin}

	dotProduct := 0.0
	norm1 := 0.0
	norm2 := 0.0

	for i := 0; i < 6; i++ {
		dotProduct += v1[i] * v2[i]
		norm1 += v1[i] * v1[i]
		norm2 += v2[i] * v2[i]
	}

	if norm1 == 0 || norm2 == 0 {
		return 0.0
	}

	return dotProduct / (math.Sqrt(norm1) * math.Sqrt(norm2))
}

// AmbientBuddy represents a recommended user
type AmbientBuddy struct {
	model.User
	MatchScore  float64
	SharedTags  []string // Repurposed for habit summary in MVP
}

// GetAmbientBuddies finds active users with similar study habits
func (s *MatchingService) GetAmbientBuddies(userID string, limit int) ([]AmbientBuddy, error) {
	currentUserProfile, err := s.fetchUserHabitProfile(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user habit profile: %v", err)
	}

	var activeUsers []model.User
	threeDaysAgo := time.Now().AddDate(0, 0, -3)
	// Fetch recent users (last 3 days active)
	if err := database.DB.Where("updated_at > ?", threeDaysAgo).Order("updated_at DESC").Limit(50).Find(&activeUsers).Error; err != nil {
		return nil, err
	}

	var candidates []AmbientBuddy

	for _, u := range activeUsers {
		if u.ID == userID {
			continue // skip self
		}

		profile, err := s.fetchUserHabitProfile(u.ID)
		if err != nil || profile.TotalMins == 0 {
			continue
		}

		// Calculate similarity
		score := s.calculateCosineSimilarity(currentUserProfile, profile)
		
		if score > 0.1 || currentUserProfile.TotalMins == 0 { // Allow new users to match randomly
			summary := fmt.Sprintf("同为%s · 均次%dmin", profile.PrimaryHabitLabel, profile.RawAvgDur)
			
			candidates = append(candidates, AmbientBuddy{
				User:       u,
				MatchScore: score,
				SharedTags: []string{summary},
			})
		}
	}

	// If no matches, fall back to simple recent list
	if len(candidates) == 0 {
		for _, u := range activeUsers {
			if u.ID != userID {
				candidates = append(candidates, AmbientBuddy{
					User:       u,
					MatchScore: 0.0,
					SharedTags: []string{"近期活跃用户"},
				})
				if len(candidates) >= limit {
					break
				}
			}
		}
	}

	// Sort candidates by score descending
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].MatchScore > candidates[j].MatchScore
	})

	if len(candidates) > limit {
		candidates = candidates[:limit]
	}

	return candidates, nil
}

// GetRecommendedRooms returns active rooms sorted by relevance to the user
func (s *MatchingService) GetRecommendedRooms(userID string) ([]dto.RoomResponse, error) {
	_, err := s.fetchUserHabitProfile(userID)
	if err != nil {
		return nil, err
	}

	var rooms []model.Room
	// Fetch public rooms
	if err := database.DB.Preload("Tag").Preload("Creator").Where("is_private = ?", false).Find(&rooms).Error; err != nil {
		return nil, err
	}

	type RoomWithScore struct {
		Room  model.Room
		Score float64
	}

	var matchGrid []RoomWithScore

	for _, room := range rooms {
		score := 0.0

		// Since tags are killed, we just score based on popularity and activity
		// or we could match room tags to user habits if we really wanted to, 
		// but the user wants simple list for now.

		// 2. Activity / Popularity score
		var memberCount int64
		database.DB.Model(&model.RoomMember{}).Where("room_id = ?", room.ID).Count(&memberCount)
		score += float64(memberCount) * 2.0 // small bump for active rooms

		matchGrid = append(matchGrid, RoomWithScore{Room: room, Score: score})
	}

	// Sort by score
	sort.Slice(matchGrid, func(i, j int) bool {
		return matchGrid[i].Score > matchGrid[j].Score
	})

	// Convert to DTO
	var response []dto.RoomResponse
	for _, item := range matchGrid {
		var onlineCount int64
		database.DB.Model(&model.RoomMember{}).Where("room_id = ?", item.Room.ID).Count(&onlineCount)
		
		var tagName string
		if item.Room.Tag != nil {
			tagName = item.Room.Tag.Name
		}
		
		response = append(response, dto.RoomResponse{
			ID:          item.Room.ID,
			Name:        item.Room.Name,
			Description: item.Room.Description,
			CreatorID:   item.Room.CreatorID,
			IsPrivate:   item.Room.IsPrivate,
			MaxMembers:  item.Room.MaxMembers,
			CreatedAt:   item.Room.CreatedAt,
			TagID:       item.Room.TagID,
			TagName:     tagName,
			OnlineCount: int(onlineCount),
			HasPassword: item.Room.Password != nil,
			MatchScore:  math.Round(item.Score * 100) / 100, // Round to 2 decimals
		})
	}

	return response, nil
}
