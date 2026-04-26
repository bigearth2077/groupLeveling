# 好友模块 API 文档

## 1. 概述
好友模块管理用户之间的社交关系，包括发送/处理好友请求、好友列表管理和解除关系。支持双向自动匹配机制。

**基础路径**：`/friends`

---

## 2. HTTP REST API

### 2.1. 发送好友请求
- **接口**：`POST /friends/requests`
- **鉴权**：必需（Bearer Token）
- **请求体**：`{ "friendId": "target-user-uuid" }`
- **响应**：新建返回 `201`（pending），自动匹配返回 `200`（accepted）

### 2.2. 获取收到的好友请求
- **接口**：`GET /friends/requests/incoming`
- **鉴权**：必需
- **查询参数**：`page`（默认1）、`pageSize`（默认20）
- **响应**（`200 OK`）：分页列表，每项含发送方用户信息

### 2.3. 获取发出的好友请求
- **接口**：`GET /friends/requests/outgoing`
- **鉴权**：必需
- **查询参数**：同 2.2

### 2.4. 处理好友请求（接受/拒绝）
- **接口**：`POST /friends/requests/:id/act`
- **鉴权**：必需
- **请求体**：`{ "action": "accept" }` 或 `{ "action": "reject" }`
- **响应**：接受返回 `201`，拒绝返回 `200 { "ok": true }`

### 2.5. 获取好友列表
- **接口**：`GET /friends`
- **鉴权**：必需
- **响应**（`200 OK`）：含 `items`（id, nickname, avatarUrl, bio）、`total`、`page`、`pageSize`

### 2.6. 解除好友关系
- **接口**：`DELETE /friends/:id`
- **鉴权**：必需
- **路径参数**：`id` 为好友用户 UUID
- **响应**（`200 OK`）：`{ "ok": true }`

---

## 3. 数据模型

### Friend 表
| 字段 | 类型 | 说明 |
|------|------|------|
| ID | UUID | 主键 |
| UserID | UUID | 请求发送方（与 FriendID 构成唯一约束） |
| FriendID | UUID | 请求接收方 |
| Status | Enum | `pending` \| `accepted` |
| CreatedAt | Timestamp | 创建时间 |
