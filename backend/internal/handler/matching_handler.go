package handler

import (
	"backend/internal/dto"
	"backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type MatchingHandler struct {
	Service *service.MatchingService
}

func NewMatchingHandler(s *service.MatchingService) *MatchingHandler {
	return &MatchingHandler{Service: s}
}

// GetAmbientBuddies returns recommended buddies for silent side-bar rendering
func (h *MatchingHandler) GetAmbientBuddies(c *gin.Context) {
	userID := c.GetString("userId")
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}

	buddies, err := h.Service.GetAmbientBuddies(userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := make([]dto.AmbientBuddyResponse, 0, len(buddies))
	for _, b := range buddies {
		resp = append(resp, dto.AmbientBuddyResponse{
			ID:         b.ID,
			Nickname:   b.Nickname,
			AvatarURL:  b.AvatarUrl,
			Bio:        b.Bio,
			MatchScore: b.MatchScore,
			SharedTags: b.SharedTags,
		})
	}

	c.JSON(http.StatusOK, gin.H{"items": resp})
}

// GetRecommendedRooms returns active public rooms scored by algorithm
func (h *MatchingHandler) GetRecommendedRooms(c *gin.Context) {
	userID := c.GetString("userId")

	rooms, err := h.Service.GetRecommendedRooms(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"items": rooms})
}
