# 健康打卡模块 API 文档

## 1. 概述
健康模块管理用户的非学习类生理数据（如睡眠和运动），支持每日打卡记录。用于辅助 AI 学习评估和生活习惯追踪。

**基础路径**：`/health`

---

## 2. HTTP REST API

### 2.1. 每日打卡（睡眠记录）
记录或更新当前 UTC 日期的睡眠数据。同一天内重复打卡会覆盖之前的记录。

- **接口**：`POST /health/check-in`
- **鉴权**：必需（Bearer Token）
- **请求体**：
  ```json
  {
    "sleepHours": 7.5,                 // 睡眠时长（小时）
    "sleepQuality": "great"            // 可选，枚举值: "bad" | "okay" | "great"
  }
  ```
- **响应**（`200 OK`）：
  ```json
  { "ok": true }
  ```

---

## 3. 数据模型

### HealthData 表
| 字段 | 类型 | 说明 |
|------|------|------|
| ID | UUID | 主键 |
| UserID | UUID | 用户（与 Date 构成唯一约束） |
| Date | Date | 日期 |
| SleepHours | Float? | 睡眠时长 |
| SleepQuality | String? | 睡眠质量（bad/okay/great） |
| ExerciseMinutes | Int? | 运动时长（预留字段） |
| CreatedAt | Timestamp | 创建时间 |
