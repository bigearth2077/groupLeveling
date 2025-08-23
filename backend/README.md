# StudyRoom Backend (NestJS + Prisma + Redis + Postgres)

本项目是一个 **自习室管理 & 学习监督系统** 的后端，基于 **NestJS + Prisma** 开发，使用 **Postgres** 作为数据库，**Redis** 作为缓存/排行榜。

支持 **Docker 一键启动**，方便团队成员在本地快速运行。

---

## 🚀 快速开始

### 1. 安装依赖
- 需要本地安装 [Docker](https://docs.docker.com/get-docker/) 和 [Docker Compose](https://docs.docker.com/compose/)。

确认是否安装：
```bash
docker -v
docker compose version
```

### 2. 启动开发环境（热重载）
```bash
docker compose -f docker-compose.dev.yml up -d --build
```

- 服务将运行在 `http://localhost:3000`
- 默认数据库在 `localhost:5432`
- 默认 Redis 在 `localhost:6379`

查看日志：
```bash
docker compose -f docker-compose.dev.yml logs -f api
```

停止服务：
```bash
docker compose -f docker-compose.dev.yml down
```

### 3. 启动生产环境
```bash
docker compose up -d --build
```

停止：
```bash
docker compose down
```

---

## ⚙️ 环境变量

项目使用 `.docker.env` 来配置容器环境：

```env
NODE_ENV=production
PORT=3000

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/studyroom

REDIS_URL=redis://redis:6379

JWT_ACCESS_SECRET=super-access-secret
JWT_REFRESH_SECRET=super-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
```

你可以在 `.docker.env` 修改配置，例如数据库密码。

---

## 📦 数据迁移

容器启动时会自动执行：
```bash
npx prisma migrate deploy
```

如果你修改了 `prisma/schema.prisma`，需要在本地执行：
```bash
npx prisma migrate dev --name <migration-name>
```

然后重新构建容器：
```bash
docker compose -f docker-compose.dev.yml up -d --build
```

---

## 📖 常用命令

### 查看容器状态
```bash
docker ps
```

### 进入数据库容器
```bash
docker exec -it study_pg psql -U postgres -d studyroom
```

### 进入 Redis 容器
```bash
docker exec -it study_redis redis-cli
```

### 停止并清理所有数据（慎用）
```bash
docker compose down -v
```

---

## 🛠️ 调试技巧

- **修改代码**：在开发模式下，NestJS 会热重载。
- **查看日志**：`docker compose logs -f api`
- **数据库可视化**：推荐安装 [TablePlus](https://tableplus.com/) / [pgAdmin](https://www.pgadmin.org/) 查看数据。
- **Redis 可视化**：推荐 [RedisInsight](https://redis.com/redis-enterprise/redis-insight/)。

---

## 👥 团队成员使用说明

1. 克隆仓库：
   ```bash
   git clone <repo-url>
   cd <repo>
   ```

2. 启动服务：
   ```bash
   docker compose -f docker-compose.dev.yml up -d --build
   ```

3. 打开 `http://localhost:3000`，使用 Postman/Swagger 调试 API。

4. 如果要运行生产环境：
   ```bash
   docker compose up -d --build
   ```

就这么简单 🚀
