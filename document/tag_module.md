# 标签模块 API 文档

## 1. 概述
标签（Tag）模块是平台技能分类体系的核心，支持用户创建和管理个人学习标签（如 React、Go、数学等）。标签用于：
- 番茄钟学习会话的分类追踪
- 自习室的主题关联
- 智能匹配算法的特征维度
- 技能等级的独立计算

标签系统还支持别名机制（通过 ParentID），确保 `react`、`React.js` 等变体指向同一标准标签。

**公开路径**：`/tags`
**鉴权路径**：`/users/me/tags`

---

## 2. HTTP REST API

### 2.1. 搜索标签（公开）
- **接口**：`GET /tags/search`
- **鉴权**：无需
- **查询参数**：
  - `q`：搜索关键词（可选，为空时返回热门标签）
- **响应**（`200 OK`）：标签数组
  ```json
  [
    { "id": "uuid", "name": "react" },
    { "id": "uuid", "name": "golang" }
  ]
  ```

### 2.2. 获取热门标签（公开）
- **接口**：`GET /tags/popular`
- **鉴权**：无需
- **响应**（`200 OK`）：热门标签数组（按使用人数排序）

### 2.3. 获取我的标签
- **接口**：`GET /users/me/tags`
- **鉴权**：必需（Bearer Token）
- **响应**（`200 OK`）：
  ```json
  [
    {
      "tagId": "uuid",
      "tagName": "React",
      "totalMinutes": 1200,
      "levelInfo": {
        "level": 8,
        "currentXP": 1200,
        "levelFloorXP": 1000,
        "nextLevelXP": 1500,
        "progress": 40.0
      },
      "lastStudied": "2024-03-20T10:00:00Z"
    }
  ]
  ```

### 2.4. 添加标签
- **接口**：`POST /users/me/tags`
- **鉴权**：必需（Bearer Token）
- **请求体**：`{ "tagName": "Go" }`
- **响应**（`201 Created`）：返回新建的 UserTagResponse 对象
- **逻辑**：如果标签不存在则自动创建，然后关联到用户

### 2.5. 移除标签
- **接口**：`DELETE /users/me/tags/:id`
- **鉴权**：必需（Bearer Token）
- **路径参数**：`id` 为 Tag UUID
- **响应**（`200 OK`）：`{ "status": "ok" }`

---

## 3. 数据模型

### Tag 表
| 字段 | 类型 | 说明 |
|------|------|------|
| ID | UUID | 主键 |
| Name | String | 标签名（唯一索引，小写标准化） |
| ParentID | UUID? | 父标签 ID（别名指向标准词） |
| CreatedAt | Timestamp | 创建时间 |

### UserTagStat 表
| 字段 | 类型 | 说明 |
|------|------|------|
| ID | UUID | 主键 |
| UserID | UUID | 用户 ID（与 TagID 构成唯一约束） |
| TagID | UUID | 标签 ID |
| TotalMinutes | Int | 累计学习分钟数（= XP） |
| UpdatedAt | Timestamp | 最后更新时间 |
