#!/bin/bash
# 阿里云服务器一键部署更新脚本
# 使用方法: 在服务器的项目根目录(如 /opt/groupLeveling) 或任何地方执行此脚本

DEPLOY_DIR="/opt/groupLeveling"

echo "==========================================="
echo "开始拉取最新代码并重新部署..."
echo "==========================================="

# 进入部署目录
cd $DEPLOY_DIR || { echo "未找到部署目录 $DEPLOY_DIR，请先执行初始化脚本"; exit 1; }

echo "[1/3] 从 GitHub 拉取最新代码..."
# 放弃本地所有修改，强制与远程保持一致（防止服务器上的测试修改导致冲突）
git fetch --all
git reset --hard origin/main
git pull origin main

echo "[2/3] 重新构建并启动 Docker 容器..."
# 关闭旧服务
docker-compose down
# 以后台模式重建并启动服务
docker-compose up -d --build

echo "[3/3] 清理无用镜像节省磁盘空间..."
docker image prune -f

echo "==========================================="
echo "部署完成！您可以访问您的公网 IP 查看最新版本了。"
echo "==========================================="
