# 智能匹配模块 API 文档

## 1. 概述
匹配模块提供算法驱动的推荐功能，包括"同频学伴"推荐和"推荐自习室"。算法基于 Jaccard 标签交集、Cosine 余弦相似度和活跃度加权等数学方法，无需依赖外部 AI 服务，保证低延迟和高相关性。

**接口路径**：
- 学伴推荐：`GET /users/ambient`
- 房间推荐：`GET /rooms/recommended`

---

## 2. HTTP REST API

### 2.1. 获取同频学伴推荐
返回与当前用户学习标签高度匹配的用户列表，用于侧边栏"环境伙伴"（Ambient Buddy）展示。

- **接口**：`GET /users/ambient`
- **鉴权**：必需（Bearer Token）
- **查询参数**：
  - `limit`：返回数量上限，默认 10
- **响应**（`200 OK`）：
  ```json
  {
    "items": [
      {
        "id": "uuid-string",
        "nickname": "Alice",
        "avatarUrl": "https://example.com/alice.png",
        "bio": "Keep hacking",
        "matchScore": 0.89,
        "sharedTags": ["React", "Go"]
      }
    ]
  }
  ```

### 2.2. 获取推荐自习室
返回按算法相关度排序的公开自习室列表，综合考虑用户标签权重、学习时长比例和房间热度。

- **接口**：`GET /rooms/recommended`
- **鉴权**：必需（Bearer Token）
- **响应**（`200 OK`）：
  ```json
  {
    "items": [
      {
        "id": "uuid-string",
        "name": "深夜 Go 语言学习",
        "description": "安静刷题会话",
        "isPrivate": false,
        "maxMembers": 50,
        "onlineCount": 12,
        "tagName": "Go",
        "tagId": "uuid-tag-123",
        "matchScore": 85.50
      }
    ]
  }
  ```

---

## 3. 算法说明

### 学伴匹配算法
1. 获取当前用户的所有标签及学习时长
2. 查询拥有相同标签的其他用户
3. 计算 Jaccard 相似系数（共同标签 / 并集标签）
4. 加权用户活跃度（近期学习时长）
5. 按综合得分排序返回

### 房间推荐算法
1. 获取所有公开且未满员的房间
2. 计算每个房间的标签与用户标签的匹配度
3. 加权房间在线人数（热度因子）
4. 按综合得分排序返回
