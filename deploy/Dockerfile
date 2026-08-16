# ============================================================
# daniya-fansite 生产镜像 — Node 22 + Next.js 16
# 用法见 deploy/README.md
#
# 关键设计：
#  - public/背景图片（968MB）不进镜像，由 compose 卷挂载（见 .dockerignore）
#  - content/ 由 compose 卷挂载，保证审核写的 MDX 持久化
# ============================================================

# ---------- 构建阶段 ----------
FROM node:22-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Prisma 引擎需要 OpenSSL 运行时库（node:22-slim 默认没有）
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 先装依赖，利用 Docker 层缓存（国内服务器必须走 npmmirror 镜像源）
COPY package.json package-lock.json ./
RUN npm ci --registry=https://registry.npmmirror.com

# 生成 Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# 构建生产产物
COPY . .
RUN npm run build

# ---------- 运行阶段 ----------
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Prisma 引擎需要 OpenSSL 运行时库（node:22-slim 默认没有）
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --registry=https://registry.npmmirror.com

# 运行期同样需要 Prisma Client（生成产物在 node_modules 内，不在 .next）
COPY prisma ./prisma
RUN npx prisma generate

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/content ./content
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/mdx-components.tsx ./mdx-components.tsx

EXPOSE 3000
CMD ["npm", "start"]
