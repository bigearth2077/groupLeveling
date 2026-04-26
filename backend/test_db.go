package main

import (
	"backend/internal/model"
	"backend/pkg/database"
	"fmt"
)

func main() {
	database.InitDB()
	var blogs []model.Blog
	database.DB.Order("created_at desc").Limit(3).Find(&blogs)
	for _, b := range blogs {
		fmt.Printf("ID: %s, Title: %s, CharCount: %d, AIQuality: %v\n", b.ID, b.Title, len([]rune(b.Content)), b.AIQuality)
	}
}
