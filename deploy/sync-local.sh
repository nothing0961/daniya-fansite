#!/usr/bin/env bash
# ============================================================
# daniya-fansite 本机同步脚本（Windows Git Bash 运行）
# 作用：把本地代码增量传到服务器 /var/www/nextjs-app
#
# 用法：
#   bash deploy/sync-local.sh 服务器IP           # 增量（默认，秒级）
#   bash deploy/sync-local.sh 服务器IP --full    # 全量（仅首次部署用，含 968MB 背景图）
#
# 默认排除（增量模式）：
#   public/背景图片 — 已在服务器上，不重复传
#   content/        — 服务器审核产生的作品(MDX)以服务器为准，禁止被本地覆盖！
# ============================================================
set -e
IP="${1:?用法: bash deploy/sync-local.sh 服务器IP [--full]}"
cd "$(dirname "$0")/.."

EXCLUDES=(
  --exclude=node_modules
  --exclude=.next
  --exclude=.git
  --exclude=.env
  --exclude=.env.local
  --exclude=.env.production
  --exclude=".env*.local"
  --exclude=logs
  --exclude=.claude
  --exclude=.uploads
  --exclude=tsconfig.tsbuildinfo
)

if [ "$2" == "--full" ]; then
  echo "==> 全量模式（含 968MB 背景图，仅首次部署用）"
else
  EXCLUDES+=(--exclude=public/背景图片 --exclude=content)
  echo "==> 增量模式（跳过背景图与 content，保护服务器审核数据）"
fi

tar czf - "${EXCLUDES[@]}" . | ssh "root@$IP" "mkdir -p /var/www/nextjs-app && tar xzf - -C /var/www/nextjs-app"

echo ""
echo "✅ 代码已同步到 $IP:/var/www/nextjs-app"
echo "   下一步（SSH 登录服务器后执行）："
echo "   cd /var/www/nextjs-app/deploy && bash start.sh"
