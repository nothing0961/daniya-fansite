#!/usr/bin/env bash
# ============================================================
# daniya-fansite 一键启动/更新脚本（在服务器上执行）
# 用法：bash deploy/start.sh
#  - 首次运行：校验 .env.production → 构建镜像 → 启动容器
#  - 更新代码：重新传输代码后再次运行即可（增量重建）
# ============================================================
set -e
cd "$(dirname "$0")"

ENV_FILE="../.env.production"

if [ ! -f "$ENV_FILE" ]; then
  cp .env.production.example "$ENV_FILE"
  echo "⚠️  已生成 $ENV_FILE（模板）"
  echo "   请先填写真实值（AUTH_SECRET / DATABASE_URL / AUTH_URL / 密钥等），再重新运行：bash deploy/start.sh"
  exit 1
fi

if grep -qE "你的[A-Z_]+|^[A-Z_]+=你的" "$ENV_FILE"; then
  echo "⚠️  $ENV_FILE 中还有未填写的占位符（含「你的」字样）"
  echo "   请编辑该文件补齐后再运行：bash deploy/start.sh"
  exit 1
fi

# content 目录必须存在（挂载点）
mkdir -p ../content

echo "==> 构建并启动容器..."
docker compose up -d --build

echo "==> 容器状态："
docker compose ps

echo ""
echo "✅ 部署完成！"
echo "   浏览器访问：http://$(curl -s ifconfig.me 2>/dev/null || echo '你的服务器IP')"
echo "   查看日志：docker compose logs -f app"
