package service

import (
	"backend/internal/dto"
	"math"
)

type LevelService struct{}

// CalculateLevel 根据总分钟数计算等级信息
func (s *LevelService) CalculateLevel(totalMinutes int) dto.LevelInfo {
	level := 0
	
	// 1. 判断是否超过 80 级 (60,000 分钟)
	if totalMinutes <= 60000 {
		// 公式: Minutes = 9.375 * L^2
		// L = Sqrt(Minutes / 9.375)
		val := math.Sqrt(float64(totalMinutes) / 9.375)
		level = int(math.Floor(val))
	} else {
		// 公式: Minutes = 60000 + 27000 * (L - 80)
		// L = 80 + (Minutes - 60000) / 27000
		extra := totalMinutes - 60000
		level = 80 + int(math.Floor(float64(extra)/27000.0))
	}

	// 限制最高 100 级
	if level > 100 {
		level = 100
	}

	// 2. 计算当前等级的 Floor XP 和 Next XP
	floorXP := s.calculateMinXPForLevel(level)
	nextXP := s.calculateMinXPForLevel(level + 1)
	
	// 3. 计算进度
	progress := 0.0
	if nextXP > floorXP {
		progress = float64(totalMinutes-floorXP) / float64(nextXP-floorXP) * 100
		if progress > 100 {
			progress = 100
		}
		if progress < 0 {
			progress = 0
		}
	}

	return dto.LevelInfo{
		Level:        level,
		CurrentXP:    totalMinutes,
		LevelFloorXP: floorXP,
		NextLevelXP:  nextXP,
		Progress:     progress,
	}
}

// calculateMinXPForLevel 计算达到某等级所需的最小 XP
func (s *LevelService) calculateMinXPForLevel(level int) int {
	if level <= 0 {
		return 0
	}
	
	if level <= 80 {
		// XP = 9.375 * L^2
		return int(math.Ceil(9.375 * float64(level) * float64(level)))
	} else {
		// XP = 60000 + 27000 * (L - 80)
		return 60000 + 27000*(level-80)
	}
}
