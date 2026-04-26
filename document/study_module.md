# 学习会话模块 API 文档

## 1. 概述

学习会话模块是平台的核心功能，管理用户的番茄钟学习会话（Session）生命周期，包括开始/结束会话、心跳保活、历史记录查询以及学习统计摘要等功能。

**会话类型**：
- `learning`：学习专注会话
- `rest`：休息会话

**核心机制**：
- 同一用户同一时间只能有一个活跃会话
- 后端通过心跳机制检测会话存活状态
- 学习时长自动映射为 XP（1 分钟 = 1 XP），驱动等级系统

**基础路径**：`/study`

---

## 2. HTTP REST API

### 2.1. 开始会话

创建一个新的学习或休息会话。如果用户已有活跃会话，将拒绝创建。

- **接口**：`POST /study/sessions/start`
- **鉴权**：必需（Bearer Token）
- **请求体**：
  ```json
  {
    "type": "learning",               // 必填，枚举值: "learning" | "rest"
    "tagName": "React",               // 可选，学习标签名（按名称关联或创建）
    "tagId": "uuid-string"            // 可选，直接传标签 ID（优先级高于 tagName）
  }
  ```
- **成功响应**（`201 Created`）：
  ```json
  {
    "id": "session-uuid",
    "userId": "user-uuid",
    "type": "learning",
    "startTime": "2024-03-20T10:00:00Z",
    "endTime": null,
    "durationMinutes": null,
    "createdAt": "2024-03-20T10:00:00Z"
  }
  ```
- **错误响应**：
  - `400 Bad Request`：已有活跃会话或参数错误

---

### 2.2. 结束会话

结束指定的活跃会话，后端自动计算时长并更新用户统计数据（DailyStat、UserTagStat）。

- **接口**：`POST /study/sessions/:id/end`
- **鉴权**：必需（Bearer Token）
- **路径参数**：
  - `id`：会话 UUID
- **请求体**：无需（后端自动计算）
- **成功响应**（`200 OK`）：
  ```json
  {
    "id": "session-uuid",
    "userId": "user-uuid",
    "type": "learning",
    "startTime": "2024-03-20T10:00:00Z",
    "endTime": "2024-03-20T10:50:00Z",
    "durationMinutes": 50,
    "createdAt": "2024-03-20T10:00:00Z"
  }
  ```
- **错误响应**：
  - `400 Bad Request`：会话不存在或不属于当前用户

---

### 2.3. 心跳保活

前端定期发送心跳（建议每 30s），后端据此判断会话是否仍然活跃。超时未收到心跳的会话会被后台 Reaper 自动清理。

- **接口**：`POST /study/sessions/:id/heartbeat`
- **鉴权**：必需（Bearer Token）
- **路径参数**：
  - `id`：会话 UUID
- **成功响应**（`200 OK`）：
  ```json
  { "status": "ok" }
  ```
- **错误响应**：
  - `400 Bad Request`：会话不存在

---

### 2.4. 获取活跃会话

获取当前用户正在进行的会话。如果没有活跃会话，返回 `null`。

- **接口**：`GET /study/sessions/active`
- **鉴权**：必需（Bearer Token）
- **成功响应**（`200 OK`）：
  - 有活跃会话时：返回 StudySession 对象
  - 无活跃会话时：返回 `null`

---

### 2.5. 取消活跃会话

强制取消当前活跃的会话（不计入学习统计）。

- **接口**：`DELETE /study/sessions/active`
- **鉴权**：必需（Bearer Token）
- **成功响应**（`200 OK`）：
  ```json
  {
    "ok": true,
    "deleted": 1
  }
  ```

---

### 2.6. 获取历史会话记录

分页查询用户的历史学习/休息会话列表，支持按日期范围和类型筛选。

- **接口**：`GET /study/sessions`
- **鉴权**：必需（Bearer Token）
- **查询参数**：
  - `page`：页码，默认 1
  - `pageSize`：每页条数，默认 20
  - `from`：起始日期（格式 `YYYY-MM-DD`，可选）
  - `to`：结束日期（格式 `YYYY-MM-DD`，可选）
  - `type`：会话类型筛选（`learning` | `rest`，可选）
- **成功响应**（`200 OK`）：
  ```json
  {
    "items": [
      {
        "id": "session-uuid",
        "userId": "user-uuid",
        "type": "learning",
        "startTime": "2024-03-20T10:00:00Z",
        "endTime": "2024-03-20T10:50:00Z",
        "durationMinutes": 50,
        "createdAt": "..."
      }
    ],
    "total": 42,
    "page": 1,
    "pageSize": 20
  }
  ```

---

### 2.7. 获取学习统计摘要

获取指定时间范围内的学习统计数据，包括每日学习时长、总时长、等级信息和连续学习天数。

- **接口**：`GET /study/stats/summary`
- **鉴权**：必需（Bearer Token）
- **查询参数**：
  - `range`：回溯天数（如 `"7"` 表示近 7 天，`"30"` 表示近 30 天）
  - `from`：自定义起始日期（可选，与 range 互斥使用）
  - `to`：自定义结束日期（可选）
  - `type`：会话类型筛选，默认 `"learning"`
  - `tz`：时区，默认 `"Asia/Shanghai"`
- **成功响应**（`200 OK`）：
  ```json
  {
    "type": "learning",
    "tz": "Asia/Shanghai",
    "from": "2024-03-13T00:00:00Z",
    "to": "2024-03-20T00:00:00Z",
    "totalMinutes": 420,
    "daily": [
      { "date": "2024-03-13", "minutes": 60 },
      { "date": "2024-03-14", "minutes": 90 },
      { "date": "2024-03-15", "minutes": 0 }
    ],
    "levelInfo": {
      "level": 5,
      "currentXP": 420,
      "levelFloorXP": 300,
      "nextLevelXP": 600,
      "progress": 40.0
    },
    "currentStreak": 3,
    "longestStreak": 7
  }
  ```

---

## 3. 后台服务

### Study Reaper（会话清理器）

后台定时任务，每 60 秒检查一次：
- 查找 Redis 中心跳超时的活跃会话
- 自动结束这些僵尸会话，计算最终时长并入库
- 确保统计数据准确性

---

## 4. 数据模型

### StudySession（学习会话表）

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | UUID | 主键 |
| UserID | UUID | 关联用户 |
| StartTime | Timestamp | 开始时间 |
| EndTime | Timestamp? | 结束时间（NULL 表示进行中） |
| DurationMinutes | Int? | 时长（分钟） |
| Type | Enum | `learning` \| `rest` |
| TagID | UUID? | 关联学习标签（可选） |
| CreatedAt | Timestamp | 创建时间 |

### DailyStat（每日统计表）

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | UUID | 主键 |
| UserID | UUID | 关联用户（与 Date 构成唯一约束） |
| Date | Date | 日期 |
| TotalMinutes | Int | 当日总学习分钟数 |
