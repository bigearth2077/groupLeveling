package service

import (
	"backend/internal/model"
	"backend/internal/dto"
	"backend/pkg/database"
	"fmt"
	"math"
	"sort"
)

type MatchingService struct {
	AnalyticsService *AnalyticsService
}

// UserProfileScore represents the calculated profile for matching
type UserProfileScore struct {
	UserID     string
	TagWeights map[string]int // TagID -> Minutes Spent
	TotalMins  int
}

// AmbientBuddy represents a recommended user
type AmbientBuddy struct {
	model.User
	MatchScore  float64
	SharedTags  []string
}

// FetchUserProfile builds a user's tag activity profile for similarity comparison
func (s *MatchingService) fetchUserProfile(userID string) (*UserProfileScore, error) {
	var tagStats []model.UserTagStat
	if err := database.DB.Where("user_id = ?", userID).Find(&tagStats).Error; err != nil {
		return nil, err
	}

	profile := &UserProfileScore{
		UserID:     userID,
		TagWeights: make(map[string]int),
	}

	for _, stat := range tagStats {
		profile.TagWeights[stat.TagID] = stat.TotalMinutes
		profile.TotalMins += stat.TotalMinutes
	}

	return profile, nil
}

// calculateCosineSimilarity calculates similarity between two users based on their tag weights
func (s *MatchingService) calculateCosineSimilarity(p1, p2 *UserProfileScore) float64 {
	if p1.TotalMins == 0 || p2.TotalMins == 0 {
		return 0.0 // No shared baseline
	}

	dotProduct := 0.0
	norm1 := 0.0
	norm2 := 0.0

	// Calculate dot product and norm for p1
	for tagID, weight1 := range p1.TagWeights {
		w1 := float64(weight1)
		norm1 += w1 * w1
		if weight2, exists := p2.TagWeights[tagID]; exists {
			dotProduct += w1 * float64(weight2)
		}
	}

	// Calculate norm for p2
	for _, weight2 := range p2.TagWeights {
		w2 := float64(weight2)
		norm2 += w2 * w2
	}

	if norm1 == 0 || norm2 == 0 {
		return 0.0
	}

	return dotProduct / (math.Sqrt(norm1) * math.Sqrt(norm2))
}

// GetAmbientBuddies finds active users with similar study habits
func (s *MatchingService) GetAmbientBuddies(userID string, limit int) ([]AmbientBuddy, error) {
	currentUserProfile, err := s.fetchUserProfile(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user profile: %v", err)
	}

	// For MVP, we fetch all users who have active sessions right now or were active recently
	// In production, you would only query users currently connected/online via Redis or Socket keys.
	var activeUsers []model.User
	// Just fetch top 100 recent users to avoid scanning entire DB
	database.DB.Order("updated_at DESC").Limit(100).Find(&activeUsers)

	var candidates []AmbientBuddy

	for _, u := range activeUsers {
		if u.ID == userID {
			continue // skip self
		}

		profile, err := s.fetchUserProfile(u.ID)
		if err != nil || profile.TotalMins == 0 {
			continue
		}

		score := s.calculateCosineSimilarity(currentUserProfile, profile)
		
		// If there's a meaningful match
		if score > 0.1 {
			// Find shared tags
			shared := []string{}
			for tagID := range currentUserProfile.TagWeights {
				if _, exists := profile.TagWeights[tagID]; exists {
					var tag model.Tag
					if err := database.DB.Select("name").Where("id = ?", tagID).First(&tag).Error; err == nil {
						shared = append(shared, tag.Name)
					}
				}
			}

			candidates = append(candidates, AmbientBuddy{
				User:       u,
				MatchScore: score,
				SharedTags: shared,
			})
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
	currentUserProfile, err := s.fetchUserProfile(userID)
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

		// 1. Tag Matching Score (Primary Match)
		if room.TagID != nil {
			if userTimeSpent, exists := currentUserProfile.TagWeights[*room.TagID]; exists {
				// Base score for simply matching
				score += 50.0 
				// Bonus points for how heavily the user studies this tag (up to +20)
				ratio := float64(userTimeSpent) / float64(currentUserProfile.TotalMins)
				score += ratio * 20.0
			}
		}

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
