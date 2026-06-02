# 阶段 1: 构建 React 产物
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖配置
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码并构建
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm run build

# 阶段 2: 部署 Nginx 并托管产物
FROM nginx:alpine

# 复制自定义 nginx 配置文件
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# 复制构建好的前端资源
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
