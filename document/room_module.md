# 自习室模块 API 文档

## 1. 概述
自习室（Room / Squad）模块管理在线自习室的完整生命周期，包括创建、发现、管理房间以及实时交互功能。模块同时提供 HTTP REST API（用于管理操作）和 Socket.IO 实时通信（聊天、状态同步）。

**基础路径**：`/rooms`

---

## 2. HTTP REST API

### 2.1. 创建自习室
- **接口**：`POST /rooms`
- **鉴权**：必需（Bearer Token）
- **请求体**：
  ```json
  {
    "name": "深夜刷题局",               // 必填，最多 50 字
    "description": "专注 Go 语言学习",   // 可选
    "tagId": "uuid-string",             // 可选，关联标签 UUID
    "maxMembers": 20,                   // 可选，默认 50
    "isPrivate": true,                  // 可选，是否私密
    "password": "secret"                // 可选，私密房间时必填
  }
  ```
- **响应**（`201 Created`）：返回 RoomResponse 对象

### 2.2. 获取自习室列表
- **接口**：`GET /rooms`
- **鉴权**：必需
- **查询参数**：
  - `page`：页码，默认 1
  - `pageSize`：每页条数，默认 20
  - `tag`：按标签 ID 筛选（可选）
  - `search`：按名称/描述搜索（可选）
- **响应**（`200 OK`）：
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "name": "学习大厅",
        "description": "...",
        "onlineCount": 5,
        "maxMembers": 50,
        "isPrivate": false,
        "hasPassword": false,
        "creatorId": "user-uuid",
        "createdAt": "...",
        "tagName": "通用"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
  ```

### 2.3. 获取自习室详情
- **接口**：`GET /rooms/:id`
- **鉴权**：必需
- **响应**（`200 OK`）：返回完整 RoomResponse，含 `creatorId` 可判断房主身份

### 2.4. 更新自习室设置
- **接口**：`PATCH /rooms/:id`
- **鉴权**：必需（仅房主可操作）
- **请求体**：所有字段可选（name、description、maxMembers、isPrivate、password）
- **响应**（`200 OK`）：返回更新后的 RoomResponse

### 2.5. 删除自习室
- **接口**：`DELETE /rooms/:id`
- **鉴权**：必需（仅房主可操作）
- **响应**（`200 OK`）：`{ "ok": true }`

### 2.6. 验证房间密码（预检）
- **接口**：`POST /rooms/validate-password`
- **鉴权**：必需
- **请求体**：`{ "roomId": "uuid", "password": "input" }`
- **响应**：`200 OK` 密码正确；`403 Forbidden` 密码错误

### 2.7. 获取房间成员
- **接口**：`GET /rooms/:id/members`
- **鉴权**：必需
- **响应**（`200 OK`）：
  ```json
  {
    "items": [
      {
        "userId": "uuid",
        "nickname": "Alice",
        "avatarUrl": "http://...",
        "status": "learning",
        "joinedAt": "..."
      }
    ],
    "total": 5
  }
  ```

---

## 3. Socket.IO 实时事件

**命名空间**：`/`
**连接方式**：需携带 `token` 查询参数（JWT）
```
ws://host/socket.io/?token=YOUR_JWT_TOKEN&transport=websocket
```

### 3.1. 客户端 → 服务端事件

| 事件名 | 载荷 | 说明 |
|--------|------|------|
| `join_room` | `{ "roomId": "uuid", "password": "可选" }` | 加入自习室 |
| `leave_room` | `{ "roomId": "uuid" }` | 离开自习室 |
| `send_message` | `{ "roomId": "uuid", "content": "消息内容" }` | 发送聊天消息 |
| `update_status` | `{ "roomId": "uuid", "status": "learning" }` | 更新学习状态 |

> status 可选值：`learning`（学习中）、`rest`（休息中）、`idle`（空闲）

### 3.2. 服务端 → 客户端广播事件

| 事件名 | 数据 | 说明 |
|--------|------|------|
| `user_joined` | `{ "user": { "id", "nickname", "avatarUrl" } }` | 有用户加入 |
| `user_left` | `{ "userId": "uuid" }` | 有用户离开 |
| `new_message` | `{ "id", "content", "createdAt", "sender": {...} }` | 新聊天消息 |
| `status_updated` | `{ "userId": "uuid", "status": "learning" }` | 用户状态变更 |

---

## 4. 数据模型

### Room 表
| 字段 | 类型 | 说明 |
|------|------|------|
| ID | UUID | 主键 |
| Name | String | 房间名称 |
| Description | Text? | 房间简介 |
| CreatorID | UUID | 房主用户 ID |
| TagID | UUID? | 关联标签 |
| IsPrivate | Boolean | 是否私密（默认 false） |
| Password | String? | 访问密码 |
| MaxMembers | Int | 人数上限（默认 50） |

### RoomMember 表
| 字段 | 类型 | 说明 |
|------|------|------|
| RoomID | UUID | 外键关联 Room |
| UserID | UUID | 外键关联 User |
| Status | Enum | `learning` / `rest` / `idle` |
| JoinedAt | Timestamp | 加入时间 |
| LeftAt | Timestamp? | 离开时间 |
