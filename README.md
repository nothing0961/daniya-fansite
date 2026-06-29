# 达妮娅的瞌睡小屋

> 《鸣潮》角色「达妮娅」同人二创作品 curation 站点
>
> 微博风格卡片信息流，精选搬运优质二创，标注原作者与出处

---

## 技术栈

| 层级 | 选型 |
|---|---|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 + 鸣潮暗色主题 |
| 内容 | MDX 本地文件（`content/posts/`） |
| 数据库 | Prisma + SQLite（`prisma/dev.db`） |
| 认证 | Auth.js v5（GitHub OAuth） |
| 评论 | Giscus（GitHub Discussions） |
| 部署 | Vercel |

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
npx prisma db push

# 3. 配置环境变量（复制 .env.example 为 .env 并填写）
cp .env.example .env

# 4. 启动开发服务器
npm run dev
# → http://localhost:3000

# 5. 生产构建
npm run build
npm start
```

---

## 环境变量配置

编辑 `.env` 文件：

```env
# Auth.js 密钥（生成命令: openssl rand -base64 32）
AUTH_SECRET="your-random-secret"

# GitHub OAuth（https://github.com/settings/developers 创建 OAuth App）
# 回调 URL: http://localhost:3000/api/auth/callback/github
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# SQLite 数据库
DATABASE_URL="file:./prisma/dev.db"

# Giscus 评论（https://giscus.app 配置）
NEXT_PUBLIC_GISCUS_REPO=your-github-username/your-repo
NEXT_PUBLIC_GISCUS_REPO_ID=your-repo-id
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=your-category-id
```

---

## 如何添加新作品

在 `content/posts/` 下创建 MDX 文件。支持两种方式：

### 方式一：目录形式（推荐，可附带图片）

```
content/posts/2026-06-30-my-new-post/
├── index.mdx       # 必须
└── artwork-01.jpg  # 配图（可选）
```

### 方式二：单文件形式

```
content/posts/2026-06-30-my-new-post.mdx
```

### Frontmatter 模板

```yaml
---
title: "作品标题"
description: "一句话描述，用于卡片预览和 SEO（1-300字）"
type: "illustration"       # illustration | comic | video | article | cosplay | other
originalCreator: "原作者昵称"
sourceUrl: "https://weibo.com/xxx/xxx"
sourcePlatform: "weibo"    # weibo | pixiv | twitter | lofter | bilibili | xiaohongshu
tags: [fanart, 达妮娅, 鸣潮]
publishedAt: "2026-06-30"
draft: false               # true = 草稿，生产环境不显示
---

## 作品赏析

在这里写 MDX 正文...
```

### 注意事项

- 文件名格式必须为 `YYYY-MM-DD-slug`，否则不会被识别
- `draft: true` 的作品在 `npm run build` 时不会出现，开发模式下可见
- `sourceUrl` 必须为完整 URL（含 https://）
- 标签最多 8 个

---

## 项目结构

```
daniya-fansite/
├── content/posts/          # === 二创内容库（手动编辑）===
├── prisma/
│   ├── schema.prisma       # 数据库模型定义
│   └── dev.db              # SQLite 数据库文件
├── public/images/          # 公共静态资源
├── src/
│   ├── app/                # Next.js App Router 页面
│   │   ├── page.tsx              # 首页信息流
│   │   ├── post/[slug]/page.tsx  # 作品详情页
│   │   ├── type/[type]/page.tsx  # 类型筛选页
│   │   ├── tag/[tag]/page.tsx    # 标签筛选页
│   │   ├── character/page.tsx    # 达妮娅角色页
│   │   ├── about/page.tsx        # 关于本站
│   │   ├── search/page.tsx       # 搜索页
│   │   ├── (auth)/login/         # 登录页
│   │   ├── (dashboard)/          # 个人中心
│   │   └── api/                  # API 路由
│   ├── components/
│   │   ├── feed/           # 信息流卡片组件
│   │   ├── post/           # 出处标注、类型徽章
│   │   ├── interaction/    # 点赞、收藏按钮
│   │   ├── auth/           # 登录/用户菜单
│   │   ├── comments/       # Giscus 评论
│   │   ├── layout/         # Header/Footer/导航
│   │   ├── shared/         # ThemeProvider/ThemeToggle
│   │   └── ui/             # 基础 UI 组件
│   ├── lib/
│   │   ├── posts.ts        # MDX 读取工具
│   │   ├── search.ts       # 搜索索引
│   │   ├── prisma.ts       # Prisma 客户端
│   │   └── validators/     # Zod 校验
│   ├── types/
│   │   └── post.ts         # 类型定义
│   └── hooks/              # 自定义 React Hooks
├── auth.ts (src/auth.ts)   # Auth.js 配置
├── proxy.ts                # 路由保护中间件
└── mdx-components.tsx      # MDX 全局组件映射
```

---

## 设计系统

### 色彩方案（鸣潮暗色主题）

| 变量 | 用途 | 色值 |
|---|---|---|
| `--background` | 页面背景 | 深蓝黑 #0D1117 |
| `--foreground` | 正文文字 | 浅灰白 |
| `--primary` | 主色调 | 鸣潮蓝 #4A7CDF |
| `--accent` | 强调色 | 紫色 |
| `--credit` | 出处标注 | 暖金色 |
| `--muted` | 卡片背景/占位图 | 暗灰 |
| `--card` | 卡片底色 | 深灰 |

### 图片尺寸规范

| 用途 | 尺寸 | 比例 |
|---|---|---|
| 信息流卡片缩略图 | 800×450 | 16:9 |
| 详情页横屏大图 | 1920×1080 | 16:9 |
| 详情页竖屏大图 | 1080×1350 | 4:5 |
| 详情页方图 | 1080×1080 | 1:1 |
| 角色页 Hero Banner | 1200×600 | 2:1 |
| 角色头像 | 200×200 | 1:1 |
| 站点 Logo | 200×60 | — |
| OG 社交分享图 | 1200×630 | 1.91:1 |

> 图片位置已使用灰色占位块 + 尺寸标注。搜索 `[图片占位]` 可快速定位所有需要替换的位置。

---

## 待办清单

### 必须完成
- [ ] **配置 GitHub OAuth**：在 GitHub Settings > Developer Settings 创建 OAuth App，将 Client ID/Secret 填入 `.env`
- [ ] **配置 Giscus**：在 https://giscus.app 配置评论系统，填写 `.env` 中的 `NEXT_PUBLIC_GISCUS_*` 变量
- [ ] **填充角色介绍**：编辑 `src/app/character/page.tsx`，填写达妮娅的背景故事

### 建议完成
- [ ] **确定站点名称**：搜索替换"达妮娅的瞌睡小屋"为你想要的站名
- [ ] **替换图片素材**：搜索 `[图片占位]`，按标注尺寸替换所有图片
- [ ] **站长信息**：在 `/about` 页添加联系方式和站长介绍
- [ ] **Hero Banner 文案**：编辑首页 `src/app/page.tsx` 的 h1 和 p 标签

### 可选增强
- [ ] 添加更多 OAuth 提供商（Google 等）在 `src/auth.ts` 的 `providers` 数组中
- [ ] 自定义 404 页面设计
- [ ] 添加图片轮播组件替换详情页的静态图片展示
- [ ] 接入实际 MDX 编译渲染（替换目前的 HTML 字符串转换）

---

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm start            # 启动生产服务器
npx prisma studio    # 打开数据库管理界面
npx prisma db push   # 同步数据库 schema
```

---

## 设计理念

- **微博风格信息流**：窄内容区（max-w-2xl），卡片式布局，图片在上文字在下
- **出处标注优先**：每篇作品必须标注原作者名、来源平台和原帖链接
- **暗色优先**：默认暗色主题呼应鸣潮 UI 风格，亮色模式作为备选
- **图片尺寸留空**：所有图片先使用灰色占位块 + 尺寸标注，后续替换实际图片
- **版权尊重**：About 页面明确声明所有权利归原作者，提供下架联系渠道
