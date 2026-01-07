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
	TagStats      []UserTagStat  `gorm:"foreignKey:UserID"`
}

type DailyStat struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID       string    `gorm:"type:uuid;not null;index:idx_user_date,unique"` // 复合唯一索引
	Date         time.Time `gorm:"type:date;not null;index:idx_user_date,unique"` // 复合唯一索引
	TotalMinutes int       `gorm:"default:0"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`

	User User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

type Tag struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name      string    `gorm:"uniqueIndex;not null"` // 标准化名称 (lowercase)
	ParentID  *string   `gorm:"type:uuid;default:null;index"` // 指向父标签(标准词)ID，实现别名机制
	CreatedAt time.Time `gorm:"autoCreateTime"`

	// Relations
	Parent   *Tag          `gorm:"foreignKey:ParentID"`
	Children []Tag         `gorm:"foreignKey:ParentID"`
	Stats    []UserTagStat `gorm:"foreignKey:TagID"`
}

type UserTagStat struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID       string    `gorm:"type:uuid;not null;index:idx_user_tag,unique"`
	TagID        string    `gorm:"type:uuid;not null;index:idx_user_tag,unique"`
	TotalMinutes int       `gorm:"default:0"` // 1 min = 1 XP
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`

	User User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Tag  Tag  `gorm:"foreignKey:TagID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
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
	TagID           *string     `gorm:"type:uuid;default:null;index"` // 允许为空，兼容旧数据

	User User `gorm:"foreignKey:UserID"`
	Tag  *Tag `gorm:"foreignKey:TagID"`
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
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name        string    `gorm:"not null"`
	Description *string   `gorm:"type:text"` // 房间简介
	
	// 房间属性
	CreatorID   string    `gorm:"type:uuid;not null"`         // 房主
	TagID       *string   `gorm:"type:uuid;default:null"`     // 关联标签
	IsPrivate   bool      `gorm:"default:false"`              // 是否私密(不公开列出)
	Password    *string   `gorm:"default:null"`               // 访问密码
	MaxMembers  int       `gorm:"default:50"`                 // 人数上限
	
	CreatedAt   time.Time `gorm:"autoCreateTime"`
	
	// Relations
	Members []RoomMember `gorm:"foreignKey:RoomID"`
	Tag     *Tag         `gorm:"foreignKey:TagID"`
	Creator User         `gorm:"foreignKey:CreatorID"`
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
