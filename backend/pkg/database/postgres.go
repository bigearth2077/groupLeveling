package database

import (
	"fmt"
	"log"
	"os"

	// 假设稍后会建立 config 包
	"backend/internal/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}
	user := os.Getenv("DB_USER")
	if user == "" {
		user = "postgres"
	}
	password := os.Getenv("DB_PASSWORD")
	if password == "" {
		password = "password"
	}
	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = "mydb"
	}
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Shanghai",
		host, user, password, dbname, port)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	log.Println("Database connected successfully")

	// 自动迁移模式 (类似 Prisma db push)
	// 注意：生产环境建议使用专门的 migration 工具 (如 golang-migrate)
	err = DB.AutoMigrate(
		&model.User{},
		&model.Friend{},
		&model.StudySession{},
		&model.Blog{},
		&model.Room{},
		&model.RoomMember{},
		&model.HealthData{},
		&model.AIReport{},
		&model.RefreshToken{},
	)

	if err != nil {
		log.Fatal("Failed to migrate database: ", err)
	}

	log.Println("Database migration completed")
}
