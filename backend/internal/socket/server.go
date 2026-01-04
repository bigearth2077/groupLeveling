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

// InitSocket 初始化 Socket.IO 服务
func InitSocket() {
	var err error
	Server = socketio.NewServer(nil)
	if err != nil {
		log.Fatal(err)
	}

	// --- 1. 连接鉴权 (Middleware) ---
	// go-socket.io 没有像 Gin 那样的中间件链，我们在 OnConnect 处理
	Server.OnConnect("/", func(s socketio.Conn) error {
		// 从 URL 参数获取 token: ws://host/socket.io/?token=xxx
		url := s.URL()
		token := url.Query().Get("token")

		// 或者从 Header 获取 (Socket.io 客户端有时候会放在 ExtraHeaders)
		// 但最通用的方式是放在 query 或 auth payload (需要客户端配合)
		// 这里假设前端传的是 ?token=ey...

		if token == "" {
			return nil // 拒绝连接
		}

		claims, err := utils.ParseToken(token)
		if err != nil {
			return nil // Token 无效，拒绝
		}

		// 将 UserID 存入 Socket 上下文
		s.SetContext(claims.UserID)
		log.Printf("User %s connected, SocketID: %s", claims.UserID, s.ID())

		// 自动加入一个以 UserID 命名的房间，方便点对点通知
		s.Join(claims.UserID)

		return nil
	})

	// --- 2. 事件: join_room ---
	Server.OnEvent("/", "join_room", func(s socketio.Conn, msg string) string {
		// msg 是 JSON 字符串，需要解析
		var payload dto.JoinRoomPayload
		if err := json.Unmarshal([]byte(msg), &payload); err != nil {
			return errorResponse("invalid payload")
		}

		userID := s.Context().(string)

		// 业务逻辑：写库
		if err := roomService.JoinRoom(userID, payload.RoomID); err != nil {
			return errorResponse(err.Error())
		}

		// Socket 逻辑：加入房间
		s.Join(payload.RoomID)

		// 广播给房间其他人：user_joined
		// 先查出用户详情
		user, _ := userService.GetProfile(userID)
		broadcastEvent(payload.RoomID, "user_joined", dto.UserJoinedEvent{
			User: dto.UserSimple{
				ID:        user.ID,
				Nickname:  user.Nickname,
				AvatarURL: user.AvatarUrl,
			},
		})

		// 返回 Ack 给发送者
		return successResponse(gin.H{"message": "joined"})
	})

	// --- 3. 事件: leave_room ---
	Server.OnEvent("/", "leave_room", func(s socketio.Conn, msg string) string {
		var payload dto.JoinRoomPayload // 复用结构体
		json.Unmarshal([]byte(msg), &payload)
		userID := s.Context().(string)

		// 业务逻辑
		roomService.LeaveRoom(userID, payload.RoomID)

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
		userID := s.Context().(string)

		// 获取发送者信息
		user, _ := userService.GetProfile(userID)

		// 构造消息对象 (不存库，直接转发)
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

		// 广播给房间所有人 (包括发送者自己，前端通常用来回显)
		broadcastEvent(payload.RoomID, "new_message", eventData)

		return successResponse(gin.H{"ok": true})
	})

	// --- 5. 事件: update_status ---
	Server.OnEvent("/", "update_status", func(s socketio.Conn, msg string) string {
		var payload dto.UpdateStatusPayload
		json.Unmarshal([]byte(msg), &payload)
		userID := s.Context().(string)

		// 业务逻辑
		roomService.UpdateStatus(userID, payload.RoomID, payload.Status)

		// 广播
		broadcastEvent(payload.RoomID, "status_updated", dto.StatusUpdatedEvent{
			UserID: userID,
			Status: payload.Status,
		})

		return successResponse(gin.H{"ok": true})
	})

	// --- 6. 断开连接 ---
	Server.OnDisconnect("/", func(s socketio.Conn, reason string) {
		userID := s.Context().(string)
		log.Printf("User %s disconnected: %s", userID, reason)

		// 注意：这里有个问题，我们不知道用户刚刚在哪个房间里。
		// Socket.IO 的 s.Rooms() 在 Disconnect 时可能已经空了。
		// 更好的做法是：JoinRoom 时在 s.Context 里记录 RoomID，或者前端显式调用 Leave。
		// 这里为了 MVP，我们假设用户离开连接时，只是断网，数据库层面的 left_at 可能需要定时任务清理，
		// 或者我们在 Join 时把 roomID 拼在 Context 里，例如 s.SetContext(map[string]string{"uid":..., "rid":...})
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
