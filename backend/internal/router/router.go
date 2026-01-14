package router

import (
	"backend/internal/handler"
	"backend/internal/middleware"
	"backend/internal/socket"

	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine) {
	authHandler := &handler.AuthHandler{}
	userHandler := &handler.UserHandler{}
	studyHandler := &handler.StudyHandler{}
	friendHandler := &handler.FriendHandler{}
	rankingHandler := &handler.RankingHandler{}
	roomHandler := &handler.RoomHandler{}
	tagHandler := &handler.TagHandler{}

	// --- Socket.IO 路由挂载 ---
	// 必须在 main 中先 InitSocket()
	// 注意 CORS：Socket.IO 需要专门处理 CORS，或者在 Nginx 层处理
	// Gin 里的处理方式：
	r.GET("/socket.io/*any", gin.WrapH(socket.Server))
	r.POST("/socket.io/*any", gin.WrapH(socket.Server))

	// 公开路由
	r.GET("/tags/search", tagHandler.Search) // 公开搜索
	r.GET("/tags/popular", tagHandler.GetPopular) // 热门标签

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", authHandler.Register)
		authGroup.POST("/login", authHandler.Login)
		authGroup.POST("/refresh", authHandler.Refresh)
	}

	// 需要鉴权的路由
	// 创建一个使用了 AuthMiddleware 的路由组
	protected := r.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		// User 模块
		userGroup := protected.Group("/users")
		{
			userGroup.GET("/me", userHandler.GetMe)
			userGroup.PATCH("/me", userHandler.UpdateMe)
			userGroup.PATCH("/me/password", userHandler.ChangePassword)
			userGroup.DELETE("/me", userHandler.DeleteAccount)

			userGroup.GET("/search", userHandler.SearchUsers) // 对应 /users/search?query=xxx
			userGroup.GET("/:id/public", userHandler.GetPublicProfile)

			// 用户的标签管理
			userGroup.GET("/me/tags", tagHandler.GetMyTags)
			userGroup.POST("/me/tags", tagHandler.AddTag)
			userGroup.DELETE("/me/tags/:id", tagHandler.RemoveTag)
		}

		// Study 路由
		studyGroup := protected.Group("/study")
		{
			studyGroup.POST("/sessions/start", studyHandler.StartSession)
			studyGroup.POST("/sessions/:id/end", studyHandler.EndSession) // 注意 :id
			studyGroup.POST("/sessions/:id/heartbeat", studyHandler.Heartbeat) // 心跳
			studyGroup.GET("/sessions/active", studyHandler.GetActiveSession)
			studyGroup.DELETE("/sessions/active", studyHandler.CancelActiveSession)
			studyGroup.GET("/sessions", studyHandler.GetSessions) // 历史记录

			studyGroup.GET("/stats/summary", studyHandler.GetStatsSummary)
		}

		// Friends 路由
		friendGroup := protected.Group("/friends")
		{
			friendGroup.GET("", friendHandler.GetFriendList)
			friendGroup.DELETE("/:id", friendHandler.DeleteFriend) // 解除好友

			friendGroup.POST("/requests", friendHandler.SendRequest)
			friendGroup.GET("/requests/incoming", friendHandler.GetIncomingRequests)
			friendGroup.GET("/requests/outgoing", friendHandler.GetOutgoingRequests)
			friendGroup.POST("/requests/:id/act", friendHandler.HandleRequest)
			friendGroup.GET("rankings", rankingHandler.GetFriendRankings)
		}

		protected.GET("/rankings", rankingHandler.GetGlobalRankings)

		roomGroup := protected.Group("/rooms")
		{
			roomGroup.POST("", roomHandler.CreateRoom)
			roomGroup.GET("", roomHandler.GetRooms)
			roomGroup.GET("/:id", roomHandler.GetRoom)       // 获取详情
			roomGroup.PATCH("/:id", roomHandler.UpdateRoom)  // 更新房间
			roomGroup.DELETE("/:id", roomHandler.DeleteRoom) // 删除房间
			roomGroup.POST("/validate-password", roomHandler.ValidatePassword) // 新增验证接口
			roomGroup.GET("/:id/members", roomHandler.GetRoomMembers)
		}
	}
}
