# GroupLeveling 前端页面文档

## 1. 技术栈概览

| 类别 | 技术 |
|------|------|
| 框架 | React 18 + Vite |
| 样式 | Tailwind CSS |
| 状态管理 | Zustand |
| 路由 | React Router v6 (createBrowserRouter) |
| 图表 | ECharts (echarts-for-react)、自定义 SVG 热力图 |
| 实时通信 | Socket.IO Client |
| HTTP 请求 | 封装的 request.js（基于 fetch/axios） |
| UI 组件 | shadcn/ui 风格自定义组件 |
| 图标 | Lucide React |

---

## 2. 项目目录结构

```
frontend-react/src/
├── App.jsx                       # 根组件（备用布局，未实际使用）
├── main.jsx                      # 应用入口，挂载 RouterProvider
├── index.css                     # 全局样式 + Tailwind 配置
│
├── router/
│   └── index.jsx                 # 路由配置（核心文件）
│
├── layout/
│   ├── AppLayout.jsx             # 主布局（导航栏 + 番茄钟浮窗 + 全局组件）
│   └── auth/
│       └── AuthLayout.jsx        # 认证页布局（登录/注册共用）
│
├── pages/                        # 页面组件
│   ├── login/
│   │   ├── Login.jsx             # 登录页
│   │   └── components/           # 登录页子组件（装饰元素）
│   ├── register/
│   │   └── Register.jsx          # 注册页
│   ├── home/
│   │   └── Home.jsx              # 首页仪表盘
│   ├── room/
│   │   ├── RoomLobby.jsx         # 自习室大厅
│   │   └── RoomDetail.jsx        # 自习室详情（实时聊天）
│   ├── ranking/
│   │   └── Leaderboard.jsx       # 排行榜页
│   └── user/
│       └── Profile.jsx           # 个人中心页
│
├── components/                   # 通用/共享组件
│   ├── PomodoroDock.jsx          # 番茄钟浮动控制台（全局可见）
│   ├── auth/
│   │   └── index.jsx             # Auth 鉴权守卫组件
│   ├── friend/
│   │   ├── FriendDrawer.jsx      # 好友侧边抽屉
│   │   ├── FriendList.jsx        # 好友列表
│   │   ├── RequestList.jsx       # 好友请求列表
│   │   └── UserSearch.jsx        # 用户搜索组件
│   ├── room/
│   │   ├── RoomConnectionManager.jsx  # Socket 连接管理器
│   │   ├── RoomPasswordModal.jsx      # 房间密码弹窗
│   │   └── RoomSettingsModal.jsx      # 房间设置弹窗
│   ├── user/
│   │   └── UserProfileModal.jsx       # 用户资料弹窗
│   └── ui/                       # 基础 UI 组件（shadcn 风格）
│       ├── avatar.jsx
│       ├── button.jsx
│       ├── card.jsx
│       ├── dropdown-menu.jsx
│       └── input.jsx
│
├── feature/                      # 按业务领域划分的功能模块
│   ├── analytics/
│   │   ├── api/index.js          # 数据分析 API
│   │   └── components/
│   │       ├── ActivityHeatmap.jsx    # 年度活动热力图
│   │       └── TimeMatrix.jsx         # 24h 时段分布矩阵
│   ├── auth/
│   │   ├── api/index.js          # 认证 API
│   │   ├── components/
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   ├── hooks/
│   │   │   ├── useLogin.js
│   │   │   └── useRegister.js
│   │   └── index.js              # Feature 导出
│   ├── friend/
│   │   └── api.js                # 好友 API
│   ├── health/
│   │   ├── api/index.js          # 健康打卡 API
│   │   └── components/
│   │       └── MorningCheckIn.jsx     # 每日晨间打卡弹窗
│   ├── matching/
│   │   ├── api/index.js          # 匹配推荐 API
│   │   └── components/
│   │       └── AmbientBuddyRing.jsx   # 同频学伴环形展示
│   ├── ranking/
│   │   └── api.js                # 排行榜 API
│   ├── room/
│   │   └── api.js                # 自习室 API
│   ├── study/
│   │   └── api.js                # 学习会话 API
│   ├── tag/
│   │   └── api.js                # 标签 API
│   └── user/
│       └── api.js                # 用户 API
│
├── store/                        # Zustand 全局状态
│   ├── index.js                  # Store 统一导出
│   ├── roomStore.js              # 自习室状态（成员、消息、连接）
│   └── studyStore.js             # 学习会话状态（计时器、活跃会话）
│
├── hooks/                        # 自定义 Hooks
│   └── useRoomJoin.js            # 自习室加入逻辑（密码验证流程）
│
├── lib/                          # 工具库
│   ├── request.js                # HTTP 请求封装（Token 注入、自动刷新）
│   ├── socket.js                 # Socket.IO 客户端管理
│   └── utils.js                  # 通用工具函数（cn 类名合并等）
│
└── utils/
    └── token.js                  # Token 存取工具（localStorage）
```

---

## 3. 路由配置与页面结构

```
路由路径              组件                  布局            鉴权
────────────────────────────────────────────────────────────────────
/login               Login.jsx            AuthLayout      公开
/register            Register.jsx         AuthLayout      公开
/                    Home.jsx             AppLayout       需登录
/rooms               RoomLobby.jsx        AppLayout       需登录
/room/:id            RoomDetail.jsx       AppLayout       需登录
/rankings            Leaderboard.jsx      AppLayout       需登录
/profile             Profile.jsx          AppLayout       需登录
/about               简易占位页            AppLayout       需登录
*                    404 页面              无               公开
```

### 路由鉴权流程
1. 根路由 `/` 被 `<Auth useOutlet />` 组件包裹
2. Auth 组件检查 localStorage 中的 Token
3. 无 Token → 重定向到 `/login`
4. 有 Token → 渲染 `<Outlet />`（即 AppLayout 及其子路由）

---

## 4. 页面功能详解

### 4.1 登录页 (`/login`)
**文件**：`src/pages/login/Login.jsx`

**功能**：
- 邮箱 + 密码表单
- 调用 `POST /auth/login` 获取 Token
- 登录成功后存储 Token 并跳转首页
- 链接到注册页

**关联文件**：
- `feature/auth/hooks/useLogin.js` — 登录逻辑 Hook
- `feature/auth/api/index.js` — API 调用
- `layout/auth/AuthLayout.jsx` — 共享的认证页布局
- `pages/login/components/` — 装饰组件（Testimonial, TomatoCrossSection, WelcomeTitle）

---

### 4.2 注册页 (`/register`)
**文件**：`src/pages/register/Register.jsx`

**功能**：
- 昵称 + 邮箱 + 密码表单
- 调用 `POST /auth/register`
- 注册成功后自动登录并跳转首页

**关联文件**：
- `feature/auth/hooks/useRegister.js` — 注册逻辑 Hook

---

### 4.3 首页仪表盘 (`/`)
**文件**：`src/pages/home/Home.jsx`

**功能**：
- **英雄区域**：显示用户等级、XP 进度条、连续学习天数
- **迷你统计卡片**：今日学习时长、全站排名
- **年度活动热力图**（ActivityHeatmap 组件）
- **24h 高效时段矩阵**（TimeMatrix 组件）
- **推荐自习室**：展示算法推荐的 Top 4 房间（含匹配度得分）
- **全站排行榜**：Top 5 + 查看全部入口
- **好友排行榜**：Top 5 好友学习排名
- **创建自习室**入口卡片

**关联 API**：
- `GET /users/me` — 用户信息
- `GET /users/:id/public` — 公开资料（等级）
- `GET /study/stats/summary` — 今日统计
- `GET /rooms/recommended` — 推荐房间
- `GET /rankings?scope=week` — 全站排行
- `GET /friends/rankings?scope=week` — 好友排行
- `GET /analytics/activity-heatmap` — 热力图数据
- `GET /analytics/time-matrix` — 时段矩阵数据

---

### 4.4 自习室大厅 (`/rooms`)
**文件**：`src/pages/room/RoomLobby.jsx`

**功能**：
- 自习室卡片网格（显示名称、标签、在线人数、加锁状态）
- 关键词搜索
- 创建自习室弹窗（名称、描述、标签选择、人数上限、私密开关、密码设定）
- 点击房间卡片 → 加入流程（公开房间直接加入，私密房间弹出密码输入框）

**关联 API**：
- `GET /rooms` — 房间列表
- `POST /rooms` — 创建房间
- `GET /users/me/tags` — 获取我的标签（用于创建房间时选择）
- `POST /rooms/validate-password` — 密码验证

**关联组件**：
- `hooks/useRoomJoin.js` — 加入房间逻辑封装
- `components/room/RoomPasswordModal.jsx` — 密码输入弹窗

---

### 4.5 自习室详情 (`/room/:id`)
**文件**：`src/pages/room/RoomDetail.jsx`

**功能**：
- **成员网格**：头像 + 学习状态可视化（学习中闪烁蓝色边框、休息中绿色、空闲灰色）
- **实时聊天**侧边栏：消息流 + 发送框
- **房主控制**：设置按钮（修改房间信息）、删除按钮
- 离开房间按钮
- 点击成员头像 → 弹出用户资料弹窗

**实时通信（Socket.IO）**：
- 连接时自动 `join_room`
- 监听 `user_joined`、`user_left`、`new_message`、`status_updated`
- 发送消息通过 `send_message` 事件

**关联文件**：
- `store/roomStore.js` — Zustand 状态（members, messages, activeRoomId）
- `components/room/RoomConnectionManager.jsx` — 全局 Socket 连接管理
- `components/room/RoomSettingsModal.jsx` — 房间设置弹窗
- `components/user/UserProfileModal.jsx` — 用户资料弹窗
- `lib/socket.js` — Socket.IO 客户端实例管理

---

### 4.6 排行榜 (`/rankings`)
**文件**：`src/pages/ranking/Leaderboard.jsx`

**功能**：
- **领奖台**：前三名大号展示（金银铜配色 + 头像 + 动画效果）
- **排名列表**：第4名起的详细列表
- **切换维度**：
  - 时间范围：本周 / 全部时间
  - 类型：全站 / 好友
- **标签筛选**：仅全站模式可用，按技能标签过滤排名
- 高亮当前用户（"You" 标签）

**关联 API**：
- `GET /rankings` — 全站排行
- `GET /friends/rankings` — 好友排行

---

### 4.7 个人中心 (`/profile`)
**文件**：`src/pages/user/Profile.jsx`

**功能分为四个 Tab**：

#### Overview（总览）
- 用户头像、昵称、等级徽章、Top 3 技能标签
- 统计卡片：总 XP、连续天数、距下一级 XP
- 学习趋势图表（ECharts 柱状图，支持周/月切换）

#### History（历史记录）
- 分页的学习会话列表
- 每条显示：类型（学习/休息）、开始时间、时长

#### Skills（技能标签）
- 技能卡片网格：标签名、等级、进度条
- 添加新技能标签
- 删除已有标签

#### Settings（设置）
- 修改资料表单（昵称、头像选择器、个人简介）
- 预设头像选择（DiceBear API）+ 自定义 URL 输入
- 修改密码表单

**关联 API**：
- `GET /users/me` + `GET /users/:id/public` — 基本信息和等级
- `GET /study/stats/summary` — 统计摘要
- `GET /study/sessions` — 历史会话
- `GET /users/me/tags` — 技能标签
- `POST /users/me/tags` — 添加标签
- `DELETE /users/me/tags/:id` — 删除标签
- `PATCH /users/me` — 更新资料
- `PATCH /users/me/password` — 修改密码

---

## 5. 全局组件

### 5.1 AppLayout（主布局）
**文件**：`src/layout/AppLayout.jsx`

顶部导航栏（Dashboard / Rooms / Rankings / Profile）+ 好友抽屉按钮 + 以下全局组件：

| 组件 | 文件 | 功能 |
|------|------|------|
| PomodoroDock | `components/PomodoroDock.jsx` | 浮动番茄钟控制台，始终可见。支持开始/暂停/结束学习会话，标签选择，倒计时显示 |
| FriendDrawer | `components/friend/FriendDrawer.jsx` | 侧边栏抽屉，包含好友列表、请求管理、用户搜索 |
| RoomConnectionManager | `components/room/RoomConnectionManager.jsx` | Socket.IO 连接生命周期管理，自动连接/断开/重连 |
| MorningCheckIn | `feature/health/components/MorningCheckIn.jsx` | 每日首次登录弹出的睡眠打卡弹窗 |
| AmbientBuddyRing | `feature/matching/components/AmbientBuddyRing.jsx` | 同频学伴环形头像展示（浮动小组件） |

### 5.2 Auth 鉴权守卫
**文件**：`src/components/auth/index.jsx`

检查 Token 有效性，无效则重定向到登录页。支持 `useOutlet` 模式渲染子路由。

---

## 6. 状态管理

### studyStore（学习会话状态）
**文件**：`src/store/studyStore.js`

| 状态 | 说明 |
|------|------|
| activeSession | 当前活跃的学习/休息会话 |
| elapsedSeconds | 计时器已经过秒数 |
| timerRunning | 计时器是否在运行 |

主要 Actions：startSession、endSession、tick（每秒递增）、heartbeat（每30秒上报）

### roomStore（自习室状态）
**文件**：`src/store/roomStore.js`

| 状态 | 说明 |
|------|------|
| activeRoomId | 当前所在的房间 ID |
| members | 房间成员列表 |
| messages | 聊天消息数组 |

主要 Actions：setActiveRoomId、addMember、removeMember、addMessage、leaveRoom
