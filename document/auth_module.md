# 认证模块 API 文档

## 1. 概述

认证模块负责用户的注册、登录和 Token 刷新。系统采用 JWT（JSON Web Token）双 Token 机制：
- **Access Token**：短期有效，用于日常接口鉴权
- **Refresh Token**：长期有效，用于在 Access Token 过期后无感刷新

**基础路径**：`/auth`

---

## 2. HTTP REST API

### 2.1. 用户注册

创建新用户账号，注册成功后同时返回 Token 对，前端可直接登录。

- **接口**：`POST /auth/register`
- **鉴权**：无需
- **请求体**：
  ```json
  {
    "email": "user@example.com",      // 必填，合法邮箱格式
    "password": "my_password",        // 必填，最少 6 位
    "nickname": "小明"                // 必填
  }
  ```
- **成功响应**（`201 Created`）：
  ```json
  {
    "id": "uuid-string",
    "email": "user@example.com",
    "nickname": "小明",
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
  ```
- **错误响应**：
  - `400 Bad Request`：参数校验失败或邮箱已注册

---

### 2.2. 用户登录

使用邮箱和密码登录，返回 Token 对和用户基本信息。

- **接口**：`POST /auth/login`
- **鉴权**：无需
- **请求体**：
  ```json
  {
    "email": "user@example.com",      // 必填
    "password": "my_password"         // 必填
  }
  ```
- **成功响应**（`200 OK`）：
  ```json
  {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "nickname": "小明"
    }
  }
  ```
- **错误响应**：
  - `401 Unauthorized`：邮箱或密码错误

---

### 2.3. 刷新 Token

使用 Refresh Token 获取一对新的 Access Token 和 Refresh Token（Token 轮转策略）。

- **接口**：`POST /auth/refresh`
- **鉴权**：无需
- **请求体**：
  ```json
  {
    "refreshToken": "eyJhbGci..."     // 必填，之前获取的 Refresh Token
  }
  ```
- **成功响应**（`200 OK`）：
  ```json
  {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
  ```
- **错误响应**：
  - `401 Unauthorized`：Refresh Token 无效或已过期，前端应跳转到登录页

---

## 3. 数据模型

### User（用户表 — 与认证相关字段）

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | UUID | 主键，自动生成 |
| Email | String | 唯一索引，用户邮箱 |
| PasswordHash | String | bcrypt 加密后的密码哈希 |
| Nickname | String | 用户昵称 |
| CreatedAt | Timestamp | 创建时间 |

### RefreshToken（刷新令牌表）

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | UUID | 主键 |
| UserID | UUID | 关联用户 |
| TokenHash | String | Token 哈希值（索引） |
| ExpiresAt | Timestamp | 过期时间 |
| RevokedAt | Timestamp | 撤销时间（NULL 表示有效） |
| CreatedAt | Timestamp | 创建时间 |

---

## 4. 鉴权中间件说明

受保护路由使用 `AuthMiddleware`，从 HTTP Header 的 `Authorization: Bearer <token>` 中提取并验证 Access Token，验证通过后将 `userId` 注入请求上下文。
