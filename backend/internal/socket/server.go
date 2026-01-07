package socket

import (
	"backend/internal/dto"
	"backend/internal/service"
	"backend/pkg/utils"
	"encoding/json"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	socketio "github.com/googollee/go-socket.io"
)

var Server *socketio.Server
var roomService service.RoomService
var userService service.UserService // 需要获取用户信息

// 辅助结构体，存入 Context
type SocketContext struct {
	UserID string
	RoomID string // 当前所在的房间ID
}

// InitSocket 初始化 Socket.IO 服务
func InitSocket() {
	var err error
	Server = socketio.NewServer(nil)
	if err != nil {
		log.Fatal(err)
	}

	// --- 1. 连接鉴权 (Middleware) ---
	Server.OnConnect("/", func(s socketio.Conn) error {
		url := s.URL()
		token := url.Query().Get("token")

		if token == "" {
			return nil // 拒绝连接
		}

		claims, err := utils.ParseToken(token)
		if err != nil {
			return nil // Token 无效，拒绝
		}

		// 初始化 Context
		s.SetContext(&SocketContext{
			UserID: claims.UserID,
			RoomID: "",
		})
		log.Printf("User %s connected, SocketID: %s", claims.UserID, s.ID())

		// 自动加入一个以 UserID 命名的房间
		s.Join(claims.UserID)

		return nil
	})

	// --- 2. 事件: join_room ---
	Server.OnEvent("/", "join_room", func(s socketio.Conn, msg string) string {
		var payload dto.JoinRoomPayload
		if err := json.Unmarshal([]byte(msg), &payload); err != nil {
			return errorResponse("invalid payload")
		}

		ctx := s.Context().(*SocketContext)
		userID := ctx.UserID

		// 业务逻辑：写库
		if err := roomService.JoinRoom(userID, payload.RoomID); err != nil {
			return errorResponse(err.Error())
		}

		// 更新 Context，记录当前房间
		ctx.RoomID = payload.RoomID

		// Socket 逻辑：加入房间
		s.Join(payload.RoomID)

		// 广播给房间其他人
		user, _ := userService.GetProfile(userID)
		broadcastEvent(payload.RoomID, "user_joined", dto.UserJoinedEvent{
			User: dto.UserSimple{
				ID:        user.ID,
				Nickname:  user.Nickname,
				AvatarURL: user.AvatarUrl,
			},
		})

		return successResponse(gin.H{"message": "joined"})
	})

	// --- 3. 事件: leave_room ---
	Server.OnEvent("/", "leave_room", func(s socketio.Conn, msg string) string {
		var payload dto.JoinRoomPayload
		json.Unmarshal([]byte(msg), &payload)
		
		ctx := s.Context().(*SocketContext)
		userID := ctx.UserID

		// 业务逻辑
		roomService.LeaveRoom(userID, payload.RoomID)
		
		// 清理 Context
		if ctx.RoomID == payload.RoomID {
			ctx.RoomID = ""
		}

		// Socket 逻辑
		s.Leave(payload.RoomID)

		// 广播
		broadcastEvent(payload.RoomID, "user_left", dto.UserLeftEvent{
			UserID: userID,
		})

		return successResponse(gin.H{"ok": true})
	})

	// --- 4. 事件: send_message ---
	Server.OnEvent("/", "send_message", func(s socketio.Conn, msg string) string {
		var payload dto.SendMessagePayload
		json.Unmarshal([]byte(msg), &payload)
		
		ctx := s.Context().(*SocketContext)
		userID := ctx.UserID

		// 获取发送者信息
		user, _ := userService.GetProfile(userID)

		// 构造消息对象
		eventData := dto.NewMessageEvent{
			ID:        uuid.New().String(),
			Content:   payload.Content,
			CreatedAt: time.Now(),
			Sender: dto.UserSimple{
				ID:        user.ID,
				Nickname:  user.Nickname,
				AvatarURL: user.AvatarUrl,
			},
		}

		// 广播
		broadcastEvent(payload.RoomID, "new_message", eventData)

		return successResponse(gin.H{"ok": true})
	})

	// --- 5. 事件: update_status ---
	Server.OnEvent("/", "update_status", func(s socketio.Conn, msg string) string {
		var payload dto.UpdateStatusPayload
		json.Unmarshal([]byte(msg), &payload)
		
		ctx := s.Context().(*SocketContext)
		userID := ctx.UserID

		// 业务逻辑
		roomService.UpdateStatus(userID, payload.RoomID, payload.Status)

		// 广播
		broadcastEvent(payload.RoomID, "status_updated", dto.StatusUpdatedEvent{
			UserID: userID,
			Status: payload.Status,
		})

		return successResponse(gin.H{"ok": true})
	})

	// --- 6. 断开连接 (修复逻辑) ---
	Server.OnDisconnect("/", func(s socketio.Conn, reason string) {
		// 检查 Context
		if s.Context() == nil {
			return
		}
		
		ctx, ok := s.Context().(*SocketContext)
		if !ok {
			return
		}
		
		userID := ctx.UserID
		log.Printf("User %s disconnected: %s", userID, reason)

		// 如果用户在房间里，执行离开逻辑
		if ctx.RoomID != "" {
			log.Printf("Auto leaving room %s for user %s", ctx.RoomID, userID)
			
			// 1. 业务逻辑离开
			roomService.LeaveRoom(userID, ctx.RoomID)
			
			// 2. 广播 (虽然 Socket 断了发不出去给自己，但可以发给房间里其他人)
			// 注意：go-socket.io 此时连接已断，Server.BroadcastToRoom 依然有效
			broadcastEvent(ctx.RoomID, "user_left", dto.UserLeftEvent{
				UserID: userID,
			})
		}
	})

	go Server.Serve()
	log.Println("Socket.IO server started")
}

// 辅助：广播事件
func broadcastEvent(roomID, event string, data interface{}) {
	// go-socket.io 的 BroadcastTo 是把数据转 json 发送
	// 注意：go-socket.io v1.x 和 v2/v4 行为略有不同，这里使用标准库行为
	Server.BroadcastToRoom("/", roomID, event, data)
}

// 辅助：Ack 响应
func successResponse(data interface{}) string {
	b, _ := json.Marshal(data)
	return string(b)
}

func errorResponse(msg string) string {
	b, _ := json.Marshal(gin.H{"error": msg})
	return string(b)
}
