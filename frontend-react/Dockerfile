# frontend-react/Dockerfile (开发模式)
FROM node:20-alpine

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存
COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com/ && npm install

# 复制其余代码
COPY . .

EXPOSE 5173

# 启动 Vite 开发服务器，监听所有地址
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
