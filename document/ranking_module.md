# 排行榜模块 API 文档

## 1. 概述
排行榜模块提供全站和好友之间的学习时长排名功能，支持按时间范围（本周/全部）和技能标签筛选。排名数据基于 Redis Sorted Set 实现，保证高性能读取。

**基础路径**：`/rankings`（全站）、`/friends/rankings`（好友）

---

## 2. HTTP REST API

### 2.1. 全站排行榜
- **接口**：`GET /rankings`
- **鉴权**：必需（Bearer Token）
- **查询参数**：
  - `scope`：时间范围，`week`（本周）或 `all`（全部），默认 `week`
  - `limit`：返回条数，默认 50
  - `tag`：按标签名筛选（可选）
- **响应**（`200 OK`）：
  ```json
  {
    "items": [
      {
        "userId": "uuid",
        "nickname": "Alice",
        "avatarUrl": "https://...",
        "minutes": 420
      }
    ]
  }
  ```

### 2.2. 好友排行榜
- **接口**：`GET /friends/rankings`
- **鉴权**：必需（Bearer Token）
- **查询参数**：
  - `scope`：`week` | `all`，默认 `week`
  - `limit`：返回条数，默认 50
- **响应**（`200 OK`）：格式同 2.1

---

## 3. 数据模型

### RankingItem
| 字段 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户 UUID |
| nickname | String | 昵称 |
| avatarUrl | String? | 头像 URL |
| minutes | Int | 学习总分钟数 |
