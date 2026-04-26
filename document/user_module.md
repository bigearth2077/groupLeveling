# 用户模块 API 文档

## 1. 概述

用户模块负责用户个人资料的查询与管理，包括获取/修改个人信息、修改密码、搜索用户、查看他人公开资料以及注销账号等功能。

**基础路径**：`/users`

---

## 2. HTTP REST API

### 2.1. 获取当前用户信息

获取当前已登录用户的完整个人资料。

- **接口**：`GET /users/me`
- **鉴权**：必需（Bearer Token）
- **成功响应**（`200 OK`）：
  ```json
  {
    "id": "uuid-string",
    "email": "user@example.com",
    "nickname": "小明",
    "avatarUrl": "https://example.com/avatar.png",  // 可能为 null
    "bio": "热爱编程的学生"                           // 可能为 null
  }
  ```
- **错误响应**：
  - `404 Not Found`：用户不存在

---

### 2.2. 更新个人资料

修改当前用户的昵称、头像和个人简介。

- **接口**：`PATCH /users/me`
- **鉴权**：必需（Bearer Token）
- **请求体**：
  ```json
  {
    "nickname": "新昵称",               // 必填，最多 50 字
    "avatarUrl": "https://...",         // 可选，如有则必须是合法 URL
    "bio": "这是我的个人简介"            // 可选，最多 200 字
  }
  ```
- **成功响应**（`200 OK`）：返回更新后的用户资料对象（格式同 2.1）
- **错误响应**：
  - `400 Bad Request`：参数校验失败

---

### 2.3. 修改密码

修改当前用户的登录密码。

- **接口**：`PATCH /users/me/password`
- **鉴权**：必需（Bearer Token）
- **请求体**：
  ```json
  {
    "currentPassword": "old_password",   // 必填
    "newPassword": "new_password"        // 必填，最少 6 位
  }
  ```
- **成功响应**（`200 OK`）：
  ```json
  { "ok": true }
  ```
- **错误响应**：
  - `400 Bad Request`：当前密码错误

---

### 2.4. 注销账号

永久删除当前用户的账号及所有关联数据。

- **接口**：`DELETE /users/me`
- **鉴权**：必需（Bearer Token）
- **成功响应**（`200 OK`）：
  ```json
  { "ok": true }
  ```

---

### 2.5. 搜索用户

按关键词搜索用户（匹配昵称或邮箱），用于添加好友场景。

- **接口**：`GET /users/search`
- **鉴权**：必需（Bearer Token）
- **查询参数**：
  - `query`：搜索关键词（必填）
  - `page`：页码，默认 1
  - `pageSize`：每页条数，默认 20
- **成功响应**（`200 OK`）：
  ```json
  {
    "items": [
      {
        "id": "uuid-string",
        "email": "user@example.com",
        "nickname": "Alice",
        "avatarUrl": "https://...",
        "bio": "前端开发者"
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 20
  }
  ```
- **错误响应**：
  - `400 Bad Request`：缺少 query 参数

---

### 2.6. 获取他人公开资料

查看其他用户的公开主页信息，包含等级和技能标签等游戏化数据。

- **接口**：`GET /users/:id/public`
- **鉴权**：必需（Bearer Token）
- **路径参数**：
  - `id`：目标用户的 UUID
- **成功响应**（`200 OK`）：
  ```json
  {
    "id": "uuid-string",
    "nickname": "Alice",
    "avatarUrl": "https://...",
    "bio": "热爱 Go 语言",
    "levelInfo": {
      "level": 12,
      "currentXP": 450,
      "levelFloorXP": 300,
      "nextLevelXP": 600,
      "progress": 50.0
    },
    "topTags": [
      {
        "tagId": "uuid",
        "tagName": "Go",
        "totalMinutes": 1200,
        "levelInfo": { "level": 8, "currentXP": 1200, "..." : "..." }
      }
    ]
  }
  ```
- **错误响应**：
  - `404 Not Found`：用户不存在

---

## 3. 数据模型

### User（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | UUID | 主键 |
| Email | String | 唯一索引 |
| PasswordHash | String | 密码哈希 |
| Nickname | String | 昵称 |
| AvatarUrl | String? | 头像 URL（可选） |
| Bio | String? | 个人简介（可选） |
| CreatedAt | Timestamp | 创建时间 |
| UpdatedAt | Timestamp | 更新时间 |
