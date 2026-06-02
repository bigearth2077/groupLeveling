#!/bin/bash
# 阿里云服务器环境初始化与清理脚本 (Ubuntu 22.04)
# 作用：清理旧的 Docker 容器和环境，为新项目腾出空间

echo "==========================================="
echo "开始初始化部署环境与清理旧项目..."
echo "==========================================="

echo "[1/4] 停止并清理正在运行的 Docker 容器..."
# 停止所有容器
docker stop $(docker ps -aq) 2>/dev/null
# 删除所有容器
docker rm $(docker ps -aq) 2>/dev/null

echo "[2/4] 清理未使用的网络和悬挂镜像..."
docker network prune -f
docker image prune -a -f
docker volume prune -f

echo "[3/4] 创建并初始化部署目录..."
DEPLOY_DIR="/opt/groupLeveling"
mkdir -p $DEPLOY_DIR
chmod -R 777 $DEPLOY_DIR

echo "[4/5] 检查 Docker 与 Docker Compose 是否就绪..."
if ! command -v docker &> /dev/null
then
    echo "未检测到 Docker，正在为您安装..."
    apt-get update
    apt-get install -y docker.io docker-compose git
    systemctl enable docker
    systemctl start docker
else
    echo "Docker 环境已存在，无需安装。"
fi

echo "[5/5] 克隆 GitHub 仓库代码..."
if [ -d "$DEPLOY_DIR/.git" ]; then
    echo "代码仓库已存在，无需重复克隆。"
else
    # 尝试克隆代码
    git clone https://github.com/bigearth2077/groupLeveling.git $DEPLOY_DIR
    # 赋予部署脚本执行权限
    chmod +x $DEPLOY_DIR/deploy/deploy.sh
fi

echo "==========================================="
echo "清理与初始化完成！"
echo "部署目录为: $DEPLOY_DIR"
echo ""
echo "首次拉起服务，请执行："
echo "cd $DEPLOY_DIR && docker-compose up -d --build"
echo ""
echo "以后您在本地 push 代码后，只需在服务器执行以下命令即可更新："
echo "$DEPLOY_DIR/deploy/deploy.sh"
echo "==========================================="
