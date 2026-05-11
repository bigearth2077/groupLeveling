package main

import (
	"backend/internal/model"
	"backend/pkg/database"
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

// ========== 常量池 ==========

var firstNames = []string{
	"小明", "小红", "小华", "小丽", "小刚", "小芳", "小伟", "小敏", "小强", "小燕",
	"子轩", "子涵", "子睿", "梓萱", "梓涵", "雨桐", "雨萱", "欣怡", "诗涵", "思颖",
	"浩然", "浩宇", "宇航", "博文", "俊杰", "天翔", "嘉豪", "志远", "一鸣", "鹏飞",
	"晓彤", "婉婷", "雅琪", "静怡", "若曦", "语嫣", "心怡", "佳琪", "思琪", "梦瑶",
	"建国", "建华", "国强", "永强", "大力", "铁柱", "翠花", "桂兰", "秀英", "淑芬",
}

var lastNames = []string{
	"王", "李", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴",
	"徐", "孙", "胡", "朱", "高", "林", "何", "郭", "马", "罗",
	"宋", "谢", "韩", "唐", "冯", "于", "董", "萧", "程", "沈",
}

var bios = []string{
	"考研党，目标985！每天坚持8小时+",
	"前端搬砖工，React/Vue双修",
	"后端开发，专注Go和微服务架构",
	"大三考研ing，数学是最大的敌人",
	"自律即自由，每日打卡学习中",
	"准备CPA考试，会计人永不言弃",
	"备战雅思7.5，阅读和写作冲冲冲",
	"算法竞赛选手，力扣日更一题",
	"产品经理转码中，Python入门选手",
	"研一在读，论文写不完系列",
	"UI设计师，正在学习3D和动效",
	"数据分析师，SQL+Python两手抓",
	"准备教师资格证考试中",
	"法考战士，民法刑法轮番轰炸",
	"日语N1备考，五十音已背烂",
	"嵌入式开发，C语言老司机",
	"全栈学习者，前后端我都要",
	"独立开发者，正在做自己的App",
	"机器学习入门，从线性回归开始",
	"运维工程师，Docker/K8s是我的菜",
}

var tagNames = []string{
	"Go语言", "前端开发", "云原生", "机器学习", "高等数学",
	"考研数学", "考研英语", "考研政治", "线性代数", "数据结构",
	"Python", "Java", "C++", "算法", "操作系统",
	"计算机网络", "数据库原理", "英语四六级", "雅思托福", "日语",
}

// 房间配置
var roomConfigs = []struct {
	Name string
	Desc string
	Tags string
}{
	{"考研数学冲刺营", "高数线代概率论，每日打卡互相监督", "考研,数学,高数"},
	{"前端技术交流站", "React/Vue/Angular，一起卷前端", "前端,React,Vue"},
	{"Go语言深水区", "Goroutine Channel Select，Go到底", "Go,后端,微服务"},
	{"算法刷题自习室", "力扣每日一题，从Easy到Hard", "算法,力扣,刷题"},
	{"考研英语长难句", "阅读理解翻译作文一网打尽", "考研,英语,阅读"},
	{"Python数据分析", "Pandas NumPy Matplotlib走起", "Python,数据分析"},
	{"Java后端修炼场", "Spring Boot源码解读进行时", "Java,Spring,后端"},
	{"深夜自习室·静默", "23:00-次日6:00 全程禁言沉浸学习", "深夜,沉浸,安静"},
	{"早起鸟打卡群", "6:00准时开学！一起做早起的鸟儿", "早起,打卡,自律"},
	{"机器学习入门班", "从零开始学ML，小白友好", "机器学习,AI,深度学习"},
	{"CPA备考互助组", "注册会计师考试，坚持就是胜利", "CPA,会计,财务"},
	{"雅思7分冲刺", "口语写作模拟，每周mock一次", "雅思,英语,出国"},
	{"408计算机考研", "数据结构+操作系统+网络+组成原理", "考研,408,计算机"},
	{"UI/UX设计工坊", "Figma Sketch一起做设计", "设计,UI,Figma"},
	{"云原生实践营", "Docker K8s Istio上手实战", "云原生,Docker,K8s"},
	{"嵌入式开发小组", "STM32 RTOS从入门到放弃再到入门", "嵌入式,C语言,硬件"},
	{"产品经理读书会", "每周共读一本产品/商业好书", "产品经理,读书,商业"},
	{"日语N1备考室", "五十音到N1，一年速通计划", "日语,N1,小语种"},
	{"论文写作互助", "开题报告 文献综述 毕设论文", "论文,毕设,学术"},
	{"自由学习·综合厅", "不限科目，安静学习就好", "综合,自习,自由"},
	{"法考冲刺小队", "民法刑法行政法，法考人加油", "法考,法律,司法考试"},
	{"公务员考试备考", "行测申论面试，上岸必备", "公考,行测,申论"},
	{"数据库进阶研讨", "MySQL PostgreSQL Redis深入", "数据库,SQL,Redis"},
	{"全栈开发训练营", "前后端一起学，T型人才养成", "全栈,前端,后端"},
	{"周末冲刺马拉松", "每周六日10小时+学习挑战", "周末,冲刺,挑战"},
}

var blogTitles = []string{
	"深入理解 Go 并发模型与协程调度",
	"React 19 新特性尝鲜记录与避坑指南",
	"考研数学：泰勒展开的十种应用场景",
	"Docker Compose 多服务编排实战",
	"我的考研英语阅读方法论总结",
	"Python 数据可视化入门到进阶",
	"LeetCode 动态规划专题总结",
	"从零搭建一个 Gin + GORM 项目",
	"CSS Grid 与 Flexbox 终极对比",
	"机器学习中的交叉验证详解",
	"Redis 缓存穿透、击穿、雪崩的解决方案",
	"考研政治：马原唯物辩证法核心考点",
	"TypeScript 高级类型体操入门",
	"如何写一份让导师满意的开题报告",
	"Kubernetes Pod 调度策略深度解析",
	"雅思写作 Task2 高分模板分析",
	"Vue3 Composition API 最佳实践",
	"PostgreSQL 查询优化实战手册",
	"操作系统：进程调度算法对比分析",
	"我的100天学习打卡复盘与感悟",
}

func main() {
	database.InitDB()
	database.InitRedis()

	fmt.Println("🧹 清理旧数据...")
	cleanAll()

	fmt.Println("🏷️  创建标签...")
	tags := createTags()

	fmt.Println("👤 创建测试主账号...")
	me := createTestUser(tags)

	fmt.Println("👥 批量创建500个模拟用户...")
	users := createBulkUsers(500, tags)

	fmt.Println("📚 生成学习数据（会话 + 日统计）...")
	generateStudyData(me, users, tags)

	fmt.Println("🤝 生成好友关系...")
	generateFriendships(me, users)

	fmt.Println("🏠 创建25个丰富的自习室...")
	rooms := createRooms(users, tags)

	fmt.Println("🚪 让用户加入自习室...")
	populateRooms(rooms, users)

	fmt.Println("📝 生成博客内容...")
	generateBlogs(me, users, tags)

	fmt.Println("❤️ 生成健康数据...")
	generateHealthData(me)

	fmt.Println("📊 同步排行榜到Redis...")
	syncRankings(me, users)

	fmt.Println("\n✅ 播种完成！共创建:")
	fmt.Printf("   - 1 个测试账号 (test@test.com / 123456)\n")
	fmt.Printf("   - %d 个模拟用户\n", len(users))
	fmt.Printf("   - %d 个自习室\n", len(rooms))
	fmt.Printf("   - %d 个标签\n", len(tags))
	fmt.Println("   - 海量学习会话、日统计、好友关系、博客、排行榜数据")
}

// ========== 清理 ==========

func cleanAll() {
	tables := []string{
		"blog_tags", "refresh_tokens", "room_members", "rooms",
		"study_sessions", "user_tag_stats", "daily_stats", "health_data",
		"blog_likes", "blog_bookmarks", "blogs", "friends",
		"notifications", "messages", "ai_reports", "users", "tags",
	}
	for _, t := range tables {
		database.DB.Exec("DELETE FROM " + t)
	}
	database.RDB.FlushAll(context.Background())
}

// ========== 标签 ==========

func createTags() []model.Tag {
	var tags []model.Tag
	for _, n := range tagNames {
		tag := model.Tag{Name: n}
		database.DB.Create(&tag)
		tags = append(tags, tag)
	}
	return tags
}

// ========== 主账号 ==========

func createTestUser(tags []model.Tag) model.User {
	hash, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
	avatar := "https://api.dicebear.com/7.x/avataaars/svg?seed=XiaoWang"
	bio := "全栈开发者，GroupLeveling项目作者"
	user := model.User{
		Email: "test@test.com", PasswordHash: string(hash),
		Nickname: "小王", AvatarUrl: &avatar, Bio: &bio,
	}
	database.DB.Create(&user)

	// 给主账号绑定标签经验
	for _, tg := range tags[:5] {
		database.DB.Create(&model.UserTagStat{
			UserID: user.ID, TagID: tg.ID, TotalMinutes: rand.Intn(2000) + 500,
		})
	}
	return user
}

// ========== 批量用户 ==========

func createBulkUsers(count int, tags []model.Tag) []model.User {
	users := make([]model.User, 0, count)

	// 分批创建，每批50个
	batch := make([]model.User, 0, 50)
	for i := 0; i < count; i++ {
		last := lastNames[rand.Intn(len(lastNames))]
		first := firstNames[rand.Intn(len(firstNames))]
		nick := last + first
		email := fmt.Sprintf("user%d@mock.com", i+1)
		avatar := fmt.Sprintf("https://api.dicebear.com/7.x/avataaars/svg?seed=user%d", i+1)
		bio := bios[rand.Intn(len(bios))]

		batch = append(batch, model.User{
			Email: email, PasswordHash: "hashed",
			Nickname: nick, AvatarUrl: &avatar, Bio: &bio,
		})

		if len(batch) >= 50 || i == count-1 {
			database.DB.Create(&batch)
			users = append(users, batch...)
			batch = make([]model.User, 0, 50)
		}
	}

	// 给每个用户随机分配 1~3 个标签经验
	var tagStats []model.UserTagStat
	for _, u := range users {
		numTags := rand.Intn(3) + 1
		usedTags := map[int]bool{}
		for j := 0; j < numTags; j++ {
			idx := rand.Intn(len(tags))
			if usedTags[idx] {
				continue
			}
			usedTags[idx] = true
			tagStats = append(tagStats, model.UserTagStat{
				UserID: u.ID, TagID: tags[idx].ID, TotalMinutes: rand.Intn(3000) + 100,
			})
		}
		if len(tagStats) >= 200 {
			database.DB.Create(&tagStats)
			tagStats = tagStats[:0]
		}
	}
	if len(tagStats) > 0 {
		database.DB.Create(&tagStats)
	}
	return users
}

// ========== 学习数据 ==========

func generateStudyData(me model.User, users []model.User, tags []model.Tag) {
	now := time.Now()
	allUsers := append([]model.User{me}, users...)

	// 定义不同类型的学习者模式
	type HabitProfile struct {
		PeakHour     int     // 高峰开始小时
		HourSpread   int     // 在高峰周围波动的小时数
		AvgSessions  int     // 30天内平均会话数
		AvgDuration  int     // 平均每次会话分钟数
		ActiveRatio  float64 // 哪些天会学习的概率
	}

	profiles := []HabitProfile{
		{7, 3, 50, 60, 0.85},   // 早起鸟：7-10点
		{9, 4, 40, 45, 0.75},   // 正常上午：9-13点
		{14, 3, 35, 50, 0.70},  // 下午学习：14-17点
		{19, 4, 45, 55, 0.80},  // 晚高峰：19-23点
		{22, 4, 30, 70, 0.60},  // 夜猫子：22-02点
		{8, 14, 25, 40, 0.50},  // 零散型：全天随机
	}

	var sessionsBatch []model.StudySession
	var dailyStatsBatch []model.DailyStat

	for idx, u := range allUsers {
		profile := profiles[idx%len(profiles)]

		// 偏移使每个用户略有不同
		peakHour := (profile.PeakHour + rand.Intn(3) - 1 + 24) % 24
		avgSess := profile.AvgSessions + rand.Intn(15) - 7
		if avgSess < 10 {
			avgSess = 10
		}

		// 生成过去 90 天的日统计 (热力图用)
		dailyMap := map[string]int{}
		startDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC).AddDate(0, 0, -90)
		for d := 0; d < 90; d++ {
			date := startDate.AddDate(0, 0, d)
			if date.After(now) {
				break
			}
			if rand.Float64() < profile.ActiveRatio {
				mins := rand.Intn(profile.AvgDuration*2) + 20
				dateStr := date.Format("2006-01-02")
				dailyMap[dateStr] += mins
				dailyStatsBatch = append(dailyStatsBatch, model.DailyStat{
					UserID: u.ID, Date: date, TotalMinutes: mins,
				})
			}
		}

		// 生成过去 30 天的具体会话 (同频匹配 + 时间矩阵用)
		numSessions := avgSess + rand.Intn(10)
		for s := 0; s < numSessions; s++ {
			daysAgo := rand.Intn(30)
			hour := (peakHour + rand.Intn(profile.HourSpread)) % 24
			minute := rand.Intn(60)
			start := time.Date(now.Year(), now.Month(), now.Day()-daysAgo, hour, minute, 0, 0, time.Local)
			dur := rand.Intn(profile.AvgDuration) + 20
			end := start.Add(time.Duration(dur) * time.Minute)
			tagID := &tags[rand.Intn(len(tags))].ID

			sessionsBatch = append(sessionsBatch, model.StudySession{
				UserID: u.ID, StartTime: start, EndTime: &end,
				DurationMinutes: &dur, Type: model.SessionTypeLearning, TagID: tagID,
			})
		}

		// 分批写入
		if len(sessionsBatch) >= 500 {
			database.DB.Create(&sessionsBatch)
			sessionsBatch = sessionsBatch[:0]
		}
		if len(dailyStatsBatch) >= 500 {
			database.DB.Create(&dailyStatsBatch)
			dailyStatsBatch = dailyStatsBatch[:0]
		}

		if (idx+1)%100 == 0 {
			fmt.Printf("   已处理 %d/%d 用户学习数据\n", idx+1, len(allUsers))
		}
	}

	// 写入剩余
	if len(sessionsBatch) > 0 {
		database.DB.Create(&sessionsBatch)
	}
	if len(dailyStatsBatch) > 0 {
		database.DB.Create(&dailyStatsBatch)
	}
}

// ========== 好友关系 ==========

func generateFriendships(me model.User, users []model.User) {
	// 主账号和前30个用户互为好友
	var friends []model.Friend
	friendCount := 30
	if friendCount > len(users) {
		friendCount = len(users)
	}
	for i := 0; i < friendCount; i++ {
		friends = append(friends, model.Friend{
			UserID: me.ID, FriendID: users[i].ID, Status: model.FriendStatusAccepted,
		})
	}

	// 用户之间随机建立好友关系 (模拟社交网络)
	pairSet := map[string]bool{}
	for i := 0; i < 800; i++ {
		a := rand.Intn(len(users))
		b := rand.Intn(len(users))
		if a == b {
			continue
		}
		key := fmt.Sprintf("%s-%s", users[a].ID, users[b].ID)
		if pairSet[key] {
			continue
		}
		pairSet[key] = true
		friends = append(friends, model.Friend{
			UserID: users[a].ID, FriendID: users[b].ID, Status: model.FriendStatusAccepted,
		})
	}

	// 分批写入
	for i := 0; i < len(friends); i += 100 {
		end := i + 100
		if end > len(friends) {
			end = len(friends)
		}
		database.DB.Create(friends[i:end])
	}
}

// ========== 自习室 ==========

func createRooms(users []model.User, tags []model.Tag) []model.Room {
	var rooms []model.Room
	for i, cfg := range roomConfigs {
		creator := users[rand.Intn(len(users))]
		desc := cfg.Desc
		tagID := &tags[i%len(tags)].ID
		maxMem := []int{10, 20, 30, 50}[rand.Intn(4)]

		room := model.Room{
			Name: cfg.Name, Description: &desc,
			CreatorID: creator.ID, TagID: tagID, Tags: cfg.Tags,
			IsPrivate: false, MaxMembers: maxMem,
		}
		database.DB.Create(&room)

		// 房主作为 owner 加入
		database.DB.Create(&model.RoomMember{
			RoomID: room.ID, UserID: creator.ID,
			Status: model.RoomStatusIdle, Role: "owner",
		})
		rooms = append(rooms, room)
	}
	return rooms
}

func populateRooms(rooms []model.Room, users []model.User) {
	var members []model.RoomMember
	for _, room := range rooms {
		// 每个房间随机 3~15 个在线成员
		numMembers := rand.Intn(13) + 3
		used := map[string]bool{room.CreatorID: true}

		for j := 0; j < numMembers; j++ {
			u := users[rand.Intn(len(users))]
			if used[u.ID] {
				continue
			}
			used[u.ID] = true

			statuses := []model.RoomStatus{model.RoomStatusLearning, model.RoomStatusRest, model.RoomStatusIdle}
			members = append(members, model.RoomMember{
				RoomID: room.ID, UserID: u.ID,
				Status: statuses[rand.Intn(3)], Role: "member",
			})
		}
	}
	if len(members) > 0 {
		database.DB.Create(&members)
	}
}

// ========== 博客 ==========

func generateBlogs(me model.User, users []model.User, tags []model.Tag) {
	qualityGood := model.BlogQualityGood
	qualityExcellent := model.BlogQualityExcellent
	xp := 20

	var blogs []model.Blog
	// 主账号写2篇
	for i := 0; i < 2; i++ {
		summary := fmt.Sprintf("这是一篇关于%s的深入剖析文章。", tagNames[rand.Intn(len(tagNames))])
		blogs = append(blogs, model.Blog{
			UserID: me.ID, Title: blogTitles[i],
			Content: "这篇文章详细探讨了该领域的核心概念和实战经验...\n\n## 核心要点\n\n1. 理论基础\n2. 实战案例\n3. 避坑指南",
			Format: "markdown", Status: model.BlogStatusPublished,
			AIQuality: &qualityExcellent, Summary: &summary, AIXpPerTag: &xp,
			LikeCount: rand.Intn(30) + 5, BookmarkCount: rand.Intn(10),
		})
	}

	// 随机50个用户各写1篇
	for i := 0; i < 50 && i < len(users); i++ {
		titleIdx := rand.Intn(len(blogTitles))
		summary := fmt.Sprintf("%s的学习笔记和心得分享。", users[i].Nickname)
		blogs = append(blogs, model.Blog{
			UserID: users[i].ID, Title: blogTitles[titleIdx],
			Content: "今天学了不少新东西，记录一下以免忘记...\n\n重要的知识点整理和个人理解。",
			Format: "markdown", Status: model.BlogStatusPublished,
			AIQuality: &qualityGood, Summary: &summary, AIXpPerTag: &xp,
			LikeCount: rand.Intn(25), BookmarkCount: rand.Intn(8),
		})
	}

	database.DB.Create(&blogs)

	// 关联标签和点赞
	for _, blog := range blogs {
		var bTags []model.Tag
		bTags = append(bTags, tags[rand.Intn(len(tags))])
		var tIDs pq.StringArray
		for _, t := range bTags {
			tIDs = append(tIDs, t.ID)
		}
		database.DB.Model(&blog).Update("ai_tag_ids", tIDs)
		database.DB.Model(&blog).Association("BlogTags").Replace(bTags)

		if blog.UserID != me.ID && rand.Float32() > 0.5 {
			database.DB.Create(&model.BlogLike{UserID: me.ID, BlogID: blog.ID})
		}
	}
}

// ========== 健康数据 ==========

func generateHealthData(me model.User) {
	now := time.Now()
	var hd []model.HealthData
	for i := 0; i < 14; i++ {
		date := time.Date(now.Year(), now.Month(), now.Day()-i, 0, 0, 0, 0, time.UTC)
		sleep := float64(rand.Intn(4)) + 5.5
		sq := rand.Intn(3) + 3
		mood := rand.Intn(3) + 3
		fat := rand.Intn(3) + 1
		ex := rand.Intn(60)
		hd = append(hd, model.HealthData{
			UserID: me.ID, Date: date,
			SleepHours: &sleep, StudyQuality: &sq,
			MoodScore: &mood, FatigueLevel: &fat, ExerciseMinutes: &ex,
		})
	}
	database.DB.Create(&hd)
}

// ========== Redis 排行榜 ==========

func syncRankings(me model.User, users []model.User) {
	ctx := context.Background()
	year, week := time.Now().ISOWeek()
	keyWeek := fmt.Sprintf("ranking:week:%d-%d", year, week)
	keyTotal := "ranking:total"

	// 主账号高排名
	database.RDB.ZAdd(ctx, keyWeek, redis.Z{Score: 920, Member: me.ID})
	database.RDB.ZAdd(ctx, keyTotal, redis.Z{Score: 12000, Member: me.ID})

	// 所有用户按活跃度随机分布
	var zWeek, zTotal []redis.Z
	for _, u := range users {
		ws := float64(rand.Intn(800) + 50)
		ts := float64(rand.Intn(15000) + 500)
		zWeek = append(zWeek, redis.Z{Score: ws, Member: u.ID})
		zTotal = append(zTotal, redis.Z{Score: ts, Member: u.ID})

		if len(zWeek) >= 200 {
			database.RDB.ZAdd(ctx, keyWeek, zWeek...)
			database.RDB.ZAdd(ctx, keyTotal, zTotal...)
			zWeek = zWeek[:0]
			zTotal = zTotal[:0]
		}
	}
	if len(zWeek) > 0 {
		database.RDB.ZAdd(ctx, keyWeek, zWeek...)
		database.RDB.ZAdd(ctx, keyTotal, zTotal...)
	}

	// 设置周榜过期
	database.RDB.Expire(ctx, keyWeek, 14*24*time.Hour)
}

func ptrString(s string) *string {
	return &s
}
