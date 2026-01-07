package model

import (
	"time"

	"github.com/lib/pq"
)

// --- Enums ---

type FriendStatus string

const (
	FriendStatusPending  FriendStatus = "pending"
	FriendStatusAccepted FriendStatus = "accepted"
)

type SessionType string

const (
	SessionTypeLearning SessionType = "learning"
	SessionTypeRest     SessionType = "rest"
)

type RoomStatus string

const (
	RoomStatusLearning RoomStatus = "learning"
	RoomStatusRest     RoomStatus = "rest"
	RoomStatusIdle     RoomStatus = "idle"
)

// --- Models ---

type User struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"` // 依赖 Postgres pgcrypto
	Email        string    `gorm:"uniqueIndex;not null"`
	PasswordHash string    `gorm:"not null"`
	Nickname     string    `gorm:"not null"`
	AvatarUrl    *string   `gorm:"default:null"` // 指针类型表示可选
	Bio          *string   `gorm:"default:null"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`

	// Relations
	StudySessions []StudySession `gorm:"foreignKey:UserID"`
	Blogs         []Blog         `gorm:"foreignKey:UserID"`
	Friends       []Friend       `gorm:"foreignKey:UserID"`   // UserFriends
	FriendOf      []Friend       `gorm:"foreignKey:FriendID"` // FriendOf
	RoomMembers   []RoomMember   `gorm:"foreignKey:UserID"`
	HealthData    []HealthData   `gorm:"foreignKey:UserID"`
	AIReports     []AIReport     `gorm:"foreignKey:UserID"`
	RefreshTokens []RefreshToken `gorm:"foreignKey:UserID"`
	DailyStats    []DailyStat    `gorm:"foreignKey:UserID"`
}

type DailyStat struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID       string    `gorm:"type:uuid;not null;index:idx_user_date,unique"` // 复合唯一索引
	Date         time.Time `gorm:"type:date;not null;index:idx_user_date,unique"` // 复合唯一索引
	TotalMinutes int       `gorm:"default:0"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`

	User User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

type Friend struct {
	ID        string       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    string       `gorm:"type:uuid;not null;index:idx_user_friend,unique"` // 复合唯一索引的一部分
	FriendID  string       `gorm:"type:uuid;not null;index:idx_user_friend,unique;index"`
	Status    FriendStatus `gorm:"type:varchar(20);not null;index"`
	CreatedAt time.Time    `gorm:"autoCreateTime"`

	// Relations
	User       User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	FriendUser User `gorm:"foreignKey:FriendID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

type StudySession struct {
	ID              string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID          string      `gorm:"type:uuid;not null;index"` // 配合 startTime/endTime 的索引可以手动在 DB 加，或者 GORM 这种简单写法
	StartTime       time.Time   `gorm:"not null;index"`
	EndTime         *time.Time  `gorm:"default:null;index"`
	DurationMinutes *int        `gorm:"default:null"`
	Type            SessionType `gorm:"type:varchar(20);not null"`
	CreatedAt       time.Time   `gorm:"autoCreateTime"`

	User User `gorm:"foreignKey:UserID"`
}

type Blog struct {
	ID        string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    string         `gorm:"type:uuid;not null"`
	Title     string         `gorm:"not null"`
	Content   string         `gorm:"type:text;not null"`
	Tags      pq.StringArray `gorm:"type:text[]"` // Postgres 数组
	CreatedAt time.Time      `gorm:"autoCreateTime"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime"`

	User User `gorm:"foreignKey:UserID"`
}

type Room struct {
	ID        string       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name      string       `gorm:"not null"`
	CreatedAt time.Time    `gorm:"autoCreateTime"`
	Members   []RoomMember `gorm:"foreignKey:RoomID"`
}

type RoomMember struct {
	ID       string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	RoomID   string     `gorm:"type:uuid;not null"`
	UserID   string     `gorm:"type:uuid;not null"`
	Status   RoomStatus `gorm:"type:varchar(20);not null"`
	JoinedAt time.Time  `gorm:"autoCreateTime"`
	LeftAt   *time.Time `gorm:"default:null"`

	Room Room `gorm:"foreignKey:RoomID"`
	User User `gorm:"foreignKey:UserID"`
}

type HealthData struct {
	ID              string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID          string    `gorm:"type:uuid;not null"`
	Date            time.Time `gorm:"not null"`
	SleepHours      *float64  `gorm:"default:null"`
	ExerciseMinutes *int      `gorm:"default:null"`
	CreatedAt       time.Time `gorm:"autoCreateTime"`

	User User `gorm:"foreignKey:UserID"`
}

type AIReport struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID     string    `gorm:"type:uuid;not null"`
	ReportText string    `gorm:"type:text;not null"`
	CreatedAt  time.Time `gorm:"autoCreateTime"`

	User User `gorm:"foreignKey:UserID"`
}

type RefreshToken struct {
	ID        string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    string     `gorm:"type:uuid;not null;index"`
	TokenHash string     `gorm:"not null;index"`
	ExpiresAt time.Time  `gorm:"not null"`
	RevokedAt *time.Time `gorm:"default:null"`
	CreatedAt time.Time  `gorm:"autoCreateTime"`

	User User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"` // 对应 onDelete: Cascade
}
