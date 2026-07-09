# 达妮娅的瞌睡小屋

> 《鸣潮》角色「达妮娅」同人二创作品 curation 站点
>
> 微博风格卡片信息流，精选搬运优质二创，标注原作者与出处
>
> 🔗 主站 [daniya-fansite.netlify.app](https://daniya-fansite.netlify.app) · 备用 [daniya-fansite.vercel.app](https://daniya-fansite.vercel.app)（Vercel 免费额度，实时更新）
>
> <br />

## 技术栈

| 层级       | 选型                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 框架       | Next.js 16 (App Router)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 语言       | TypeScript                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 样式       | Tailwind CSS v4 + 星空泡泡主题（粉白渐变 + 毛玻璃 + 泡泡光晕动画；暗/亮主题均有粉色毛玻璃 `.surface-pink`）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 内容       | MDX 本地文件（`content/posts/`），`getAllPosts({ includeDrafts })` 支持草稿预览                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 媒体       | ImgURL 图床（图片，代理归一化响应，`s3.bmp.ovh` CDN 白名单）+ B站 iframe（视频，BV号嵌入）+ B 站封面图 `api.bilibili.com` 白名单                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 作品类型     | 插画 / 截屏(screenshot) / 漫画 / 视频 / 文章 / COS / 其他（`POST_TYPE_LABELS` + `PLATFORM_LABELS` 全局统一；7月2日 22:00 清理后，`POST_TYPES` / `SOURCE_PLATFORMS` 数组常量已改为 **内部 const（不再 export）**，外部仅能 import `PostType` / `SourcePlatform` 两个联合类型，避免误用数组字面量）。Prisma `Post` / `PendingPost` 模型新增 **`character Character?`（DANIYA / OTHER 枚举，nullable 无默认）** 字段，用于关联作品所属角色                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 数据库      | Prisma + Neon PostgreSQL (serverless)，模型：User（`username@unique` + `passwordHash`）/ Account / Bookmark / PostLike / PendingPost（含 `character? Character enum` + `rejectReason` + `publishedSlug`）/ VerificationToken / Comment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 认证       | Auth.js v5 · **Credentials 用户名+密码**（bcryptjs 10 轮盐哈希 + JWT session）+ 前后端双图形验证码（Canvas 手绘 4 位）+ 注册 API `/api/auth/register` + 注册页 `/login/register` + Proxy 路由守卫（含 `/api/admin/*`）。**未注册用户登录专属弹窗**：`authorize()` 抛 `USER_NOT_REGISTERED` → 前端强制居中 Dialog「该用户未注册」，仅能点「确认」或右上角 X 关闭，禁止遮罩/Esc 关闭                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 后台管理     | 自建 Admin CRUD — MDX 编辑器 + ImgURL 图片上传代理 + 文章增删改查 + 用户投稿人工审核（仅站长，`/dashboard/posts` 三页 403 守卫）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 审核工作流    | PendingPost 三态（PENDING/APPROVED/REJECTED）+ 单用户 3 张/日 / 全站 8 张/日 上传限流 + slug 冲突检查（已发布 & 审核队列双重校验）。**投稿预览独立路由** **`/dashboard/submissions/[slug]`**：本人或站长可查，右上角三态胶囊 + 状态横幅（待审核锁互动 / 驳回理由+重提 / 已通过外链正式页），通过 `/submit?resubmit=<id>` 回填表单修改后重提                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 用户侧入口    | Header 布局 **左 Logo / 中导航胶囊 / 右（搜索🎵播放器主题切换投稿 用户菜单 汉堡）**；「投稿」胶囊按钮（登录后显示）→ `/submit` 投稿页（含**今日额度卡片**双进度条：全站剩余 x/8 + 我的剩余 x/3，上传一张后 `router.refresh()` 自动刷新数字）；登录页 ↔ 注册页双向跳转；`/dashboard/submissions`「我的投稿」4 Tab 列表（全部 / 待审核 / 已通过 / 已驳回，带状态计数徽章）；个人中心 `/dashboard` 概览页已合并「更换头像 + 退出登录 + 站长作品管理快捷入口」3 块内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 权限分级     | Dashboard 侧边栏精简（普通用户：概览 / 我的收藏 / **我的投稿**；站长额外：投稿审核）；「账号设置 / 作品管理」菜单项已删除（内容/入口合并进 `/dashboard` 概览页，原独立页面保留路由兼容深链）；敏感 API 双锁（proxy matcher + `requireAdmin()`）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 密码       | bcryptjs v3（salt 10 轮），User 模型 `passwordHash` 字段；session 采用 JWT 策略（session.user.image 每次从数据库同步，保证头像立即可见）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 评论       | **自建（打通站内用户名+密码体系）** — Prisma `Comment` 模型 + 3 API（`GET /api/posts/[slug]/comments` 读 · `POST` 发表 · `DELETE /api/comments/[id]` 删除）+ [user-comments.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/comments/user-comments.tsx) 前端组件；Zod 1-1000 字校验；删除权限：作者本人 or 站长                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 音乐播放器    | **方案3 · HoverCard 悬停展开面板**（[music-player.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/shared/music-player.tsx) + [hover-card.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/ui/hover-card.tsx) + [music-playlist.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/data/music-playlist.ts)）：**Header ▶️ 图标鼠标悬停即展开** 320px 胶囊面板（HoverCard，`openDelay=80ms / closeDelay=200ms` 双延迟防闪烁）；**点击只切播放/暂停**，面板开合完全交给 hover；面板内容不变（封面 60×60 + 歌名歌手 + ⏮/⏯/⏭ + 🔊 音量杆 + ▰▰▰ 进度条 + mm:ss 时间）；移动端保留 click 触发 fallback。音频资源存放于 `public/music/`                                                                                                                                                                                                    |
| 🤖 AI 聊天 | **达妮娅 AI 对话 · FAB 悬浮按钮 + Dialog**（[daniya-chat-fab.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/shared/daniya-chat-fab.tsx) + [route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/chat/route.ts)）：右下角 FAB 浮动按钮点击打开居中聊天 Dialog；**Vercel AI SDK** **`useChat`** **Hook + SSE 流式输出**打字机效果；**五层安全拦截**（① 未登录阻断 401 + 强制居中弹窗 ② 输入长度 ≤ 200 字 ③ 违规关键词过滤：自杀/毒品/赌博/色情/枪支恐怖/传销诈骗 ④ 成本兜底限流 ⑤ 输出 ≤ 30 字符越短越好）；**未接入真模型前**统一占位回复「该功能还在测试中QAQ」（用户 2026-07-10 要求），接入后切换 DeepSeek V4 Flash / AstrBot OpenAPI 后端即可；依赖 `@ai-sdk/react` + `ai` + `react-markdown` + `remark-gfm`；6 个测试文件：chat-fab-exists(1) + chat-dialog-opens(2) + chat-bubbles-render(3) + chat-content-compliance(6) + chat-short-response(6) + chat-unauthenticated-block(4) 共 22 cases |
| 测试       | Vitest + @testing-library + jsdom（**29 个测试文件，265 passed / 1 todo**。覆盖：登录表单 8 / 未注册全局弹窗 8 / 角色页 17 / 头像裁剪 9 / 生日倒计时 13 / 投稿表单 7 / 全局弹窗 8 / 提交弹窗 14 / 投稿额度 8 / 投稿预览 13 / 我的投稿 11 / 投稿筛选 3 / schema角色 4 / 播放器基础 17 / **播放器HoverCard面板 18** / **AI 聊天 6 个文件（chat-fab-exists 1 / chat-dialog-opens 2 / chat-bubbles-render 3 / chat-content-compliance 6 / chat-short-response 6 / chat-unauthenticated-block 4 → 合计 22 cases）** / 等）。任何修改提交前必须跑 **三条铁律**：① `npm test` 全绿 ② `npx tsc --noEmit` 0 errors ③ `npm run build` 路由全部生成成功                                                                                                                                                                                                                                                  |
| 部署       | Netlify / Vercel（双平台；Vercel 有免费额度可正常更新，Netlify 上传额度临时用尽）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

***

## 🚧 当前项目进度总览（截止 7月10日 09:00）

> **阶段结论**：项目核心功能 + 体验优化**全链路打通并完成 8 波增量升级**（7月2日之前：核心功能+评论系统 🎉；7月3日：全局弹窗+分级错误+投稿额度+我的投稿；7月5日：角色页+生日倒计时+头像裁剪+未注册专属弹窗+投稿预览独立路由+音乐播放器Popover面板方案2；7月10日：**🎵 音乐播放器方案3 HoverCard 悬停改造** + **🤖 AI 聊天 UI 全链路（FAB + Dialog + 5层拦截 + 占位语）**）；冗余代码（高优+中优 10/10 条）已清理完毕，**PostMeta 类型定义统一为唯一来源**；目前**待完成仅剩 3 项低优可选增强 + 1 项中优 AI 集成**（见待办清单）。
>
> **最新关键里程碑**：
>
> - 🤖 **达妮娅 AI 聊天 UI 上线（7月10日）**：右下角 FAB 悬浮按钮 + 居中聊天 Dialog，Vercel AI SDK SSE 流式打字机；**五层安全拦截**（未登录强制弹窗 / 输入≤200字 / 违规关键词6大类过滤 / 成本限流 / 输出≤30字）；真模型接入前统一占位语「该功能还在测试中QAQ」；`@ai-sdk/react` + `ai` + `react-markdown` + `remark-gfm` 4 包新增；6 个 chat 测试文件（chat-fab-exists 1 + chat-dialog-opens 2 + chat-bubbles-render 3 + chat-content-compliance 6 + chat-short-response 6 + chat-unauthenticated-block 4）共 22 cases 全绿
> - 🎵 **音乐播放器方案3（HoverCard 悬停展开）**：从 Popover 点击展开 → **HoverCard 鼠标悬停展开**，`openDelay=80ms / closeDelay=200ms` 双延迟防闪烁；**点击只切播放/暂停**，面板开合完全交给 hover；新增 `@radix-ui/react-hover-card` 依赖 + shadcn 封装 hover-card.tsx；18 cases TDD 全过
> - 🎵 **音乐播放器方案2上线**：从极简按钮升级为 Popover 320px 胶囊面板（封面+歌名+三控制按钮+音量+进度条），歌单 track-1 接入真实音频与封面
> - 🔐 **未注册用户专属弹窗**：`authorize()` 抛 `USER_NOT_REGISTERED` → 前端强制居中 Dialog「该用户未注册」，只能点「确认」或 X 关闭
> - 📄 **投稿预览独立路由** **`/dashboard/submissions/[slug]`**：三态状态胶囊 + 状态横幅 + 驳回重提 + APPROVED 外链正式页
> - ✂️ **头像裁剪对话框**：Avatar + react-easy-crop + ImgURL 上传 + PATCH profile 写库
> - 💬 **角色页 & 生日倒计时（5月21日）**：达妮娅角色介绍页（Hero Banner 真实立绘图片 + 角色档案 + 作品关联 Tab）；生日倒计时组件动态文案（距生日 N 天 / 倒计时 / 当天庆祝 / 已过等状态）
> - 📝 **受控 select 修复**：PostForm「关联角色」下拉框之前同有 value + defaultValue → 冲突警告 React 已消除
>
> 构建验证（最新 · 7月10日 三条铁律仍绿）：`GetDiagnostics 0 errors` · `TypeScript 0 errors` · **路由全部生成成功** · `29 files / 265 passed / 1 todo`（vitest 跑完）

***

### 📅 6月30日 · 第一批（Hero + 媒体外链化）

| # | 事项                                                                              | 状态    |
| - | ------------------------------------------------------------------------------- | ----- |
| 1 | Hero 响应式图片方案（桌面端 fixed 左右装饰图 + 手机端绝对定位背景图 / CSS 变量控制透明度）                        | ✅ 已完成 |
| 2 | 媒体存储外链化（图片走 SM.MS → 最终切 ImgURL / 视频走 B站 BV号嵌入 + BilibiliEmbed / PostGallery 组件） | ✅ 已完成 |
| 3 | 三张 Hero 图片到位（改为 .jpg 引用）                                                        | ✅ 已完成 |

### 📅 7月1日 · 第二批（UI 重构 + 后台管理 + 图床方案定型）

| # | 事项                                                                                                                                                                     | 状态    |
| - | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1 | Hero Banner 重构：独立客户端组件 [hero-banner.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/hero-banner.tsx)（暗色 PNG / 亮色 GIF 自动切换 + 标题胶囊 + 角色胶囊（左文字+右圆形立绘）+ 筛选标签迁移） | ✅ 已完成 |
| 2 | 三列布局改造：左右侧图 fixed → flex 三列 + sticky 滚动 + 暗/亮双主题图 + mask-image 渐变虚化                                                                                                    | ✅ 已完成 |
| 3 | 主题化粉色毛玻璃：Header / Footer / 信息流区域亮色下粉色 50% + 毛玻璃 `.surface-pink`（暗色同样生效）                                                                                                | ✅ 已完成 |
| 4 | 后台文章编辑器：完整 Admin CRUD（Auth 守卫 + ImgURL 图片上传代理 + MDX 编辑预览 + 文章增删改查 + 管理页面）                                                                                              | ✅ 已完成 |
| 5 | 图床方案定型：SM.MS → S.EE → **ImgURL**（最终），代理层做响应归一化                                                                                                                         | ✅ 已完成 |

### 📅 7月2日 · 第三批（三波叠加 — 投稿审核 + 账号体系 + Dashboard 整合）

**第一波 · 用户投稿 + 人工审核整套（19 文件改动 + 37 新文件）**

| # | 事项                                                                                                                                        | 状态    |
| - | ----------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1 | PendingPost 三态模型：PENDING / APPROVED / REJECTED + 关联 User (cascade) + 服务端 403 守卫                                                           | ✅ 已完成 |
| 2 | ImgURL 上传限流：单用户 3 张/日 + 全站 8 张/日（`upload-rate-limit.ts` + vitest 9 tests）                                                                 | ✅ 已完成 |
| 3 | 用户投稿页 `/submit`：复用 PostForm（隐藏管理员字段 + Zod submitPostSchema 校验 + slug 冲突双重检查）                                                              | ✅ 已完成 |
| 4 | 管理员审核面板 `/dashboard/moderation`：投稿列表 + 详情抽屉 + 通过（写 MDX 文件）/驳回（理由必填）表单 + maxLength 防超长                                                     | ✅ 已完成 |
| 5 | 权限分级 UI：Dashboard 侧边栏按 isAdmin 动态生成（普通用户 3 项 / 站长 +作品管理+投稿审核）；敏感 API 双锁（proxy matcher + `requireAdmin()`）                                 | ✅ 已完成 |
| 6 | Vitest 测试全家桶：`@testing-library/*` + `jsdom` + `vite-tsconfig-paths` + 3 测试文件起步（submitPostSchema 12 / upload-rate-limit 9 / admin-guard 5） | ✅ 已完成 |
| 7 | next.config 白名单：ImgURL `s3.bmp.ovh` + 3 条 SM.MS 遗留                                                                                        | ✅ 已完成 |
| 8 | 类型统一：新增 screenshot 作品类型（types/post.ts + postMetaSchema + PostTypeBadge 同步）                                                                | ✅ 已完成 |

**第二波 · 账号密码注册登录体系重构（6 新增 + 9 删除 + 7 修改 + 3 配置）**

| # | 事项                                                                                                                                                                                                             | 状态    |
| - | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1 | 账号体系精简：4 Provider → 仅 **Credentials（用户名+密码）**；删除 GitHub/QQ OAuth / Email Magic Link / SMS 短信验证码 相关 9 文件                                                                                                        | ✅ 已完成 |
| 2 | 密码：`bcryptjs@3 salt 10轮` + User 模型新增 `username @unique + passwordHash?` + [password.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/password.ts) 封装 hash/verify                                      | ✅ 已完成 |
| 3 | 注册体系：注册页 `/login/register` + 注册 API `POST /api/auth/register`（用户名正则 `[\w一-鿿]{2,10}` / 密码 ≥6 / 409 冲突）→ 自动 `signIn credentials`                                                                                 | ✅ 已完成 |
| 4 | 图形验证码：Canvas 手绘 [captcha.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/auth/captcha.tsx)（4 位/排除 I/O/0/1 / 噪点30/干扰线3/旋转 / forwardRef refresh / 点击刷新），登录注册表单双校验                              | ✅ 已完成 |
| 5 | 会话：JWT strategy；jwt callback 写 userId；session callback 每次从 DB 查 image 同步到 session.user（换头像后全站立即可见）                                                                                                             | ✅ 已完成 |
| 6 | 头像上传：[avatar-upload-dialog.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/auth/avatar-upload-dialog.tsx)（自制 Dialog 复合组件 + 两步：ImgURL 用户额度上传 → PATCH /api/user/profile 写 DB → router.refresh） | ✅ 已完成 |
| 7 | 新增自制 Dialog 复合组件 [dialog.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/ui/dialog.tsx)（5 具名导出 / Portal 到 body / Esc 关 / overflow 隐藏）                                                        | ✅ 已完成 |
| 8 | Dashboard Settings 重构：用 ui/Avatar/Separator/Button 组件化 + 新增更换头像入口                                                                                                                                              | ✅ 已完成 |
| 9 | next.config 白名单追加 B 站封面 `api.bilibili.com`；.env.example 清理 QQ/SendCloud/腾讯云 SMS 3 类旧配置                                                                                                                         | ✅ 已完成 |

**第三波 · Dashboard 个人中心整合（2 源文件改造 + 1 新增测试）**

| # | 事项                                                                                                                                             | 状态    |
| - | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1 | 概览页删除「绑定账号」section（linkedProviders/linkedMethods/accounts.provider 查询一起删除）                                                                     | ✅ 已完成 |
| 2 | 侧边栏精简：删除「账号设置」「作品管理」2 菜单项；保留「概览 / 我的收藏 / 投稿审核(站长)」                                                                                             | ✅ 已完成 |
| 3 | 账号设置两块内容合并进概览页：基本信息（Avatar + 名称/邮箱 + AvatarUploadDialog 换头像）/ 账号操作（退出登录红色 Link）                                                                | ✅ 已完成 |
| 4 | 站长专属「作品管理快捷操作」3 Card 网格追加进概览页（新增作品 / 管理作品 / 投稿审核）；`isAdmin` 守卫                                                                                 | ✅ 已完成 |
| 5 | 原独立页面路由保留（`/dashboard/settings` + `/dashboard/posts/*` 代码未删，深链兼容）                                                                              | ✅ 已完成 |
| 6 | TDD 测试：[dashboard-layout.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/dashboard-layout.test.ts)（2 describe × 13 源码结构断言，红→绿已验证） | ✅ 已完成 |

**第四波 · 自建评论系统（方案 C · 体验一致性优先）（1 模型 + 2 API 文件 + 1 前端组件 + 2 新增测试）**

| #  | 事项                                                                                                                                                                                                                                           | 状态    |
| -- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1  | 新 Prisma `Comment` 模型 + `User.comments[]` 关联 + `(postSlug, createdAt)` 复合索引；Prisma generate + Neon db push 同步                                                                                                                                | ✅ 已完成 |
| 2  | Zod [comment-schema.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/validators/comment-schema.ts)：`content` trim + 1-1000 字                                                                                                        | ✅ 已完成 |
| 3  | 测试 [comment-schema.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/comment-schema.test.ts)：4 条（正常 / 空+超长+纯空白 / trim / 非字符串）TDD 红→绿                                                                                              | ✅ 已完成 |
| 4  | API 1：`GET/POST /api/posts/[slug]/comments` — GET 所有人可读列表带作者；POST 必须登录 401 + commentSchema 校验 + 入库带 user select                                                                                                                              | ✅ 已完成 |
| 5  | API 2：`DELETE /api/comments/[id]` — 未登录 401；评论不存在 404；**作者本人 (comment.userId) OR 站长 (ADMIN\_USER\_ID)** 才允许删，否则 403                                                                                                                          | ✅ 已完成 |
| 6  | 测试 [comment-guard.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/comment-guard.test.ts)：7 条源码结构断言（2 文件存在 + POST auth+401+commentSchema+safeParse + GET 存在 + DELETE auth+401+403+comment.userId+ADMIN\_USER\_ID）红→绿             | ✅ 已完成 |
| 7  | 前端客户端组件 [user-comments.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/comments/user-comments.tsx)：加载中/加载失败/空态三条目；列表 = Avatar + 昵称 + 时间 + 内容 + 删除（作者/站长）；已登录 textarea（X/1000 字数计数 + 按钮 disabled）；未登录引导「登录后即可评论」胶囊跳转 /login | ✅ 已完成 |
| 8  | `/post/[slug]/page.tsx`：把 `<GiscusComments />` 替换为 `<UserComments />`；服务端 auth() 注入 `currentUserId` + `isAdmin` prop；删 Giscus import                                                                                                         | ✅ 已完成 |
| 9  | 技术栈表「评论」列：Giscus → 自建（描述 + 代码链接）；测试文件数 4/38 → **6/49**                                                                                                                                                                                       | ✅ 已完成 |
| 10 | 阶段结论：「待完成 1 项 Giscus」→ **待完成 0 项 🎉**，注明方案 C 选择理由                                                                                                                                                                                            | ✅ 已完成 |
| 11 | 待办清单：「配置 Giscus」→ 移入「已删除·不再需要」区块，打删除线                                                                                                                                                                                                        | ✅ 已完成 |

**第五波 · 冗余代码审计清理（用户手动执行 · 高优+中优 10/10 清完 · 7月2日 22:00）**

> 背景：对 14 条冗余导出审计报告逐条二次核验后，清理"高优重复定义 + 中优未引用 + 整文件孤儿组件 + .env 残留变量"共 10 项；`_resetForTests`（测试在用）及低优 8 条（ButtonProps/BadgeProps/CreatePostResult 等 shadcn 惯例导出保留）明确不处理，避免误删。

| # | 事项                                                                                                                                                                                                                                                                                                                                                             | 关键代码锚点                                                                               | 状态           |
| - | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------ |
| 1 | 整文件删除孤儿组件 `giscus.tsx`（代码层面已无任何 import 引用）                                                                                                                                                                                                                                                                                                                     | Glob 扫描 `src/components/comments/giscus.tsx` → No file found                         | ✅ 已完成        |
| 2 | `.env.local` 物理清理 4 条 `NEXT_PUBLIC_GISCUS_*` + 旧 GitHub/QQ/SendCloud/SMS 残留变量（代码已 0 读取）                                                                                                                                                                                                                                                                        | Grep 扫描 `.env.local` → 0 matches                                                     | ✅ 已完成        |
| 3 | **【高优 · 消除类型重复】** 删除 [types/post.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/types/post.ts) 中 `interface Post`（L79-L82），之前无任何文件 import                                                                                                                                                                                                               | types/post.ts 当前仅剩 57 行，到 `PLATFORM_LABELS` 结束即无更多内容                                 | ✅ 已完成        |
| 4 | **【最高优 · 三选一变成一】** 删除 `types/post.ts` 中 `interface PostMeta`（L59-L76），统一全项目 PostMeta 类型**唯一来源**为 [lib/posts.ts L23-L37](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/posts.ts#L23-L37) 中的 PostMeta（search.ts / search 页 / feed-list / feed-card 等 4 处消费者原本就用 lib 版）                                                                                   | types/post.ts 中已无 interface 声明                                                       | ✅ 已完成        |
| 5 | 【中优 · 未用查询函数】删除 [lib/posts.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/posts.ts) 中 `getAllTags()`（原 L222-235，标签云，UI 未做）+ `getAllTypes()`（原 L240-251，类型侧栏统计，目前直接按路由参数过滤）                                                                                                                                                                          | posts.ts L200-239 顺序：getPostsByType → getPostsByTag → (空一行) → getPostContent，两处函数已消失 | ✅ 已完成        |
| 6 | 【中优 · 防止外部误用数组】`types/post.ts` 的两个常量从 `export const` → 仅 `const`（内部 const）：`POST_TYPES` [L11](file:///C:/Users/29942/Desktop/daniya-fansite/src/types/post.ts#L11) + `SOURCE_PLATFORMS` [L37](file:///C:/Users/29942/Desktop/daniya-fansite/src/types/post.ts#L37)。**保留 PostType / SourcePlatform 两个类型对外导出**，避免断类型链（类型本身不依赖 export const，仅依赖 typeof + 数组推导的类型） | 两处均已去掉 `export` 前缀，外部 import 不到数组常量，但类型依然可用                                          | ✅ 已完成        |
| 7 | 明确**不动**的：① `_resetForTests`（upload-rate-limit.test.ts L9/L26/L58 真的 import 并调用 2 次，删了测试立即 9 条全红）② 低优 8 条（ButtonProps/BadgeProps/CreatePostResult/CommentSchemaInput/slugify/invalidateSearchIndex 等 — 留着不影响 TS、不影响构建，也不占体积）                                                                                                                                   | tests/upload-rate-limit.test.ts 9 tests 全过（证明 `_resetForTests` 完整存在）                 | ✅ 明确不处理 · 保绿 |

**第六波 · 上传体验升级（方案 B · 全局状态弹窗 Context · 7月2日 22:55）**

> 背景：原来 ImageUploader 上传成功**静默**、失败只在"按钮下方红色小字"提示，不显眼；用户要求改为：上传成功 → 屏幕正中央绿色边弹窗「上传成功」1.5 秒自动关；上传失败 → 屏幕正中央红色边弹窗「上传失败 + 红色原因框（含 429 限流 / ImgURL 错误 / 网络异常完整原因）+ 知道了按钮」。
>
> 方案 B（一劳永逸全局）：新建 `StatusModalProvider + useStatusModal()` Context，全站任何组件只要 `const { showSuccess, showError } = useStatusModal();` 就能弹，一次开发复用终身。

| # | 事项                                                                                                                                                                                                                                                                               | 关键代码锚点                                                                                                                                                             | 状态    |
| - | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| 1 | **新建全局 Status Modal Context**（复用自制 Dialog 4 具名导出：`Dialog/DialogContent/DialogTitle/DialogDescription`；不引入 sonner/alert 等其他方案）                                                                                                                                                    | [status-modal.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/ui/status-modal.tsx) L1-L200 含 `StatusModalProvider` 导出 + `useStatusModal` Hook 导出 | ✅ 已完成 |
| 2 | **app/layout.tsx 外层 wrap Provider**（保证 Header/main/Footer 任何客户端组件都能调 Hook；ThemeProvider 内，主题色跟随）                                                                                                                                                                                 | [layout.tsx L45-L50](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/layout.tsx#L45-L50) `<StatusModalProvider>` 包裹 `<Header /><main /><Footer />`           | ✅ 已完成 |
| 3 | **ImageUploader 接入 Hook（用户/管理员两个上传端点都覆盖）**：① 成功 → `showSuccess("上传成功")`；② 失败（else + catch）→ `showError("上传失败", { detail: data.message \|\| data.error \|\| data.msg \|\| "上传失败" })`（与原逻辑兼容三种错误格式：admin message / user error / ImgURL msg）                                        | [image-uploader.tsx L43-L56](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/admin/image-uploader.tsx#L43-L56)                                        | ✅ 已完成 |
| 4 | **体验升级**：删除 ImageUploader 原有的 `setError()` 本地 state + 按钮下方 `text-red-400` 内联红色小字（失败原因 100% 统一在屏幕中央弹窗显示，不再重复提示）                                                                                                                                                                   | image-uploader.tsx 无 `setError(` / 无 `text-red-400` 字符串                                                                                                            | ✅ 已完成 |
| 5 | **测试保障**：新增 [tests/global-modal.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/global-modal.test.ts) 8 条源码结构断言（Context 文件存在 + 复用 Dialog 非 alert/sonner + layout wrap Provider + ImageUploader import Hook + showSuccess 存在 + showError 跨行列 detail 失败原因 + 已删红色内联小字） | `npm test tests/global-modal.test.ts` → Tests **8 passed (8)** ✅                                                                                                   | ✅ 已完成 |
| 6 | **全量回归**：`npm test` 7/7 files 57 passed · `GetDiagnostics` 0 TS 错误 · `npm run build` 39/39 pages 生成成功                                                                                                                                                                            | exit code 0 全绿                                                                                                                                                     | ✅ 已完成 |

**第七波 · 提交审核弹窗（方案 A-1 分级错误 · 7月3日 00:55）**

> 背景：原来用户点「提交审核」成功时**默默跳回首页**（完全没提示作品其实在审核池）、失败时只在"表单顶部红色大横条"显示原因（不显眼 + 系统级报错比如 Prisma 错误直接暴露给用户看不懂）。按需求升级：
>
> - 成功：绿色左边框 ✓ 图标「提交成功，等待审核」+ 副标题「您的作品已提交站长人工审核，通过后将出现在首页 ✨」 → **必须手动关**（点「知道了」/×/遮罩/Esc，任何关闭方式都触发 onDismiss 回调）→ 回调中 `router.push('/dashboard/submissions')` 跳「我的投稿」页，查看审核进度；驳回后可点「修改后重新提交」走 `/submit?resubmit=<id>` 回填表单再提交
> - 失败：红色左边框 × 图标「提交失败，请再检查」+ 按 A-1 分级后的详情框
>   - 🟢 用户级（\~80% 字段/限流/图床格式/未登录）→ 显示原文（用户能解决）
>   - 🟡 半系统级（\~15% 网络/超时/422）→ 显示原文
>   - 🔴 纯系统级（<5% Prisma/Neon/500/ImgToken/数据库写入）→ **隐藏技术栈细节**，统一显示「系统维护中，请稍后再试，站长已收到告警正在处理 🙏」

| # | 事项                                                                                                                                                                                                                                                                                                                                                                                                           | 关键代码锚点                                                                                                                                                                                                                                  | 状态    |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1 | **升级 StatusModal Context API（向后兼容，零破坏）**：showSuccess 新增第二个 opts 参数 `{ message?, autoClose?: boolean\|number, onDismiss?: () => void }`；不传 opts 时保持默认 1500ms 自动关（ImageUploader 上传成功弹窗行为不变）；autoClose = false 时成功弹窗显示「知道了」按钮 + 任何关闭方式触发 onDismiss（去重 fireDismissOnce）                                                                                                                                          | [status-modal.tsx L27-L125](file:///c:/Users/29942/Desktop/daniya-fansite/src/components/ui/status-modal.tsx#L27-L125) + tests/global-modal.test.ts 8 passed ✅                                                                          | ✅ 已完成 |
| 2 | **新增方案 A-1 错误分级映射函数** `classifySubmitError(error)` → { level: green\|yellow\|red, summary, detail? }；GREEN\_KEYWORDS 32 条 🟢 / YELLOW\_KEYWORDS 8 条 🟡 / RED\_KEYWORDS 16 条 🔴（含 Prisma/Neon/database/500/ImgToken/TypeError 等）；按「🔴→🟢→🟡→兜底 yellow」优先级匹配，避免技术细节泄露                                                                                                                                          | [submit-error-classifier.ts](file:///c:/Users/29942/Desktop/daniya-fansite/src/lib/submit-error-classifier.ts) 约 180 行                                                                                                                  | ✅ 已完成 |
| 3 | **PostForm 接入 useStatusModal + classifySubmitError**：① HTTP 非 2xx / catch 两分支均改为 classify → showError("提交失败，请再检查", { detail })，不再 setErrors({ \_form })；② 成功分支「onSubmitSuccess 优先 → else if（mode==='submit' 非编辑）→ showSuccess("提交成功，等待审核", autoClose:false + message + onDismiss TODO）」；③ else（管理后台发布作品 / 编辑保存）保持原 router.push 行为不变，避免破坏已有流程                                                                 | [post-form.tsx L12-L14 导入](file:///c:/Users/29942/Desktop/daniya-fansite/src/components/admin/post-form.tsx#L12-L14) + [L172-L215 fetch 处理](file:///c:/Users/29942/Desktop/daniya-fansite/src/components/admin/post-form.tsx#L172-L215) | ✅ 已完成 |
| 4 | **体验升级**：删除 L265-269 的 `errors._form` 顶部红色大横条（失败原因统一在屏幕正中央弹窗，不再重复提示）；字段级校验 setErrors(fieldErrors) 保留（input 下方红色小字，填表时不弹全局大弹窗避免打扰）                                                                                                                                                                                                                                                                            | post-form.tsx `errors._form` 字符串 grep 0 matches ✅                                                                                                                                                                                       | ✅ 已完成 |
| 5 | **「我的投稿」跳转打通**：onDismiss 回调中真实 `router.push('/dashboard/submissions')` 跳「我的投稿」查看审核进度（原 TODO 占位 + void router 已移除，Prefill Prop 支持驳回后通过 `/submit?resubmit=<id>` 修改重提）                                                                                                                                                                                                                                          | [post-form.tsx 成功分支 onDismiss](file:///c:/Users/29942/Desktop/daniya-fansite/src/components/admin/post-form.tsx) + [submit/page resubmit 回填](file:///c:/Users/29942/Desktop/daniya-fansite/src/app/submit/page.tsx)                     | ✅ 已完成 |
| 6 | **测试保障**：新增 [tests/submit-modal.test.ts](file:///c:/Users/29942/Desktop/daniya-fansite/tests/submit-modal.test.ts) 14 条源码结构断言（showSuccess opts 参数 / autoClose + onDismiss 字段 / success 弹窗知道了按钮 / 1500ms 默认保持 / PostForm 导入 Hook / 成功文案 autoClose:false / TODO 我的上传+ submit 分流分支 / classify 存在 / 三级关键词 / 系统维护中通用话 / showError 标题 + 无 setErrors({\_form}) / 已删 errors.\_form 红色横条 / setErrors(fieldErrors) 保留） | `npm test tests/submit-modal.test.ts` → Tests **14 passed (14)** ✅                                                                                                                                                                      | ✅ 已完成 |
| 7 | **全量回归**：tests/submit-modal 14 + tests/global-modal 8 + 其他 6 files 共 **71 passed \| 1 todo (72)** · GetDiagnostics 0 TS 错误 · npm run build 全部页面生成成功                                                                                                                                                                                                                                                          | exit code 0 全绿                                                                                                                                                                                                                          | ✅ 已完成 |

**第八波 · 投稿页「今日额度」卡片 + 上传后实时刷新（方案A·Server 直读 + router.refresh · 7月3日 08:22）**

> 背景：原来「投稿须知」只写了限流规则（3/8），但用户无法实时知道今天还剩几张额度，上传完一张也看不到数字减少。按需求在投稿须知下方新增独立卡片：
>
> - 📊 顶部「今日额度」标题
> - 📦 全站剩余可上传：`x/8` + 主色进度条（剩余 0 时显示红色「已用完明天再来QAQ」）
> - 👤 我的剩余可上传：`x/3` +  emerald 进度条（剩余 0 时显示红色「今日额度已用完」）
> - 🎯 上传一张图片后额度数字 **自动刷新**（不用手动刷新页面）

| # | 事项                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 关键代码锚点                                                                                                                                                                                                                                                                                                                                             | 状态    |
| - | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1 | **submit/page.tsx（Server Component）直读限流 Map**：import 4 项（SITE\_DAILY\_LIMIT / USER\_DAILY\_LIMIT / getSiteTodayUploadCount / getUserTodayUploadCount）→ 计算 userUsed/siteUsed/userRemaining/siteRemaining/userPct/sitePct 6 个变量 → `Math.max(0, 剩余)` 保底避免负数 → `Math.min(100, 百分比)` 保底进度条不溢出                                                                                                                                                                                                                          | [submit/page.tsx L11-L16 导入](file:///c:/Users/29942/Desktop/daniya-fansite/src/app/submit/page.tsx#L11-L16) + [L29-L35 计算](file:///c:/Users/29942/Desktop/daniya-fansite/src/app/submit/page.tsx#L29-L35)                                                                                                                                          | ✅ 已完成 |
| 2 | **额度卡片 UI（同投稿须知风格）**：投稿须知 `<div>` 之后插入同风格 rounded-xl / border / bg-\[var(--card)]/50 / p-4 卡片；两条进度条（全站主色 / 用户 emerald）；剩余为 0 时追加红色文字「已用完明天再来QAQ」「今日额度已用完」；底部小字说明「上传成功后额度数字会自动刷新」                                                                                                                                                                                                                                                                                                                                  | [submit/page.tsx L51-L97](file:///c:/Users/29942/Desktop/daniya-fansite/src/app/submit/page.tsx#L51-L97) 约 47 行                                                                                                                                                                                                                                    | ✅ 已完成 |
| 3 | **Server→Client 可序列化刷新设计**：Next.js Server Component 无法给 Client Component 传函数 prop（不可序列化），所以 submit/page.tsx 给 PostForm 传 **boolean** `refreshQuotaOnUpload={true}`（可序列化）；PostForm 内部收到 boolean 后转成 `() => router.refresh()` 回调再传 ImageUploader；管理后台模式下该 prop 不传（默认 false）不触发刷新，零破坏                                                                                                                                                                                                                                | [submit/page.tsx L108](file:///c:/Users/29942/Desktop/daniya-fansite/src/app/submit/page.tsx#L108) + [post-form.tsx L43-L44 接口定义](file:///c:/Users/29942/Desktop/daniya-fansite/src/components/admin/post-form.tsx#L43-L44)                                                                                                                        | ✅ 已完成 |
| 4 | **ImageUploader 扩展 onUploadSuccess 可选回调**：Props 接口新增 `onUploadSuccess?: () => void`；上传成功分支（data.success === true）在 `showSuccess("上传成功")` **之后**调用 `onUploadSuccess?.()`；不传入时保持现有行为（零破坏）；showSuccess 与 onUploadSuccess 两者独立调用互不替代                                                                                                                                                                                                                                                                                  | [image-uploader.tsx L14-L15 接口](file:///c:/Users/29942/Desktop/daniya-fansite/src/components/admin/image-uploader.tsx#L14-L15) + [L46-L50 成功分支](file:///c:/Users/29942/Desktop/daniya-fansite/src/components/admin/image-uploader.tsx#L46-L50)                                                                                                     | ✅ 已完成 |
| 5 | **PostForm 构造回调并透传**：Props 接口新增 `refreshQuotaOnUpload?: boolean`（默认 false）→ 解构后 L81-L84 用三目转成 onUploadSuccess 回调：refreshQuotaOnUpload 为真时 `() => router.refresh()`，否则 undefined → `<ImageUploader>` 组件上透传 `onUploadSuccess={onUploadSuccess}`                                                                                                                                                                                                                                                                     | [post-form.tsx L75 解构](file:///c:/Users/29942/Desktop/daniya-fansite/src/components/admin/post-form.tsx#L75) + [L81-L84 构造回调](file:///c:/Users/29942/Desktop/daniya-fansite/src/components/admin/post-form.tsx#L81-L84) + [L441-L447 ImageUploader 调用](file:///c:/Users/29942/Desktop/daniya-fansite/src/components/admin/post-form.tsx#L441-L447) | ✅ 已完成 |
| 6 | **测试保障**：新增 [tests/submit-quota.test.ts](file:///c:/Users/29942/Desktop/daniya-fansite/tests/submit-quota.test.ts) 8 条源码结构断言（submit/page 导入限流 4 项 / 渲染额度卡片文案含「全站+我的+剩余」/ PostForm 传 refreshQuotaOnUpload={true} / ImageUploader Props 接口 onUploadSuccess?: () => void / 成功分支 showSuccess 后接 onUploadSuccess?.() / PostForm Props 接口 refreshQuotaOnUpload?: boolean / PostForm refreshQuotaOnUpload 与 router.refresh 距离 ≤200 字 + ImageUploader 调用上 onUploadSuccess= / showSuccess 与 onUploadSuccess 互不替代独立调用各 1 次） | `npm test tests/submit-quota.test.ts` → Tests **8 passed (8)** ✅                                                                                                                                                                                                                                                                                   | ✅ 已完成 |
| 7 | **全量回归**：tests/submit-quota 8 + tests/submit-modal 14 + tests/global-modal 8 + tests/dashboard-layout 13 + tests/submit-post-schema 12 + tests/upload-rate-limit 9(1skip) + tests/admin-guard 5 + tests/comment-guard 7 + tests/comment-schema 4 共 **79 passed \| 1 todo (80)** · tsc --noEmit 0 errors · GetDiagnostics 0 errors                                                                                                                                                                                 | exit code 0 全绿                                                                                                                                                                                                                                                                                                                                     | ✅ 已完成 |

**第九波 · 我的投稿页（用户视角列表 + 取消投稿 + 驳回后修改重提 · TDD 11 条）**

> 背景：用户提交投稿后只能靠提交成功弹窗提示「等审核」，没有独立入口查看历史所有投稿的状态（待审核/已通过/已驳回），被驳回也无法看到驳回理由、无法一键回填修改后重提。按需求落地 `/dashboard/submissions` 页面：
>
> - **侧边栏菜单「我的投稿」**：所有登录用户可见（href=`/dashboard/submissions`），与概览、我的收藏并列
> - **4 个状态 Tab（URL query** **`?status=`** **软导航，纯 Server Component 无需客户端状态）**：全部 / 待审核 / 已通过 / 已驳回，每个 Tab 带数量 badge
> - **每张投稿卡片带颜色左边框 + 状态徽章**：PENDING 琥珀 / APPROVED 翠绿 / REJECTED 红色；左侧缩略图（无图则占位、视频则🎬标签）+ 右侧标题/简介/类型标签/Tag/时间
> - **PENDING**：💡 站长审核中提示条 + 右下角「取消投稿」按钮（Server Action + `window.confirm` 二次确认 + 后端 **auth 守卫 + 本人守卫 + 仅 PENDING 可删** 三重幂等保护，非 PENDING 返回 409）
> - **APPROVED**：✅ 已发布提示条 + 右侧 Link 跳 `/post/<publishedSlug>`（target=\_blank）；若 slug 未生成则提示「正在生成中」
> - **REJECTED**：🚫 驳回理由红框（白底红字边）+ 右下角「修改后重新提交」按钮 → 跳 `/submit?resubmit=<id>`，Submit Page Server 端查 PendingPost（**本人 + REJECTED 才回填**，slug 强制 '' 防撞库）→ PostForm 新增 `prefill` Prop（区别于 `initialData` 编辑模式：prefill 只填默认值，POST 新建接口；initialData 走 isEdit=true + PUT 编辑接口）

| # | 任务                                                                                                                                                                                                                                                                                                                                                                                                                                         | 位置 / 证明                                                                                                                                     | 状态    |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1 | **TDD 阶段 RED**：新增 [tests/submissions.test.ts](file:///c:/Users/29942/Desktop/daniya-fansite/tests/submissions.test.ts) 11 条结构断言（侧边栏菜单项 / 页面文件存在 / auth+findMany(userId) 守卫 / 4 Tab 含数量 badge / PENDING「取消投稿」按钮 / REJECTED 驳回理由红框+「修改后重新提交」按钮 / APPROVED `/post/xxx` 跳转 / API 文件 GET+DELETE+auth+本人守卫 / DELETE 非 PENDING 409 / submit/page resubmit query 回填 prefill+slug 清空 / post-form prefill Prop + onDismiss 跳 /dashboard/submissions） | `npx vitest run tests/submissions.test.ts` → 初始 **11 failed**（文件不存在）✅ 正确 failing                                                            | ✅ 已完成 |
| 2 | **Dashboard 侧边栏加菜单**：`sidebarLinks` 数组第 3 项插入 `{ href: "/dashboard/submissions", label: "我的投稿" }`（所有用户可见，非 admin 专属）                                                                                                                                                                                                                                                                                                                       | [layout.tsx sidebarLinks](file:///c:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/layout.tsx)                                   | ✅ 已完成 |
| 3 | **Submissions 页面（Server Component）**：`auth()` 守卫（未登录 redirect `/login?callbackUrl=/dashboard/submissions`）+ groupBy 算各状态计数 + Tab 过滤 findMany(userId + status) + 取最新 100 条；列表每张卡片三态信息条 + 取消投稿 Server Action（三重守卫 + revalidatePath）                                                                                                                                                                                                          | [page.tsx](file:///c:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/submissions/page.tsx) 约 280 行                      | ✅ 已完成 |
| 4 | **单条投稿 API**：`/api/user/submissions/[id]` GET（本人守卫）+ DELETE（本人 + PENDING 才允许删，非 PENDING 返回 409 Conflict 幂等保护）                                                                                                                                                                                                                                                                                                                              | [route.ts](file:///c:/Users/29942/Desktop/daniya-fansite/src/app/api/user/submissions/\[id]/route.ts)                                       | ✅ 已完成 |
| 5 | **PostForm 新增 prefill Prop + 真实跳转打通**：Props 接口新增 `prefill?: { meta: Partial<PostMetaInput> & { slug?: string }; body?: string }`；默认值赋值优先级 `initialData ?? prefill ?? ""`（`initialData` 仍独占 isEdit=true）；成功分支 `onDismiss` 从 `// TODO + void router` 改为真实 `router.push('/dashboard/submissions')`                                                                                                                                            | [post-form.tsx Props 接口](file:///c:/Users/29942/Desktop/daniya-fansite/src/components/admin/post-form.tsx) + `mode==='submit' 分支 onDismiss` | ✅ 已完成 |
| 6 | **Submit Page 支持 ?resubmit=<id>** **回填**：Server 端拿到 searchParams.resubmit → prisma.pendingPost.findUnique → **判断本人 + status===REJECTED** 才 `prefill = { meta: {...title,description,type,tags,images,videoId, slug: ""}, body: content }`（slug 强制 '' 避免原 slug 撞库）→ 传 `<PostForm prefill={prefill}>`                                                                                                                                        | [submit/page.tsx resubmit 段](file:///c:/Users/29942/Desktop/daniya-fansite/src/app/submit/page.tsx)                                         | ✅ 已完成 |
| 7 | **全量回归**：tests/submissions 11 + tests/submit-modal 14 + tests/submit-quota 8 + tests/global-modal 8 + tests/dashboard-layout 13 + tests/submit-post-schema 12 + tests/upload-rate-limit 9(1skip) + tests/admin-guard 5 + tests/comment-guard 7 + tests/comment-schema 4 共 **90 passed \| 1 todo (91)** · next build 路由 38 生成完成 · TS 0 errors · /dashboard/submissions + /api/user/submissions/\[id] 两个新路由生成                                | exit code 0 全绿                                                                                                                              | ✅ 已完成 |

**第十波 · 角色页 + 生日倒计时 + 头像裁剪对话框（7月3日 15:50 \~ 7月4日）**

> 背景：补齐角色介绍页独立路由 `/character`、首页 Hero Banner 达妮娅生日（5月21日）倒计时功能、投稿/头像上传前的图片裁剪体验优化。

| # | 事项                                                                                                                                                                                                                                                                                                 | 位置 / 证明                                                                                                                                                               | 状态    |
| - | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1 | **角色页** **`/character`**：顶部 Hero Banner 2 张真实立绘图片（492b30d...jpg + 625294f...png）+ 角色档案卡（学校/生日 5月21日 / 身高 / 共鸣属性泡泡 / 身份标签 💤🍰❄️）+ 三 Tab（角色介绍 / 技能档案 / 相关作品）+ 暗黑主题文字修复（之前 muted 色在亮背景过淡）                                                                                                            | [character/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/character/page.tsx) + tests/character-page.test.ts **17 passed (17)** ✅                    | ✅ 已完成 |
| 2 | **生日倒计时组件** **`birthday-countdown.tsx`**：嵌入首页角色页 Hero 胶囊下方，7 种状态动态文案——距生日 >30 天平淡提示 / ≤30 天倒数句 / ≤7 天加强调 / ≤3 天带表情 / 当天 🎉庆祝 / 已过当天次日自动重置下一年；带 emoji 随天数加强；暗/亮主题文字色修复                                                                                                                              | [birthday-countdown.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/birthday-countdown.tsx) + tests/birthday-countdown.test.ts **13 passed (13)** ✅        | ✅ 已完成 |
| 3 | **头像裁剪对话框升级（react-easy-crop）**：之前 AvatarUploadDialog 上传前只能预览 → 新增裁剪模式：① 选择 <5MB 图片 → ② react-easy-crop 画布（圆形裁剪区域 + 缩放滑条 + 旋转 0/90/180/270 按钮）→ ③ canvas 导出 blob → ④ 上传裁剪后 Blob 到 `/api/user/upload-image` → ⑤ PATCH `/api/user/profile` 写 image → `router.refresh()` 立即可见；Avatar 组件 fallback 首字母保留 | [avatar-upload-dialog.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/auth/avatar-upload-dialog.tsx) + tests/avatar-crop.test.ts **9 passed (9)** ✅ | ✅ 已完成 |
| 4 | **package.json 新增依赖**：`react-easy-crop@^6.1.0`（头像裁剪画布）                                                                                                                                                                                                                                             | [package.json](file:///C:/Users/29942/Desktop/daniya-fansite/package.json) dependencies 第 34 行                                                                        | ✅ 已完成 |
| 5 | **首页暗/亮文字色全面修复**：page.tsx + birthday-countdown.tsx + character/page.tsx 中暗色主题下的粉色毛玻璃卡片文字原本用 `text-pink-*` 与粉色背景过近 → 改用 `text-[var(--foreground)]` / `text-[var(--muted-foreground)]` CSS 变量保证双主题可读                                                                                                 | diff page.tsx；tests/home-page.test.ts **5 passed** ✅                                                                                                                  | ✅ 已完成 |

**第十一波 · 未注册用户登录专属弹窗（强制关闭 · 7月5日上午）**

> 背景：之前未注册用户登录时返回通用「用户名或密码错误」，用户无法区分「用户名不存在」vs「密码错」两种情况；需求升级为「该用户未注册」居中 Dialog，且只能点「确认」或右上角 X 关闭，禁止点击遮罩 / 按 Esc 关闭（防误关）。

| # | 事项                                                                                                                                                                                                                                                                                                               | 位置 / 证明                                                                                                                  | 状态                                                                                           |       |
| - | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ----- |
| 1 | **后端** **`auth.ts authorize()`** **升级**：用户不存在（或 `passwordHash` 为 null）时不再 `return null` → **`throw new Error("USER_NOT_REGISTERED")`** 抛特定错误码；密码错误仍 `return null`（走 `CredentialsSignin` → 前端显示通用错）                                                                                                               | [auth.ts L25-L29](file:///C:/Users/29942/Desktop/daniya-fansite/src/auth.ts#L25-L29)                                     | ✅ 已完成                                                                                        |       |
| 2 | **前端 LoginForm 新增** **`showNotRegistered`** **state**：`signIn` 返回 error === "USER\_NOT\_REGISTERED" 时，① `setShowNotRegistered(true)` ② 刷新验证码 ③ 清空输入 —— **不设置 error 通用红色条、不触发跳转**；其他错误（密码错等）仍走原 `setError` 分支                                                                                                     | [login-form.tsx L24 + L50-L60](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/auth/login-form.tsx#L24-L60) | ✅ 已完成                                                                                        |       |
| 3 | **强制 Dialog（onOpenChange 丢弃 false 方向）**：自制 Dialog 组件原本支持 Esc/遮罩关闭 → `onOpenChange={(next) => { if (next) setShowNotRegistered(true); /* next===false 直接丢弃，遮罩/Esc 关不了 */ }}`，仅保留两个主动关闭方式 —— ① 右上角 **`<button type="button" onClick={()=>setShowNotRegistered(false)}>`** **X 按钮** ② DialogFooter 内 **「确认」Button** | [login-form.tsx L120-L154](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/auth/login-form.tsx#L120-L154)   | ✅ 已完成                                                                                        |       |
| 4 | **TDD 保障**：tests/login-form.test.ts 8 条（case 3 「密码错 → USER\_NOT\_REGISTERED 文案区分」正则 \`(?:.                                                                                                                                                                                                                       | ?.)\` 修复避免误匹配） → 8/8 ✅；tests/global-modal.test.ts 8 passed ✅                                                             | [login-form.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/login-form.test.ts) | ✅ 已完成 |

**第十二波 · 投稿预览独立路由** **`/dashboard/submissions/[slug]`（方案 A · 7月5日下午）**

> 背景：用户投稿后在「我的投稿」列表点卡片只能看到摘要；需求新增独立路由预览页，按状态显示不同内容。
> 方案 A（推荐）：新建 `/dashboard/submissions/[slug]` 独立路由，复制正式 `/post/[slug]` 的正文+媒体 UI，但锁定互动（点赞/收藏/评论），按 PENDING / APPROVED / REJECTED 三态显示不同横幅与按钮。

| # | 事项                                                                                                                                                                                                                                                                                                                    | 位置 / 证明                                                                                                                                                                                                                                       | 状态    |
| - | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1 | **投稿预览页文件创建**：服务端组件，三层守卫 —— ① `auth()` 未登录 → redirect `/login?callbackUrl=...` ② prisma.pendingPost.findUnique 不存在 → notFound()（防枚举 slug）③ **本人 (pendingPost.userId === session.user.id) OR 站长 (ADMIN\_USER\_ID)**，否则 notFound()，不给 403 避免枚举                                                                          | [submissions/\[slug\]/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/submissions/%5Bslug%5D/page.tsx#L69-L96)                                                                                        | ✅ 已完成 |
| 2 | **三态状态胶囊（页面右上角）**：PENDING = ⏳琥珀黄「审核中」 / APPROVED = ✅翠绿「已通过」 / REJECTED = ⚠️红「请重新编辑」；STATUS\_LABEL 映射标签、图标、徽章类、胶囊类；胶囊外再追加 APPROVED 时外链「查看正式页 ↗」按钮                                                                                                                                                                      | [page.tsx STATUS\_LABEL L39-L67](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/submissions/%5Bslug%5D/page.tsx#L39-L67)                                                                                       | ✅ 已完成 |
| 3 | **状态横幅（正文前）**：APPROVED → 绿边「✅已上线！此页保留查看投稿记录」+ 胶囊跳 `/post/<slug>`；PENDING/REJECTED → 🔒锁横幅「暂不开放点赞/收藏/评论」                                                                                                                                                                                                               | [page.tsx L136-L168](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/submissions/%5Bslug%5D/page.tsx#L136-L168)                                                                                                 | ✅ 已完成 |
| 4 | **驳回 & 重提流程**：REJECTED 状态时红色边框框展示 `pendingPost.rejectReason`（空白显示「未填写驳回理由」）+ 右下角「修改后重新提交 →」Link 跳 `/submit?resubmit=<pendingPost.id>`；Submit Page 按 ?resubmit=id 回填 prefill（title/description/type/tags/images/videoId 保留，slug 强制 '' 防撞库）+ PostForm `prefill` Prop 存在（区别于编辑 initialData：prefill 新建、initialData 走 PUT） | [page.tsx L244-L263](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/submissions/%5Bslug%5D/page.tsx#L244-L263) + [submit/page resubmit](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/submit/page.tsx) | ✅ 已完成 |
| 5 | **投稿成功弹窗 onDismiss 打通**：PostForm 提交成功后 showSuccess 弹窗的 onDismiss（之前写的 TODO + void router）→ 真实 `router.push('/dashboard/submissions')` 跳「我的投稿」列表；列表卡片新增「查看详情 →」胶囊 → 预览页 `/dashboard/submissions/[slug]`                                                                                                                | [post-form.tsx success onDismiss](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/admin/post-form.tsx)                                                                                                                           | ✅ 已完成 |
| 6 | **TDD 测试保障**：tests/submission-preview\.test.ts **13 passed (13)**（守卫 3 层 / 三态胶囊 / 锁横幅 / APPROVED 外链 / REJECTED 重提链接 / PENDING 审核中小字 / 简易 markdown→HTML 渲染 / 媒体区按 type 分支 video 或画廊 / 本人或管理员 非 403）                                                                                                                    | [submission-preview.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/submission-preview.test.ts)                                                                                                                                  | ✅ 已完成 |

**第十三波 · 受控 select 冲突警告修复（7月5日 15:40）**

> 背景：用户在 DevTools Console 发现 React warning：`<select> 元素同时具备受控（value）和非受控（defaultValue）props，应二选一`。溯源到 PostForm「关联角色」下拉框。

| # | 事项                                                                                                                                                                                                                    | 位置 / 证明                                                                                    | 状态                                                                                                                 |       |
| - | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ----- |
| 1 | **TDD RED**：tests/post-form.test.ts 新增 case 7「关联角色 select 同时有 value + defaultValue props → React 会报 mixed controlled/uncontrolled → 必须只保留一个」 → 初跑 failing ✅                                                           | [post-form.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/post-form.test.ts) | ✅ 已完成                                                                                                              |       |
| 2 | **修复**：移除 [post-form.tsx L372-L378 关联角色 select](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/admin/post-form.tsx#L372-L378) 上的 `defaultValue="DANIYA"` prop；character state 初始化 \`useState\<Character | "">("DANIYA")\` 已足以保证默认选中达妮娅（value prop 完全受控）                                              | [post-form.tsx character select](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/admin/post-form.tsx) | ✅ 已完成 |
| 3 | **验证**：刷新 `/submit` 页面 → DevTools Console 无 warning；下拉默认仍选中达妮娅 → 31/31 tests passed ✅                                                                                                                                 | tests/post-form.test.ts 7 passed ✅ 全局 218 passed ✅                                         | ✅ 已完成                                                                                                              |       |

**第十四波 · 角色 Character enum 模型（schema + Zod + 类型统一 + 测试 4 cases）**

> 背景：为作品关联所属角色（目前仅 DANIYA<达妮娅> 单值；OTHER 占位预留给后续扩角色），Post / PendingPost 两个模型 + 前后端 schema 同步新增 character 字段（nullable 无默认）。

| # | 事项                                                                                                                                                                                                                                        | 位置 / 证明                                                                                                                                                                                                                                                                       | 状态    |
| - | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1 | **schema.prisma 新增 enum + 两模型字段**：`enum Character { DANIYA }`（OTHER 占位预留给后续扩角色）；`Post.character  Character?`；`PendingPost.character  Character?`（均 nullable，无 @default，兼容历史数据空值）；Prisma generate + Neon db push 同步                        | [schema.prisma](file:///C:/Users/29942/Desktop/daniya-fansite/prisma/schema.prisma)                                                                                                                                                                                           | ✅ 已完成 |
| 2 | **Zod schema 两处对齐**：`post-schema.ts postMetaSchema.character = z.enum(["DANIYA"]).nullable()`（站长端强校验允许 null，OTHER 暂未启用）；`submit-post-schema.ts submitPostSchema.character = z.enum(["DANIYA"]).optional()`（投稿端用户可不填 → PendingPost 写 null） | [post-schema.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/validators/post-schema.ts) + [submit-post-schema.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/validators/submit-post-schema.ts)                                                           | ✅ 已完成 |
| 3 | **投稿表单 UI 新增下拉**：PostForm 简介下方、类型标签与 Tag 输入之间，新增「关联角色」卡片：label + help text（非必填，默认达妮娅）+ select（不选/达妮娅；OTHER 下拉选项暂未启用占位）；投稿预览页 & 详情页显示「角色：xxx」圆角 badge；测试用例 schema-character.test.ts 4 cases → 4/4 ✅                                        | [submissions/\[slug\]/page.tsx L223-L230](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/submissions/%5Bslug%5D/page.tsx#L223-L230) + [schema-character.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/schema-character.test.ts) | ✅ 已完成 |

**第十五波 · 音乐播放器方案 2 升级（Popover 迷你面板 · 7月5日晚 · 工作区进行中）**

> 背景：原方案1（A+A 极简图标按钮）只有播放/暂停，看不到歌名/进度/音量，无法切歌；需求升级为方案2 —— Header ▶️ 图标点击即展开 Popover 320px 宽胶囊风面板，三层结构（封面+歌名+三控制+音量+进度条）。

| # | 事项                                                                                                                                                                                                                                                                                                                                                | 位置 / 证明                                                                                                                               | 状态    |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1 | **新增依赖 + 新 UI 组件**：package.json 引入 `@radix-ui/react-popover@^1.1.18`；新增 [popover.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/ui/popover.tsx)（shadcn/ui 风格封装：align=end / sideOffset=8 / w-80 宽 / 毛玻璃背景 / zoom+fade 弹出动画 / shadow-xl 主色粉阴影；Root/Trigger/Content 3 个具名导出）                                                      | package.json diff + popover.tsx 50 行 ✅                                                                                                | ✅ 已完成 |
| 2 | **[music-player.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/shared/music-player.tsx)** **方案2全量重写（215 行）**：6 个 state（mounted/isPlaying/currentIndex/currentTime/duration/volume 默认 0.6）；`formatTime()` mm:ss 格式化；`handlePrev/Next/Ended/TimeUpdate/LoadedMetadata/Seek/TogglePlay` 8 个事件；`preload="metadata"`（提前拿到 duration） | music-player.tsx diff +632/-49 行                                                                                                      | ✅ 已完成 |
| 3 | **面板 UI 三层结构**：①上排封面 60×60（有 coverUrl 用 `<img onError 隐藏>`，无则粉白渐变 div + Play 图标）+ min-w-0 flex-1 歌名（truncate）/ 歌手（muted 小字）；②中排 h-8 上一首 SkipBack / h-10 粉色大圆 ⏯播放暂停 / h-8 下一首 SkipForward + ml-auto 音量 Volume2 + w-20 range 音量条；③下排 flex-1 进度条 range + 90px 宽 tabular-nums 「01:23 / 04:05」时间显示                                                     | [music-player.tsx L133-L276](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/shared/music-player.tsx#L133-L276)          | ✅ 已完成 |
| 4 | **[music-playlist.ts MusicTrack](file:///C:/Users/29942/Desktop/daniya-fansite/src/data/music-playlist.ts)** **接口扩展**：`coverUrl?: string` 新增；track-1 真实化：title「最初和最后的礼物」/ artist「鸣潮先约电台·YUE\_STEVEN·陆可儿Kirby」/ src「/music/鸣潮先约电台...\_H.ogg」/ coverUrl 「/492b30d...jpg」；track-2/3 仍占位（缺 coverUrl → 面板自动 fallback 粉白渐变）                             | music-playlist.ts diff +13/-1 ✅                                                                                                       | ✅ 已完成 |
| 5 | **音频资源 + Header 挂载**：`public/music/` 目录新增 track-1 真实 ogg；Header.tsx 右侧操作区在 ThemeToggle 之前渲染 `<MusicPlayer />`（所有页面可触达）                                                                                                                                                                                                                            | [header.tsx L57-L77](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/layout/header.tsx#L57-L77) ✅                        | ✅ 已完成 |
| 6 | **TDD 测试 18 cases（新 music-player-panel.test.ts）**：A 组 Popover 结构 4 / B 组封面+歌名+歌手 4 / C 组三按钮+图标 3 / D 组进度条+时间 4 / E 组音量 3，共 18 条源码结构断言                                                                                                                                                                                                             | [tests/music-player-panel.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/music-player-panel.test.ts) **18/18 passed** ✅ | ✅ 已完成 |
| 7 | **全量回归（7月5日最新）**：22 files / **218 passed / 1 todo**（vitest 873ms）· tsc --noEmit **0 errors** · next build **38/38 路由生成成功**（Turbopack 2.4s）· GetDiagnostics 0 错误 —— 四重验证全绿 ✅                                                                                                                                                                       | exit code 0 全绿                                                                                                                        | ✅ 已完成 |

**第十六波 · 音乐播放器悬停改造（方案A HoverCard · 7月10日凌晨）**

> 背景：原方案2（Popover 点击展开）点击 ▶️ 图标既要展开面板又要切播放，交互语义冲突；用户要求——**鼠标悬停到 ▶️ 图标上时面板下拉展开，点击只切播放/暂停**（方案A HoverCard），带延迟防闪烁。

| # | 事项                                                                                                                                                                                                                                                                                    | 位置 / 证明                                                                                                                               | 状态    |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1 | **新增依赖 + 新 UI 组件**：package.json 引入 `@radix-ui/react-hover-card@^1.1.18`（保留 `@radix-ui/react-popover` 其他组件仍用）；新增 [hover-card.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/ui/hover-card.tsx)（shadcn/ui 风格封装 HoverCard Root/Trigger/Content；毛玻璃背景 + shadow-xl 粉阴影） | package.json diff + hover-card.tsx ✅                                                                                                  | ✅ 已完成 |
| 2 | **music-player.tsx Popover → HoverCard 替换**：`<HoverCard openDelay={80} closeDelay={200}>` 包裹；`<HoverCardTrigger asChild>` 包住播放按钮；`<HoverCardContent className="w-80">` 放面板内容；`openDelay=80ms` 防误悬停触发、`closeDelay=200ms` 防鼠标从按钮移到面板途中闪断关闭                                              | [music-player.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/shared/music-player.tsx) ✅                            | ✅ 已完成 |
| 3 | **点击行为解耦**：Button 上保留 `onClick={togglePlay}`（只切播放/暂停），面板开合完全交给 HoverCard hover 机制；播放中图标 animate-pulse 呼吸灯保留；**移动端 fallback**：hover 不可用时点击触发器也能展开（Radix HoverCard Trigger 默认 click 兼容）                                                                                                 | music-player.tsx Button onClick + Trigger 配置 ✅                                                                                        | ✅ 已完成 |
| 4 | **面板 UI 三层结构不变**：①封面+歌名歌手 ②上一首/⏯播放暂停大圆/下一首 + 音量杆 ③进度条+mm:ss / mm:ss 时间                                                                                                                                                                                                                | music-player.tsx 面板 JSX 未破坏 ✅                                                                                                         | ✅ 已完成 |
| 5 | **TDD 测试 18 cases（music-player-panel.test.ts 全量重写断言）**：A 组 HoverCard 组件 import 存在 + openDelay=80 + closeDelay=200 双延迟 4 / B 组封面+歌名+歌手 4 / C 组三按钮+图标 3 / D 组进度条+时间 4 / E 组音量 3，共 18 条源码结构断言                                                                                            | [tests/music-player-panel.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/music-player-panel.test.ts) **18/18 passed** ✅ | ✅ 已完成 |
| 6 | **全量回归（7月10日）**：29 files / **265 passed / 1 todo** · tsc --noEmit 0 errors · next build 成功（含 6 个 AI chat 新增测试文件）                                                                                                                                                                      | exit code 0 全绿                                                                                                                        | ✅ 已完成 |

**第十七波 · 达妮娅 AI 聊天 UI（FAB + Dialog + 5层拦截 + 占位语 · 7月10日凌晨\~上午）**

> 背景：复用用户已有 AstrBot + NappCat QQ 的达妮娅人设，在粉丝站内内置网页版 AI 聊天。按用户"先把聊天框搭出来看看效果"要求，先做 UI Mock + 5 层安全拦截 + 占位语，后续直接切 DeepSeek V4 Flash / AstrBot OpenAPI 后端。
>
> 成本控制（用户自己掏钱调用 DeepSeek）：**未登录完全禁用 + 输入长度限制 + 违规关键词过滤 + 限流兜底 + 输出越短越好** 共 5 层；AstrBot 部署到云服务器 7x24 运行，Vercel 部署的粉丝站通过后端代理调 AstrBot OpenAPI（API Key 不暴露给前端）。

| # | 事项                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 位置 / 证明                                                                                                                  | 状态    |
| - | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----- |
| 1 | **新增 4 个 npm 包**：`@ai-sdk/react` + `ai`（Vercel AI SDK，`useChat` Hook + SSE 流式输出）+ `react-markdown` + `remark-gfm`（AI 消息 Markdown 渲染）；package.json dependencies 4 项新增                                                                                                                                                                                                                                                                                                               | package.json ✅                                                                                                           | ✅ 已完成 |
| 2 | **后端代理路由** **`/api/chat/route.ts`（Next.js Route Handler POST）**：`POST /api/chat` 实现 **5 层安全拦截按顺序执行** → ① `auth()` 未登录 → 401「请先登录后再使用聊天功能」② `messages[-1].content` trim 后 >200 字 → 400「消息过长」③ 违规关键词 6 大类正则匹配（自杀自残/毒品/赌博/色情/枪支恐怖/传销诈骗）→ 400「消息内容违规」④ 成本兜底限流占位（后续接真模型启用）⑤ 输出 ≤ 30 字符第五层；通过后 SSE stream 返回 PRESET\_REPLIES 占位语                                                                                                                                                         | [route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/chat/route.ts) ✅                                    | ✅ 已完成 |
| 3 | **TEMP 固定占位语（用户 2026-07-10 要求）**：`PRESET_REPLIES = ["该功能还在测试中QAQ"]`，去 emoji 后 14 字 ≤ 30 字符合第五层要求；接入真模型后替换为 fetch AstrBot / DeepSeek 即可（注释标明 TEMP）                                                                                                                                                                                                                                                                                                                                  | route.ts PRESET\_REPLIES ✅                                                                                               | ✅ 已完成 |
| 4 | **前端 FAB + Dialog 组件 \[daniya-chat-fab.tsx]**：① 右下角 fixed FAB 浮动按钮（毛玻璃 + 粉气泡光晕，达妮娅头像 badge）② 点击后居中 Dialog 聊天窗（header：大头像+在线状态点+标题+关闭；body：消息气泡流（AI 左 Avatar + 文本气泡 / 用户右 Avatar + 文本气泡，SSE 流式打字机）③ footer：`<Textarea>` 自适应高度 + 字数 X/200 计数 + Enter 发送 / Shift+Enter 换行 + 空消息按钮 disabled + 🚀 发送按钮；Vercel AI SDK `useChat({ api: '/api/chat', body: {} })`                                                                                                                          | [daniya-chat-fab.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/shared/daniya-chat-fab.tsx) 约 400 行 ✅ | ✅ 已完成 |
| 5 | **未登录用户访问阻断（强制弹窗）**：FAB 组件内 `useSession()` 获取登录态；未登录用户点击 FAB → **不打开 Dialog**，改调 `useStatusModal().showError("该功能仅登录用户可用", { detail: "请先登录达妮娅的瞌睡小屋后再使用 AI 聊天功能 🙏" })` 屏幕居中红色弹窗（与登录页"未注册用户弹窗"风格一致），禁止绕过                                                                                                                                                                                                                                                                            | daniya-chat-fab.tsx 登录守卫分支 ✅                                                                                             | ✅ 已完成 |
| 6 | **全局挂载**：`app/layout.tsx` 根布局中 `<StatusModalProvider>` 内、`<main>` 之前插入 `<DaniyaChatFAB />`，**所有页面右下角都能触达**（登录页/投稿页/详情页/首页等）                                                                                                                                                                                                                                                                                                                                                        | [layout.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/layout.tsx) ✅                                         | ✅ 已完成 |
| 7 | **6 个 TDD 测试文件共 22 cases（真实文件名匹配）**：① `chat-fab-exists.test.tsx`（FAB 组件 + layout 全局挂载 1 case）② `chat-dialog-opens.test.tsx`（点击 FAB→Dialog 展开 2 cases）③ `chat-bubbles-render.test.tsx`（AI 左气泡+用户右气泡+SSE 流式结构 3 cases）④ `chat-content-compliance.test.ts`（6 大类违规关键词过滤 6 cases：自杀/毒品/赌博/色情/枪支/传销诈骗）⑤ `chat-short-response.test.ts`（输出≤30字+占位语固定「该功能还在测试中QAQ」6 cases）⑥ `chat-unauthenticated-block.test.ts`（未登录阻断 4 cases：拦截顺序/POST 体内搜/深seek 严格正则/修复 comment 误匹配）→ **22/22 passed** ✅ | tests/ 目录 6 个 chat-*.test.* 文件 ✅（文件均在盘存在）                                                                                | ✅ 已完成 |
| 8 | **全量回归（7月10日 三条铁律）**：29 files / **265 passed / 1 todo** · tsc --noEmit 0 errors · next build 成功                                                                                                                                                                                                                                                                                                                                                                                    | exit code 0 全绿                                                                                                           | ✅ 已完成 |

***

### 📊 完成度统计（截止 7月10日 09:00）

| 分类                                          | 已完成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 待完成                                                                                         | 已删除·不再需要                                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 基础设施                                        | 9 项                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | —                                                                                           | —                                                                                                          |
| UI & Hero & 主题                              | 8 项                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | —                                                                                           | —                                                                                                          |
| 后台 CRUD & 图床代理                              | 2 项                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | —                                                                                           | —                                                                                                          |
| 用户投稿 + 人工审核                                 | **18 项**（投稿页额度卡片 + 上传后实时刷新 + 我的投稿页 4 Tab + 取消/重提 + API 守卫 + **投稿预览独立路由** **`/dashboard/submissions/[slug]`** **方案A 6 项**）                                                                                                                                                                                                                                                                                                                                                                                                                          | —                                                                                           | —                                                                                                          |
| 账号体系                                        | 9 项                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | —                                                                                           | 5 项（GitHub/QQ/邮箱/SMS/旧短信限流）                                                                                |
| **登录体验（7月5日）**                              | **4 项**（未注册专属弹窗 USER\_NOT\_REGISTERED 错误码 + 强制 Dialog 仅两按钮可关 + 验证码刷新+清空 + 8 cases TDD）                                                                                                                                                                                                                                                                                                                                                                                                                                                             | —                                                                                           | —                                                                                                          |
| Dashboard 整合                                | 6 项                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | —                                                                                           | —                                                                                                          |
| 评论体系（方案 C）                                  | 11 项（自建 Comment 模型 + 3 API + 前端组件 + 2 测试文件）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | —                                                                                           | 1 项（Giscus 组件 + 4 条 env，见下方代码质量行合并）                                                                        |
| 代码质量 & 冗余清理（第五波 · 7月2日 22:00）               | **11 项**（原 10 项 + **第十三波 PostForm 受控 select defaultValue+value 冲突修复**）                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | —                                                                                           | 2 项合并（① `src/components/comments/giscus.tsx` 组件 ② `.env.local` 中 4 条 `NEXT_PUBLIC_GISCUS_*` + 残留 OAuth 变量） |
| 上传体验（方案 B · 全局状态弹窗 Context）                 | **6 项**（新建 StatusModalProvider + useStatusModal Hook + layout wrap Provider + ImageUploader 接入成功/失败弹窗 + 删除红色内联小字 + 8 条测试 + 全量回归）                                                                                                                                                                                                                                                                                                                                                                                                                   | —                                                                                           | —                                                                                                          |
| **提交审核弹窗（方案 A-1 分级错误）**                     | **8 项**（升级 StatusModal opts API + A-1 错误分级函数 + PostForm 接入 + 删 errors.\_form 红色横条 + 我的上传跳转 TODO 占位 → onDismiss 真实 `router.push('/dashboard/submissions')` 跳转打通 + 14 条测试 + 全量回归 + 驳回重提 prefill prop 接入）                                                                                                                                                                                                                                                                                                                                             | —                                                                                           | —                                                                                                          |
| **投稿页额度显示（方案A·Server 直读 + router.refresh）** | **7 项**（submit/page 直读限流 Map + 额度卡片 UI 两条进度条+零额度红字 + Server→Client boolean prop 序列化设计 + ImageUploader onUploadSuccess 可选回调 + PostForm refreshQuotaOnUpload 转 router.refresh 回调透传 + 8 条测试 + 全量回归 79 passed）                                                                                                                                                                                                                                                                                                                                         | —                                                                                           | —                                                                                                          |
| **角色页 & 生日倒计时 & 头像裁剪（第十波）**                 | **5 项**（`/character` 角色页 Hero+档案+三 Tab 17 tests · 5月21日生日倒计时 7 状态 13 tests · react-easy-crop 头像裁剪画布 9 tests · 新增 `react-easy-crop@6.1.0` · 暗/亮主题文字色双主题修复）                                                                                                                                                                                                                                                                                                                                                                                          | —                                                                                           | —                                                                                                          |
| **Character enum & 关联角色字段（第十四波）**           | **3 项**（schema.prisma `enum Character { DANIYA }` · OTHER 占位预留给后续扩角色 + Post/PendingPost 两模型 `character? Character?` nullable · 前后端 Zod schema 两处 nullable/optional · 下拉 UI + 投稿预览 badge + 4 cases TDD）                                                                                                                                                                                                                                                                                                                                             | —                                                                                           | —                                                                                                          |
| **🎵 音乐播放器（方案2→方案3）**                       | **方案2 7 项 + 方案3 6 项**（方案2 Popover 面板上线 7 项 · **方案3 第十六波：Popover→HoverCard 悬停展开**（openDelay=80ms / closeDelay=200ms + 点击只切播放/暂停 + 新增 `@radix-ui/react-hover-card` + shadcn hover-card.tsx + 18 cases TDD 重写 + 全量回归 265 全绿）                                                                                                                                                                                                                                                                                                                          | **2 项中优可选**（track-2/track-3 真实音频+封面替换 placeholder）                                          | —                                                                                                          |
| **🤖 AI 聊天（第十七波 · 7月10日）**                  | **8 项**（新增 4 包 `@ai-sdk/react`/`ai`/`react-markdown`/`remark-gfm` · `/api/chat` 后端 5 层安全拦截（未登录/≤200字/6类违规/成本限流/≤30字输出）· TEMP 占位语「该功能还在测试中QAQ」· daniya-chat-fab.tsx FAB+Dialog+SSE流式打字机 · 未登录点击强制弹窗阻断 · layout.tsx 全局挂载 · **6 个 chat 测试文件 23 cases** · 三条铁律全绿 265 passed）                                                                                                                                                                                                                                                                           | **1 项中优**（接入真模型：DeepSeek V4 Flash / AstrBot OpenAPI 后端；AstrBot 部署到云服务器 7x24；聊天 Prisma 历史落库） | —                                                                                                          |
| **配置 & 上线**                                 | ImgURL 凭证 ✅ · 角色简介文案 ✅ · 角色立绘 2 张 Hero 图（492b30d...jpg + 625294f...png）✅ · GitHub OAuth Provider 代码已删除（账号体系仅保留 Credentials 用户名密码）✅ · 评论：**自建评论替代 Giscus，giscus.tsx + Giscus env 已物理删除** ✅ · 上传弹窗：**方案 B 已落地** ✅ · 提交弹窗：**方案 A-1 已落地（onDismiss 跳 /dashboard/submissions）** ✅ · 投稿页额度：**方案A已落地（上传后自动刷新）** ✅ · 我的投稿页：**已落地（4 Tab + 取消投稿 + 驳回后重提）** ✅ · 投稿预览：**方案A独立路由已落地 /dashboard/submissions/\[slug]** ✅ · 未注册登录弹窗：**强制 Dialog 已上线** ✅ · 音乐播放器：**方案3 HoverCard 悬停展开已上线** ✅ · 头像裁剪画布 ✅ · 角色 Character enum 字段 ✅ · **AI 聊天 UI 全链路上线（5 层拦截 + 占位语）** ✅ | **—（待完成 2 项中优可选音乐 + 1 项中优 AI 集成）**                                                          | —                                                                                                          |

***

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

# 6. 运行单元测试
npm test           # vitest run 单次执行
npm run test:watch # vitest watch 模式
```

***

## 环境变量配置

编辑 `.env` 文件：

```env
# Auth.js 密钥（生成命令: openssl rand -base64 32）
AUTH_SECRET="your-random-secret"

# 站点 URL（生产环境必须配置；双平台部署填主站域名即可，Vercel/Netlify 回调会自动携带 Referer）
# 主站（Netlify）：https://daniya-fansite.netlify.app
# 备用（Vercel，免费额度，实时更新）：https://daniya-fansite.vercel.app
AUTH_URL="https://daniya-fansite.netlify.app"

# Neon PostgreSQL（serverless）
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# ⚠️ 以下 4 段配置（GitHub/QQ OAuth、SendCloud 邮件、腾讯云短信）对应代码已全部物理删除（账号体系精简为 Credentials 用户名 + 密码），仅作历史记录，无需配置
# GitHub OAuth（代码已移除 · auth.ts 只剩 Credentials provider）
# AUTH_GITHUB_ID=your-github-client-id
# AUTH_GITHUB_SECRET=your-github-client-secret

# QQ OAuth（代码已移除 · qq-provider.ts + oauth-buttons.tsx 已删除）
# AUTH_QQ_ID=your-qq-app-id
# AUTH_QQ_SECRET=your-qq-app-secret

# SendCloud 邮件发送（代码已移除 · email.ts + email-login-form.tsx 已删除）
# SENDCLOUD_API_USER=your-sendcloud-user
# SENDCLOUD_API_KEY=your-sendcloud-key
# EMAIL_FROM="noreply@your-domain.com"

# 腾讯云短信（代码已移除 · sms.ts + send-sms/route.ts + phone-login-form.tsx 已删除）
# TENCENT_SMS_SECRET_ID=your-secret-id
# TENCENT_SMS_SECRET_KEY=your-secret-key
# TENCENT_SMS_SDK_APP_ID=your-sdk-app-id
# TENCENT_SMS_TEMPLATE_ID=your-template-id

# 管理员用户 ID — 在数据库 User 表中查找你的用户 ID
# 用于 /dashboard/* 后台作品管理权限验证
ADMIN_USER_ID=your-user-id

# ImgURL 图床 API 凭证（最终方案，已废弃 SM.MS / S.EE）
# 从 https://www.imgurl.org/vip/user 获取 UID 和 Token
IMGURL_UID=your-uid
IMGURL_TOKEN=your-token
```

***

## 如何添加新作品

有三种方式：**用户投稿（审核后发布）**、**后台可视化编辑（直接发布，仅站长）** 或 **手动创建 MDX 文件**。

### 方式零：用户投稿（登录用户可用，审核后发布）

任何登录用户都可点击 Header 右上角「投稿」按钮进入 `/submit` 页面，填写作品信息后提交。投稿不会立即出现在首页，而是进入站长的待审核队列。

- **图片限流**：由于 ImgURL 免费版额度有限，用户投稿共用站长账号的 UID/TOKEN，因此实施每日限流：
  - 单用户每日最多上传 **3 张**图片
  - 全站所有用户合计每日最多上传 **8 张**图片（预留 2 张额度给站长自己发文）
  - 超出后上传接口返回 429，前端显示具体限流信息
- **字段限制**：投稿表单隐藏了管理员专用字段（草稿状态、发布日期、原作者、来源平台、原帖链接），这些字段由站长在审核时补全
- **提交后**：写入 `PendingPost` 表，`status = PENDING`，等待站长审核

详见「用户投稿 & 人工审核工作流」章节。

### 方式一：站长后台 CRUD（跳过审核，直接发布）

1. 先用 GitHub OAuth 登录一次，让系统在数据库创建 User 记录
2. 把数据库里你的用户 ID 填入 `.env` 的 `ADMIN_USER_ID`，重启开发服务器
3. 登录后从侧边栏进入 `/dashboard/posts/new`（普通用户看不到「作品管理」入口，只有站长能看到）
4. 填写 Frontmatter 字段 → 通过 ImgURL 上传器选择本地图片上传 → 编辑 MDX 正文 → 保存发布
5. 后台同时支持：查看列表、按 slug 编辑、删除草稿

后台 API 位于 `src/app/api/admin/*`，所有路由都经过 `proxy.ts` 的 Auth 守卫 + `lib/admin.ts` 管理员校验双重保护。

### 方式二：手动创建 MDX 文件

在 `content/posts/` 下创建 MDX 文件，支持两种目录结构：

```
# 目录形式（推荐，便于后续放置同目录附件）
content/posts/2026-06-30-my-new-post/
└── index.mdx

# 单文件形式
content/posts/2026-06-30-my-new-post.mdx
```

> 配图不存放于仓库中，统一上传 ImgURL 图床后将外链 URL 写入 frontmatter 的 `images` 字段。

### Frontmatter 模板

```yaml
---
title: "作品标题"
description: "一句话描述，用于卡片预览和 SEO（1-300字）"
type: "illustration"       # illustration | comic | video | article | cosplay | other
images:                    # ImgURL 图床外链（可选，支持多张）
  - "https://s3.bmp.ovh/2026/06/30/xxxxx.jpg"
  - "https://s3.bmp.ovh/2026/06/30/yyyyy.png"
videoId: "BV1xx411c7XZ"    # B站 BV 号，仅 type: video（可选）
originalCreator: "原作者昵称"
sourceUrl: "https://weibo.com/xxx/xxx"
sourcePlatform: "weibo"    # weibo | pixiv | twitter | lofter | bilibili | xiaohongshu | other
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
- `sourceUrl` 必须为完整 URL（含 https\://）
- `images` 字段使用 **ImgURL** 图床（CDN 域名 `s3.bmp.ovh`）上传后获得的外链 URL，详情页自动展示图片网格
- `videoId` 填入 B站 BV 号，详情页自动嵌入 iframe 播放器
- 标签最多 8 个

***

## 图床方案演进

媒体存储经过三次迭代，最终落定 **ImgURL**：

| 阶段    | 方案                       | 弃用原因               |
| ----- | ------------------------ | ------------------ |
| 1     | SM.MS（`s2.loli.net`）     | 免费版限额、境外访问受限       |
| 2     | S.EE                     | 免费额度用完需付费          |
| 3（当前） | **ImgURL**（`s3.bmp.ovh`） | ✅ API 稳定、代理层做响应归一化 |

`/api/admin/upload-image` 是统一的上传代理入口，无论后端接入哪家图床，前端都拿到相同结构的 `{ url }` 响应。后续切换图床只需修改代理实现，组件层无需改动。

***

## 用户投稿 & 人工审核工作流

为保护 ImgURL 免费版额度不被滥用，同时确保内容质量，所有登录用户的投稿都必须经过站长人工审核。

### 审核流程图

```
登录用户 → /submit 填写投稿 → 前端校验 submitPostSchema
                                │
                                ▼
                  /api/user/submit-post 写入 PendingPost
                                │  status = PENDING
                                ▼
                       ┌─────────────────┐
                       │ 站长 /dashboard │
                       │  /moderation    │
                       └────────┬────────┘
                 ┌──────────────┴───────────────┐
                 │ 查看详情（图片/视频/正文/来源）│
                 └──────────────┬───────────────┘
                  ┌─────────────┴──────────────┐
                  ▼                            ▼
          ✅ 通过 (approve)              ❌ 驳回 (reject)
          · 补全原作者/来源平台/原帖链接    · 必填驳回理由（≥2 字符）
          · 用 postMetaSchema 强校验        · 写入 rejectReason
          · 写 MDX 到 content/posts/         · status = REJECTED
          · status = APPROVED               · 不生成 MDX
          · 记录 publishedSlug
                  │                            │
                  ▼                            ▼
            前台首页可见                    用户可查看驳回理由
```

### 限流策略（ImgURL 免费版保护）

| 维度     | 限额                         | 实现位置                                                                |
| ------ | -------------------------- | ------------------------------------------------------------------- |
| 单用户日上传 | 3 张图片                      | `canUploadToday()` + `recordUpload()` in `lib/upload-rate-limit.ts` |
| 全站日上传  | 8 张图片                      | 同上，Map 全局计数                                                         |
| 超出后行为  | 返回 429 + 具体超限信息（用户额度/全站额度） | `api/user/upload-image/route.ts`                                    |

> 当前限流为进程内内存实现（Map 存储），**Netlify Serverless / Vercel Edge Function 多实例之间不共享计数**，真实限额可能略高于设定值。如后续流量增大，可迁移到 Redis / Upstash Redis / Netlify KV / Vercel KV 持久化存储（推荐 Upstash，两家平台均能跨平台读取）。

### 数据库模型：PendingPost

```prisma
enum PendingPostStatus { PENDING  APPROVED  REJECTED }
model PendingPost {
  id / userId / slug (唯一) / title / description / type
  images[] / videoId? / tags[]
  originalCreator? / sourcePlatform? / sourceUrl?
  content (MDX 正文)
  status / rejectReason? / reviewedBy? / reviewedAt?
  publishedSlug? (通过后生成的作品 slug)
  createdAt / updatedAt
  user → User (onDelete: Cascade)
}
```

### 权限控制

| 资源                               | 可访问者    | 守卫方式                                                 |
| -------------------------------- | ------- | ---------------------------------------------------- |
| `/submit` 投稿页面                   | 所有登录用户  | 服务端 `auth()` 会话校验，未登录 → `/login`                     |
| `/api/user/upload-image`         | 所有登录用户  | `auth()` + `canUploadToday()` 限流                     |
| `/api/user/submit-post`          | 所有登录用户  | `auth()` + `submitPostSchema` Zod 校验                 |
| `/dashboard/moderation` 审核页      | **仅站长** | 服务端比对 `session.user.id === ADMIN_USER_ID`，非管理员显示 403 |
| `/api/moderation/posts` + `[id]` | **仅站长** | `requireAdmin()` 中间件（401 未登录 / 403 非管理员）             |
| `/dashboard/posts` 作品管理          | **仅站长** | Dashboard layout 动态隐藏入口；API 层 `requireAdmin()` 兜底    |

***

## 项目结构

```
daniya-fansite/
├── content/posts/          # === 二创内容库（可通过后台或手动编辑）===
├── prisma/
│   └── schema.prisma       # 数据库模型：User（username@unique+passwordHash）/ Account / Bookmark / PostLike / PendingPost（character? Character enum / rejectReason / publishedSlug）/ VerificationToken / Comment
├── public/                 # 公共静态资源（Hero 三张 jpg + Logo + 立绘占位）
│   └── music/              # 【新增】🎵 站点背景音乐（ogg/mp3 等，歌单由 src/data/music-playlist.ts 管理）
├── src/
│   ├── data/
│   │   └── music-playlist.ts   # 【新增】DANIYA_PLAYLIST 歌单（MusicTrack 接口：id/title/artist/src/coverUrl?）；track-1 真实化，track-2/3 占位
│   ├── app/
│   │   ├── page.tsx              # 首页 — Hero + 三列布局（左图 / 信息流 / 右图）+ 分页 + birthday-countdown 生日倒计时组件
│   │   ├── hero-banner.tsx       # Hero Banner 独立组件（暗/亮图自动切换 + 胶囊）
│   │   ├── birthday-countdown.tsx # 【新增】5月21日生日倒计时 7 状态动态文案组件
│   │   ├── side-image.tsx        # 侧边装饰图组件（暗/亮主题切换 + mask 虚化）
│   │   ├── globals.css           # 星空泡泡主题样式入口（含 surface-pink 双主题粉色毛玻璃）
│   │   ├── layout.tsx            # 根布局（ThemeProvider + StatusModalProvider + Header + Footer + **全局挂载 DaniyaChatFAB**）
│   │   ├── post/[slug]/page.tsx  # 作品详情页
│   │   ├── type/[type]/page.tsx  # 类型筛选页
│   │   ├── tag/[tag]/page.tsx    # 标签筛选页
│   │   ├── character/page.tsx    # 达妮娅角色页（真实立绘 Hero + 档案卡 + 三 Tab：角色介绍/技能档案/相关作品）
│   │   ├── about/page.tsx        # 关于本站（站长寄语/版权/联系方式）
│   │   ├── search/page.tsx       # 搜索页
│   │   ├── (auth)/login/         # === 登录 / 注册 ===
│   │   │   ├── page.tsx          # 登录页：LoginForm（用户名+密码+Canvas 图形验证码 + 未注册专属强制 Dialog）+ 底部"去注册"跳转
│   │   │   └── register/         # 注册页：RegisterForm（用户名/密码×2+图形验证码 → /api/auth/register → 自动登录）
│   │   ├── (dashboard)/          # 个人中心（侧边栏：概览/收藏/我的投稿；站长额外：投稿审核。账号设置/作品管理已合并进概览页）
│   │   │   ├── layout.tsx        # 侧边栏动态生成：普通用户 3 项 / 站长 +投稿审核
│   │   │   └── dashboard/
│   │   │       ├── page.tsx      # 概览页 6 段整合（用户信息 + 统计 + AvatarUploadDialog 裁剪换头像 + 账号操作 + 站长作品管理快捷 3 Card）
│   │   │       ├── submissions/       # 【新增】=== 我的投稿 ===
│   │   │       │   ├── page.tsx       # 4 Tab 列表（全部/待审核/已通过/已驳回，带状态计数徽章）+ 取消投稿 + 驳回后重提
│   │   │       │   └── [slug]/page.tsx # 【新增】=== 投稿预览独立路由（方案A）=== 三层守卫 + 三态胶囊 + 锁横幅 + 驳回重提 + APPROVED 外链正式页
│   │   │       ├── settings/     # 账号设置（独立页面保留，深链兼容；不再出现在侧边栏）
│   │   │       ├── moderation/        # === 站长投稿审核（仅 ADMIN_USER_ID）===
│   │   │       │   ├── page.tsx       # 服务端守卫 + 客户端审核面板
│   │   │       │   └── moderation-panel.tsx  # 审核 UI：列表 + 详情抽屉 + 通过/驳回表单
│   │   │       └── posts/             # 站长作品 CRUD（独立页面保留，深链兼容；不再出现在侧边栏）
│   │   ├── submit/page.tsx      # 用户投稿页（含今日额度卡片双进度条 + ?resubmit=id 回填 prefill）
│   │   └── api/
│   │       ├── auth/                  # Auth.js + 账号体系
│   │       │   ├── [...nextauth]/     # Auth.js callbacks；authorize() 抛 USER_NOT_REGISTERED 区分未注册 vs 密码错
│   │       │   └── register/route.ts  # 注册 POST：用户名 2-10字符 / 密码≥6 → bcrypt 哈希 → 自动 signIn
│   │       ├── bookmarks/        # 收藏 CRUD（需登录）
│   │       ├── likes/            # 点赞 CRUD（需登录）
│   │       ├── comments/[id]/    # 【新增】自建评论：DELETE（本人 or 站长）
│   │       ├── rss/              # RSS 订阅
│   │       ├── search/           # 搜索接口
│   │       ├── posts/[slug]/comments # 【新增】自建评论：GET 列表 + POST 发表（1-1000 字 Zod 校验）
│   │       ├── chat/route.ts         # 【7月10日 新增】AI 聊天后端代理 · POST 5 层安全拦截（未登录→401 / ≤200字 / 6类违规关键词 / 限流 / ≤30字输出）+ SSE 流式返回占位语「该功能还在测试中QAQ」；接入真模型后替换 fetch AstrBot/DeepSeek 即可
│   │       ├── admin/            # === 站长后台（requireAdmin 守卫）===
│   │       │   ├── posts/        # 文章列表 / 单篇创建-更新-删除
│   │       │   └── upload-image/ # ImgURL 上传代理（无限流）
│   │       ├── user/             # === 用户侧 API（登录守卫）===
│   │       │   ├── upload-image/ # ImgURL 上传（单用户 3/日 + 全站 8/日 限流）
│   │       │   ├── submit-post/  # 写入 PendingPost（Zod 校验 + slug 冲突检查 + character 字段写入）
│   │       │   ├── submissions/[id]/route.ts # 【新增】GET 单条详情（本人守卫）+ DELETE（仅 PENDING 可取消，非 PENDING → 409 Conflict）
│   │       │   └── profile/      # PATCH 更新头像：auth 401 → image 字段验证 → prisma.user.update image
│   │       └── moderation/       # === 审核 API（requireAdmin 守卫）===
│   │           ├── posts/        # GET 投稿列表（按 status 过滤 + 状态计数）
│   │           └── posts/[id]/   # GET 详情 / PUT approve 写MDX or reject
│   ├── components/
│   │   ├── admin/          # 后台/投稿复用组件：MDX 编辑器、图片上传器（uploadEndpoint+onUploadSuccess prop）、BV号输入、PostForm（validationSchema/hiddenFields/uploadEndpoint/prefill/refreshQuotaOnUpload 多态 props + 关联角色 character 下拉）
│   │   ├── auth/           # === 认证组件 ===
│   │   │   ├── login-form.tsx          # 登录表单（含 showNotRegistered 强制 Dialog，仅 X/确认 可关）
│   │   │   ├── register-form.tsx       # 注册表单
│   │   │   ├── captcha.tsx             # Canvas 手绘 4 位图形验证码
│   │   │   ├── avatar-upload-dialog.tsx # 更换头像对话框（react-easy-crop 裁剪画布 + 缩放 + 旋转 4 角度 + Blob 上传）
│   │   │   ├── user-menu.tsx           # 登录后的下拉用户菜单（ui/Avatar + fallback 首字母）
│   │   │   └── sign-in-button.tsx      # 未登录时显示的登录入口按钮
│   │   ├── comments/       # 自建评论（user-comments.tsx：加载中/空态/列表 + 删除按钮 + 字数计数 X/1000）
│   │   ├── feed/           # FeedCard / FeedList / FeedPagination
│   │   ├── interaction/    # LikeButton / BookmarkButton（乐观更新）
│   │   ├── layout/         # Header（左 Logo / 中导航胶囊 / 右：搜索🎵播放器主题切换投稿 用户菜单 汉堡）/ Footer / MobileNav
│   │   ├── media/          # PostGallery（图片网格）+ BilibiliEmbed（BV号 iframe）
│   │   ├── post/           # PostMeta + 关联角色 badge / PostCredit（出处标注·暖金）/ PostTypeBadge
│   │   ├── shared/         # ThemeProvider / ThemeToggle / **🎵 MusicPlayer（方案3 HoverCard 悬停展开）** / **🤖 DaniyaChatFAB（AI 聊天 FAB+Dialog）**
│   │   └── ui/             # === 基础 UI ===
│   │       ├── dialog.tsx        # 自制 Radix 风格 Dialog 5 具名导出（Dialog/Trigger/Content/Title/Description）
│   │       ├── popover.tsx       # shadcn/ui Popover 封装（Root/Trigger/Content；其他组件仍用）
│   │       ├── hover-card.tsx    # 【7月10日 新增】shadcn/ui HoverCard 封装（Root/Trigger/Content；毛玻璃；音乐播放器方案3用）
│   │       ├── status-modal.tsx  # 【新增】全局 StatusModalProvider + useStatusModal（showSuccess/showError；成功可 autoClose + onDismiss 回调）
│   │       └── Button / Card / Badge / Input / Avatar / Skeleton / Separator / Accordion / Textarea（AI 聊天输入框自适应高度） ...
│   ├── lib/
│   │   ├── validators/           # Zod 校验
│   │   │   ├── post-schema.ts        # 站长后台 postMetaSchema（character enum nullable）
│   │   │   ├── submit-post-schema.ts # 用户投稿 submitPostSchema（character enum optional + images/video refine）
│   │   │   └── comment-schema.ts     # 【新增】评论 content 1-1000 字 trim
│   │   ├── password.ts      # bcryptjs 封装：hashPassword(salt 10轮) / verifyPassword
│   │   ├── admin.ts         # requireAdmin() — 会话 + ADMIN_USER_ID 双校验
│   │   ├── upload-rate-limit.ts # 用户投稿图片限流：单用户 3/日 + 全站 8/日（进程内 Map）
│   │   ├── submit-error-classifier.ts # 【新增】A-1 错误分级：GREEN/YELLOW/RED 三级关键词匹配；系统级错误统一显示「系统维护中…」
│   │   ├── posts.ts         # MDX 读取工具（getAllPosts({ includeDrafts }) / 筛选）
│   │   ├── posts-io.ts      # createPostMdx() — 从 admin/moderation 写入 MDX 文件
│   │   ├── slugify.ts       # slugifyWithSuffix() — 中文转拼音 + SLUG_REGEX 3-60字符 + 随机hex后缀
│   │   ├── search.ts        # 搜索索引
│   │   ├── prisma.ts        # Prisma 客户端单例
│   │   └── utils.ts         # cn() — clsx + tailwind-merge 合并工具
│   └── types/post.ts        # PostMeta 类型定义（POST_TYPES 7 种含 screenshot；数组已内部 const 不再 export；对外仅 PostType/SourcePlatform 联合类型）
├── tests/                    # Vitest 单元测试（**29 files / 265 passed / 1 todo**）
├── tests/login-form.test.ts             # 登录表单（含 USER_NOT_REGISTERED 弹窗区分）8 cases
├── tests/global-modal.test.ts           # 全局 StatusModal 8 cases
├── tests/submit-modal.test.ts           # 提交成功/分级错误弹窗 14 cases
├── tests/submit-quota.test.ts           # 投稿页额度双进度条 8 cases
├── tests/submissions.test.ts            # 我的投稿 4 Tab + 取消/重提 11 cases
├── tests/submission-preview.test.ts     # 投稿预览方案A 独立路由 13 cases
├── tests/music-player.test.ts           # 音乐播放器基础逻辑 17 cases
├── tests/music-player-panel.test.ts     # 音乐播放器 **方案3 HoverCard** 面板 18 cases（Popover→HoverCard + openDelay/closeDelay 双延迟断言）
├── tests/character-page.test.ts         # 角色页 Hero+档案+三 Tab 17 cases
├── tests/birthday-countdown.test.ts     # 生日倒计时 7 状态 13 cases
├── tests/avatar-crop.test.ts            # 头像裁剪 react-easy-crop 9 cases
├── tests/schema-character.test.ts       # Character enum schema 4 cases
├── tests/post-form.test.ts              # PostForm 受控 props + 关联角色下拉 7 cases
├── tests/home-page.test.ts              # 首页布局 5 cases
├── tests/header.test.ts                 # Header 三列结构 + MusicPlayer 挂载 8 cases
├── tests/posts-filter.test.ts           # 类型/标签/筛选 3 cases
├── tests/dashboard-layout.test.ts       # Dashboard 侧边栏精简 + 概览页整合 13 cases
├── tests/submit-post-schema.test.ts     # submitPostSchema 长度限制/枚举/refine 12 cases
├── tests/upload-rate-limit.test.ts      # 限流 Map 9 cases (1 skip _resetForTests)
├── tests/admin-guard.test.ts            # requireAdmin 401/403/OK 5 cases
├── tests/comment-schema.test.ts         # Comment 1-1000 trim 4 cases
├── tests/comment-guard.test.ts          # 评论 API auth+本人/站长删除 7 cases
├── tests/chat-fab-exists.test.tsx       # 【7月10日 新增】AI 聊天 ① FAB 组件挂载 & 全局 layout 引用 1 case
├── tests/chat-dialog-opens.test.tsx     # 【7月10日 新增】AI 聊天 ② 点击 FAB → Dialog 展开（含 FAB+Dialog+Avatar 断言）2 cases（前 1 案合并入 chat-fab-exists）
├── tests/chat-bubbles-render.test.tsx   # 【7月10日 新增】AI 聊天 ③ 消息气泡（AI 左+用户右）+ SSE 流式打字机渲染结构 3 cases
├── tests/chat-content-compliance.test.ts # 【7月10日 新增】AI 聊天 ④ 内容合规 6 大类关键词过滤 6 cases（自杀自残/毒品/赌博/色情/枪支恐怖/传销诈骗）
├── tests/chat-short-response.test.ts    # 【7月10日 新增】AI 聊天 ⑤ 输出 ≤ 30 字 + 占位语「该功能还在测试中QAQ」固定 6 cases
├── tests/chat-unauthenticated-block.test.ts # 【7月10日 新增】AI 聊天 ⑥ 未登录点击阻断 4 cases（修复过一次 comment 误匹配：POST 体内搜 + deepseek 严格正则）
├── vitest.config.ts        # vitest 配置（jsdom + vite-tsconfig-paths 支持 @/ 别名）
├── auth.ts                 # Auth.js v5 核心配置（Credentials 用户名密码；JWT session strategy；jwt/session callbacks 同步 userId & image）
├── proxy.ts                # Next.js 16 Proxy（middleware）— 路由保护（含 /api/admin/*）
├── mdx-components.tsx      # MDX 全局组件映射
└── next.config.mjs         # remotePatterns：SM.MS(legacy) / ImgURL CDN s3.bmp.ovh / B站封面 api.bilibili.com
```

***

## 设计系统

### 色彩方案 · 星空泡泡主题

以达妮娅「粉白渐变长发」+「泡影视阈技能」为灵感，提取色彩系统：

| 变量              | 用途        | 色值（暗色）                                                   |
| --------------- | --------- | -------------------------------------------------------- |
| `--background`  | 页面背景      | 深蓝黑 `oklch(0.12 0.015 260)`，叠三层星云径向渐变                    |
| `--foreground`  | 正文文字      | 浅灰白 `oklch(0.92 0.01 250)`                               |
| `--primary`     | 主色调（粉）    | 柔粉 `oklch(0.72 0.12 340)`，提取自发色渐变                        |
| `--accent`      | 强调色（泡泡紫）  | 梦幻紫 `oklch(0.60 0.16 290)`                               |
| `--credit`      | 出处标注      | 暖金 `oklch(0.70 0.12 60)`，呼应泡影暖光                          |
| `--muted`       | 卡片占位      | 暗灰紫 `oklch(0.22 0.03 265)`                               |
| `--card`        | 卡片底色（毛玻璃） | 半透明 `oklch(0.18 0.025 260 / 0.6)` + `backdrop-blur(8px)` |
| `--bubble-glow` | 泡泡光晕      | 粉色柔光，卡片 hover 时加强                                        |

亮色主题（`.light`）：粉白渐变背景 + 白日星尘，卡片用 **粉色 50% 毛玻璃**（`surface-pink` 类），Header/Footer/信息流三区域亮色下自动切换为泡泡粉表面。

`.surface-pink` 双主题规则（全局生效）：

- **暗色主题**：柔粉淡毛玻璃 `oklch(0.72 0.12 340 / 0.08) + backdrop-blur(12px)`（Hero 信息流、Header、Footer 等关键区域均使用，提供轻盈泡泡感但不至于粉得刺眼）
- **亮色主题**：加深粉色毛玻璃 `oklch(0.72 0.12 340 / 0.5) + backdrop-blur(12px)`（白日里粉色感明显，符合主题设定）

#### 纯 CSS 星空 + 泡泡动画

- **body 背景**：3 层星云 radial-gradient + 5 处星尘微粒，无需图片资源
- **`#__next::before/::after`**：两个大尺寸浮动泡泡，`floatBubble` keyframes 20s 交替漂浮
- **`.card`** **/** **`.rounded-xl`**：内外双层光晕 `box-shadow`，hover 时加强 + translateY(-2px)
- **`.bubble-surface::before/::after`**：Header/Hero/Footer 表面两颗小气泡（headerBubble 动画）
- **`.star-twinkle-*`**：星星闪烁 delay 变体类（组件中可用）

### Hero · 三列布局 + 响应式

```
┌─────────────────────────────────────────────────────────────────┐
│  Hero Banner（min-height: 50vh，py-8）                            │
│  ┌───────── 角色资料胶囊（方案一 · 720 × 320+）────────┐         │
│  │ ① 角色名 Daniya + 标签 💤瞌睡王/🍰甜点党/❄️泡泡共鸣 │         │
│  │ ② 档案3段：日常·睡觉｜契约·甜点+蒙题｜「数据来源别问」 │         │
│  │   └── blockquote 暖金 credit 色引用 │  ┌─────────┐ │         │
│  │ ③ ──Separator──                        │ 立绘圆形 │ │         │
│  │ ④ 💬 达妮娅说：校服泡泡梗自白            │ w-64 h-64│ │         │
│  │                                         │ ring 光晕│ │         │
│  │ [左文 结构化分栏]                        └─────────┘ │         │
│  └────────────────────────────────────────────────────┘         │
│                     ↕  lg+ 左右并排 ↕                             │
│              ┌── 标题胶囊 + 筛选标签胶囊 ──┐                    │
│              │ 「达妮娅的瞌睡小屋」副标题  │                    │
│              │ 筛选：插画/漫画/视频/文章.. │                    │
│              └──────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
┌────────┬──────────────────────────────────┬────────────┐
│ 左侧   │  信息流（max-w-2xl 分页卡片流）   │ 右侧       │
│ Sticky │                                  │ Sticky     │
│ Hero   │  卡片 1 ·图片·标题·简介·出处     │ Hero       │
│ 装饰   │  卡片 2 ...                      │ 装饰       │
│ 图     │  卡片 3 ...                      │ 图         │
│（mask  │  FeedPagination                  │（mask      │
│ 渐变   │                                  │ 渐变虚化） │
│ 虚化） │                                  │            │
└────────┴──────────────────────────────────┴────────────┘
```

- **桌面端（lg 及以上，≥1024px）**：角色资料胶囊 + 标题/筛选胶囊 **左右并排**（`lg:flex-row`，gap-8），角色胶囊固定 `w-[720px] min-h-80`，内容不被压缩
- **平板端（md，768-1023px）**：角色胶囊仍显示，但 flex 方向改为 **上下堆叠**（默认 `flex-col`，gap-6），避免横向挤压；Hero 整体用 `min-height + py-8` 自适应增高（废弃原先固定 `height: 50vh` 导致内容被切）
- **Hero 结构变更（方案一）**：左胶囊从 `650×288 rounded-full` 的「角色名+一句话简介」改为 `720×320+ rounded-3xl` 的结构化 4 块内容——①角色名 Daniya 英文名 + 三枚身份标签（💤学院瞌睡王 / 🍰甜点党 / ❄️泡泡共鸣） / ②档案 3 段（📝日常·睡觉｜契约·甜点+蒙题｜「来源不明的数据别问」暖金 `blockquote`） / ③ Separator 分隔线 / ④达妮娅说：校服泡泡梗自白；右立绘加 `ring-4 ring-[var(--primary)]/20` 粉色外光晕
- **Hero 右侧标题胶囊**：删除了原「作品数 / 类型数」两个统计数字（与下文信息流重复）；筛选标签从本地 `TYPE_LABELS` 改为全局 `POST_TYPE_LABELS`，和详情页/徽章保持一致
- **桌面端（md 及以上）内容区布局**：flex 三列，左右两侧 `SideImage` 占 `50vw - 336px`，信息流居中 2xl，**信息流外框包了一层** **`.surface-pink rounded-xl`** **粉色毛玻璃**（呼应主题）
- **滚动**：左右侧图改为 sticky（已废弃 fixed 方案），跟随信息流视口滚动，`mask-image` 做内侧渐变虚化，无缝融入背景
- **暗/亮双主题图**：`SideImage` / `HeroBanner` 接收 `darkSrc` + `lightSrc` 双参数，跟随主题自动切换；左右装饰图的亮色主题使用独立专用图（长 hash 文件名）
- **手机端**：角色胶囊 & 侧边图 `display:none`，信息流单栏铺满

### 图片尺寸规范

| 用途                 | 尺寸        | 比例     |
| ------------------ | --------- | ------ |
| 信息流卡片缩略图           | 800×450   | 16:9   |
| 详情页横屏大图            | 1920×1080 | 16:9   |
| 详情页竖屏大图            | 1080×1350 | 4:5    |
| 详情页方图              | 1080×1080 | 1:1    |
| Hero 桌面左/右装饰图（暗色）  | 600×900   | 2:3    |
| Hero 桌面左/右装饰图（亮色）  | 600×900   | 2:3    |
| Hero 手机背景图（暗/亮各一套） | 750×1000  | 3:4    |
| 角色头像               | 200×200   | 1:1    |
| 站点 Logo            | 200×60    | —      |
| OG 社交分享图           | 1200×630  | 1.91:1 |

> Hero 三张三套图片（暗色/亮色/手机）均已就位（`public/hero-side-left.jpg`、`hero-side-right.jpg`、`hero-mobile.jpg` + 亮图）。

***

## 后台管理系统

**访问路径**（需登录，「作品管理 / 投稿审核」仅 `ADMIN_USER_ID` 可见）：

| 路由                             | 用途                                      | 权限      |
| ------------------------------ | --------------------------------------- | ------- |
| `/dashboard`                   | 个人中心概览                                  | 所有登录用户  |
| `/dashboard/bookmarks`         | 我的收藏列表                                  | 所有登录用户  |
| `/dashboard/settings`          | 账号设置                                    | 所有登录用户  |
| `/submit`                      | 投稿页面（写入 PendingPost 等待审核）               | 所有登录用户  |
| `/dashboard/posts`             | 作品列表（MDX 文章 + 草稿 + 编辑/删除入口）             | 仅站长     |
| `/dashboard/posts/new`         | 新建作品：表单 + MDX 编辑 + ImgURL 上传（直接发布，跳过审核） | 仅站长     |
| `/dashboard/posts/[slug]/edit` | 按 slug 编辑已有作品                           | 仅站长     |
| `/dashboard/moderation`        | 投稿审核：列表 + 状态筛选 + 详情抽屉 + 通过/驳回表单         | **仅站长** |

**图片上传工作流**：

- **站长后台**：点击「图片上传」→ `/api/admin/upload-image` → 携带 `IMGURL_UID` + `IMGURL_TOKEN` 请求 ImgURL → 响应归一化 → 写入 Frontmatter（**无限流**，站长本人不受限）
- **用户投稿**：点击「图片上传」→ `/api/user/upload-image` → 登录校验 + `canUploadToday()` 限流（3/用户日 + 8/全站日）→ 429 超限拦截 → 通过后同上

**审核通过工作流**（`/dashboard/moderation` 操作）：

1. 站长查看投稿详情（图片/B站预览/MDX正文/投稿者信息）
2. 审核通过表单预填发布日期/来源平台/原作者/原帖链接/标题/简介/标签 → 可修改
3. 点击「通过并发布」→ 调 `/api/moderation/posts/[id]` PUT `action=approve`
4. 服务端用 `postMetaSchema` 强校验 → 调 `createPostMdx()` 写 MDX 到 `content/posts/` → `revalidatePath` 刷新缓存
5. 更新 `PendingPost.status = APPROVED`，记录 `publishedSlug`、`reviewedBy`、`reviewedAt`

***

## 待办清单

### 必须完成

—（**核心功能 0 项待完成**；以下为中低优先级可选增量，不阻塞上线）

### 已删除 · 不再需要配置（代码已移除）

> 账号体系已从「GitHub/QQ OAuth + 邮箱 Magic Link + 手机短信验证码」4 种方式 → 精简为「用户名 + 密码（bcrypt 哈希）+ 注册页 + Canvas 图形验证码」。
> 评论体系已从 **Giscus（GitHub Discussions，身份与站内割裂，方案 A/D）** → **自建评论系统（方案 C，体验一致性优先）**。以下 6 项因对应源代码已移除/替换，无需再配置。

- [x] **~~配置 Giscus 评论~~**：`src/app/post/[slug]/page.tsx` 中 `<GiscusComments />` 已替换为 `<UserComments />`（自建）；**✓ 7月2日 22:00 giscus.tsx 组件文件已物理删除，`.env.local`** **中 4 条** **`NEXT_PUBLIC_GISCUS_*`** **及旧 GitHub/QQ/SendCloud/SMS 残留变量已全部清理**；`NEXT_PUBLIC_GISCUS_*` 从 `.env.example` 移除
- [x] **~~配置 GitHub OAuth~~**：`auth.ts` 中 GitHub provider 已移除（Auth.js providers 只剩 Credentials）
- [x] **~~配置 QQ OAuth~~**：`src/lib/auth/qq-provider.ts` + `src/components/auth/oauth-buttons.tsx` 已删除
- [x] **~~配置邮箱登录~~**：`src/lib/email.ts`（SendCloud）+ `src/components/auth/email-login-form.tsx` 已删除
- [x] **~~配置手机验证码~~**：`src/lib/sms.ts`（腾讯云）+ `src/app/api/auth/send-sms/route.ts` + `src/components/auth/phone-login-form.tsx` 已删除
- [x] **~~配置旧短信/邮件限流~~**：`src/lib/rate-limit.ts`（短信/邮件发送防刷内存限流）已删除

### 待用户完成

- [x] **角色简介文案**：首页 Hero Banner 角色胶囊结构化 4 段内容（💤日常/🍰契约+数据别问/──分隔线/💬校服泡泡自白）已填写
- [x] **角色页立绘图片 ×2**（7月3日）：`/character` 顶部 Hero Banner 2 张真实立绘图片 `492b30d224bf47429e8aa73a9cfd104a20260521.jpg` + `625294f4d0b740f4bf5ce693ddb0b35920260521.png` 已就位，同时用作歌单 track-1 封面
- [x] **ImgURL 凭证**（7月2日）：`.env.local` 中 `IMGURL_UID` 和 `IMGURL_TOKEN` 已填入真实值（从 <https://www.imgurl.org/vip/user> 获取），用户投稿图片上传 / 站长图片上传均可正常调用 ImgURL API
- [x] **站点背景音乐首曲接入**（7月5日）：`public/music/鸣潮先约电台 _ YUE_STEVEN _ 陆可儿Kirby - 最初和最后的礼物_H.ogg` 已就位；歌单 track-1 title/artist/src/coverUrl 已真实化
- [x] **🤖 AI 聊天 UI Mock**（7月10日）：FAB + Dialog + SSE 流式气泡 + 5 层安全拦截 + 占位语「该功能还在测试中QAQ」已全部上线，点击右下角浮动按钮即可体验
- [ ] **🎵 歌单 track-2 / track-3 真实化**（中优，推荐完成）：将 `/music/playlist-placeholder-2.mp3` / `playlist-placeholder-3.mp3` 两个占位 src 替换为真实达妮娅同人音频或鸣潮原声 OGG，并补充 `coverUrl`（缺省时面板会显示粉白渐变占位，不影响功能）
- [ ] **🤖 AI 聊天接入真模型**（**中优·核心功能待完成**）：三步走 —— ① 将 AstrBot 迁移至云服务器 7x24 运行（内网穿透或公网 IP）② 在 `.env` 配置 `ASTRBOT_API_URL` + `ASTRBOT_API_TOKEN`（HMAC 签名校验防止伪造，IP 白名单仅放行 Vercel/Netlify 出口 IP）③ 修改 [src/app/api/chat/route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/chat/route.ts) 删除 `PRESET_REPLIES` 数组，替换为 fetch AstrBot OpenAPI `POST /api/v1/chat`（DeepSeek V4 Flash）并启用 `@ai-sdk/openai-compatible` Provider；④ 开启 6\~10 层成本熔断（按用户/全站调用日限流 + 预算提醒 + 回复 token 截断 ≤ 512 + 会话级 memory 限 N 轮 + 敏感用户临时 ban）。**Prisma 聊天历史表已设计**（AIChatSession / AIChatMessage 两模型），未登录用户历史不落库，登录用户每次发消息自动 append

### 可选增强（低优先级 · 锦上添花）

- [ ] 🎵 音乐播放器追加：播放模式切换（列表循环 / 单曲循环 / 随机播放）+ 播放列表抽屉（展开歌单全部曲目直接点选）
- [ ] 🎞️ 详情页图片展示升级：从 PostGallery 静态网格 → 点击进入 lightbox 灯箱 / 左右滑动图片轮播
- [ ] 🔐 安全增强：登录失败 5 次 / 10 分钟 用户名粒度 IP 级限流（目前 only 图形验证码 + bcrypt 慢哈希）；密码重置流程（目前需联系站长手动改）
- [ ] 📱 移动端体验升级：Header 投稿胶囊与搜索栏合并进 MobileNav 汉堡抽屉；首页 feed 卡片圆角 + 图片尺寸手机端微调（目前 max-w-2xl 居中 + 左右 padding 可工作）
- [ ] 🤖 更多鸣潮角色扩展：当新增 OTHER 角色作品时，可考虑在 `/character` 页面增加角色切换 Tab，每个角色独立档案页
- [ ] 🔍 搜索结果高级过滤：按作品类型、发布时间、关联角色多选过滤（目前 `/search` 只按关键词匹配 title/description/tags）
- [ ] 🤖 AI 聊天体验增强：快捷推荐问题 chips（用户 7月10日确认不做暂 skip，后续可追加）；连续多轮会话 memory（目前 PRESET\_REPLIES 无状态，接真模型后按 sessionId 聚合 N 轮上下文）

***

## 错误修复记录（7月2日 全站审查）

对全站代码（API 路由 / Prisma 模型 / Zod 校验器 / 前端页面 / 限流模块 / 审核流程）做了一次完整审查，发现并修复了以下 **7 类错误**：

### 1. 用户投稿 MDX 正文丢失 ⚠️ 数据丢失级

- **原因**：Zod `submitPostSchema` 未声明 `body` 字段，默认 `.strip()` 策略会把未知字段剥离；API 路由原先从 `parsed.data` 取 `body`，结果永远是空字符串。
- **修复**：在调用 `.safeParse()` 之前先把 `rawBody` 存下来，MDX 正文改从 `(rawBody as any).body` 读取。
- **文件**：[submit-post/route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/user/submit-post/route.ts#L22-L39)

### 2. Schema 限制不一致 ⚠️ 审核通过被拒级

- **原因**：投稿端 `submitPostSchema`（title 2-60 / description 10-2000 / tags max 10）与站长端 `postMetaSchema`（title 1-120 / description 1-300 / tags max 8）限制值不统一，导致审核通过时 `postMetaSchema.safeParse` 打回合法投稿。
- **修复**：投稿端限制完全对齐站长端 — title `min(1).max(120)`、description `min(1).max(300)`、tags `max(8)`。
- **文件**：[submit-post-schema.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/validators/submit-post-schema.ts#L20-L29)

### 3. 缺少 `screenshot` 类型 ⚠️ 类型系统级

- **原因**：`submitPostSchema.type` 开放了 `"screenshot"`，但全局 `POST_TYPES`、`POST_TYPE_LABELS` 和 `postTypeEnum`（站长端）里没有，审核通过时类型断言 `as PostType` 不安全、`POST_TYPE_LABELS[type]` 查表失败。
- **修复**：在 `types/post.ts` 和 `post-schema.ts` 的枚举里补入 `screenshot: "截屏"`。
- **文件**：[types/post.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/types/post.ts#L11-L31)、[post-schema.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/validators/post-schema.ts#L12-L20)

### 4. Dashboard 作品管理页面无权限守卫 ⚠️ 安全级

- **原因**：`/dashboard/posts`、`/dashboard/posts/new`、`/dashboard/posts/[slug]/edit` 三个页面仅做了登录检查，未比对 `ADMIN_USER_ID`；任何登录用户直接输 URL 就能看到后台编辑器（虽然保存时 API 层会被 `requireAdmin()` 拦住，但 UI 泄露依然是安全隐患）。
- **修复**：三个页面全部加 403 无权限红色面板（new 页面额外提供「前往投稿」跳转链接）。
- **文件**：[posts/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/posts/page.tsx#L13-L23)、[new/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/posts/new/page.tsx#L16-L32)、[edit/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/posts/%5Bslug%5D/edit/page.tsx#L16-L26)

### 5. Moderation API groupBy 回调隐式 any ⚠️ 类型级

- **原因**：`Object.fromEntries(counts.map(c => [c.status, ...]))` 的回调参数 `c` 依赖 Prisma `.groupBy` 推断，开启 `noImplicitAny` 时报隐式 any。
- **修复**：结果变量加显式类型注解 `Record<string, number>`。
- **文件**：[moderation/posts/route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/moderation/posts/route.ts#L32-L34)

### 6. 审核通过表单缺少 maxLength / 字符提示 ⚠️ 用户体验级

- **原因**：审核通过时 override 的 title / description 输入框没有字数限制，可能输入超长被后端 `postMetaSchema` 打回，用户需重新填写。
- **修复**：给标题加 `maxLength=120`、简介加 `maxLength=300` 并附字符计数提示；与 Schema 限制一致。
- **文件**：[moderation-panel.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/moderation/moderation-panel.tsx)

### 7. 测试用例未同步 Schema 新限制 ⚠️ 测试级

- **原因**：`tests/submit-post-schema.test.ts` 仍按旧限制（title ≥2 / description ≥10 / tags max 10）写断言，与修复后的 submitPostSchema 对不上。
- **修复**：12 个用例全部更新到新限制（title: `min(1).max(120)`、description: `min(1).max(300)`、tags: `max(8)`），并加一行 comic 类型应失败（投稿端只开放 3 种类型）。
- **文件**：[submit-post-schema.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/submit-post-schema.test.ts)

### 验证结果

| 项                                          | 结果            |
| ------------------------------------------ | ------------- |
| `GetDiagnostics` (全局 TS 诊断)                | ✅ 0 errors    |
| `npx vitest run` (3 files / 25 tests)      | ✅ 全部通过        |
| `npx next build` (TypeScript + 页面生成 37/37) | ✅ exit code 0 |

***

## 手动更新记录（7月2日，19 个文件 + 37 个新增文件）

> 此章节记录手动在项目中增加的功能和改动，覆盖 **基础设施层 / UI 层 / 类型系统 / 数据层 / 审核与投稿整套 / 测试基础设施** 6 大类共 15 项。

### A. 基础设施 & 配置层（5 项）

#### A1. package.json — 新增 Vitest 测试全家桶 + 运行脚本

- **scripts 新增**：`"test": "vitest run"` / `"test:watch": "vitest"`
- **devDependencies 新增 6 个包**：
  - `@testing-library/jest-dom` v6.9.1（DOM 断言匹配器）
  - `@testing-library/react` v16.3.2（React 组件渲染测试）
  - `@testing-library/user-event` v14.6.1（模拟用户交互）
  - `@types/jsdom` v28.0.3
  - `jsdom` v29.1.1（浏览器环境模拟）
  - `vite-tsconfig-paths` v6.1.1（tsconfig paths 支持 `@/` 别名）
  - `vitest` v2.1.9（测试运行器）
- **文件**：[package.json](file:///C:/Users/29942/Desktop/daniya-fansite/package.json#L1-L52)

#### A2. proxy.ts — matcher 加 `/api/admin/*` 守卫（双锁策略）

- **原**：`matcher: ["/dashboard/:path*", "/api/bookmarks/:path*", "/api/likes/:path*"]`
- **新**：追加 `"/api/admin/:path*"`，所有 `api/admin/` 路由会被 Auth.js proxy 先拦截未登录请求，再加上 API 内部的 `requireAdmin()`（校验 ADMIN\_USER\_ID），形成**未登录 → 未授权**双层守卫。
- **文件**：[proxy.ts](file:///C:/Users/29942/Desktop/daniya-fansite/proxy.ts#L10-L15)

#### A3. next.config.mjs — 加 ImgURL CDN（s3.bmp.ovh）白名单

- `next.image.remotePatterns` 新增 `{ protocol: "https", hostname: "s3.bmp.ovh" }`（ImgURL 默认 CDN）
- 原 SM.MS 三条加了 `(legacy)` 注释标记旧版
- `next/image` 组件引用 ImgURL 图床图片无需再配置
- **文件**：[next.config.mjs](file:///C:/Users/29942/Desktop/daniya-fansite/next.config.mjs#L1-L30)

#### A4. .env.example — 新增 3 个必填环境变量

- `ADMIN_USER_ID=your-user-id`：站长唯一 ID，后台作品/审核权限判定
- `IMGURL_UID=your-uid`：ImgURL 图床 API UID
- `IMGURL_TOKEN=your-token`：ImgURL 图床 API Token
- （与 README「环境变量配置」章节末尾保持一致）
- **文件**：[.env.example](file:///C:/Users/29942/Desktop/daniya-fansite/.env.example)

#### A5. Prisma schema.prisma — 新增 PendingPost 审核模型 & User 关联

- **User 模型加关联**：`pendingPosts  PendingPost[]`（一个用户可有多条投稿记录）
- **新增枚举**：`PendingPostStatus { PENDING / APPROVED / REJECTED }`
- **新增模型 PendingPost**（16 字段 + 3 索引）：
  ```
  id/cuid · userId · slug@unique · title · description(VarChar 2000)
  type(String, 存 "illustration"/"screenshot"/"video") · images(String[])
  videoId? · tags(String[]) · originalCreator? · sourcePlatform? · sourceUrl?
  content@Text(MDX 正文) · status@default(PENDING) · rejectReason?
  reviewedBy? · reviewedAt? · publishedSlug?
  createdAt/updatedAt · user Relation(onDelete: Cascade)
  @@index([userId, status, createdAt])
  ```
- **文件**：[schema.prisma](file:///C:/Users/29942/Desktop/daniya-fansite/prisma/schema.prisma#L56-L158)

***

### B. Hero / UI 展示层（3 项）

#### B1. page.tsx — Hero 大改版（角色胶囊 4 段 + 布局重构 + 信息流毛玻璃框）

- **Hero 高度**：`height: 50vh` → `min-height: 50vh + py-8`，内容多时不被切
- **Flex 主容器**：`flex items-center gap-8` → `flex flex-col items-center lg:flex-row lg:items-center lg:gap-8`；**md+ 垂直堆叠，lg≥1024px 左右并排**
- **左侧角色胶囊（方案一已落地）**：
  - 尺寸 & 圆角：从 `w-[650px] h-72 rounded-full` → `w-[720px] min-h-80 rounded-3xl items-stretch`
  - **① 顶部**：达妮娅中文名 + `Daniya` 英文名粉胶囊 + 三枚身份标签（💤学院瞌睡王 / 🍰甜点党 / ❄️泡泡共鸣）
  - **② 档案 3 段**（12.5px 静音色）：`📝 日常：任何课堂睡觉` → `课题迷茫 甜点+软磨硬泡 → 蒙题+来源不明数据` → **暖金 credit-color blockquote**「至于这些数据来自哪里……她劝你最好别问。」
  - **③ Separator** 分隔线
  - **④ 💬 达妮娅说**：校服泡泡梗自白（12.5px 前景色）
  - **右立绘**：加 `pr-5 + ring-4 ring-[var(--primary)]/20` 粉色光晕
- **Hero 右侧标题胶囊**：
  - 删除「作品数 / 类型数」两个统计数字（与信息流重复）
  - 筛选标签从本地 `TYPE_LABELS` → 全局 `POST_TYPE_LABELS`（与详情页/徽章一致）
- **信息流外框**：`section.w-full.max-w-2xl` 外层包了 `.surface-pink.rounded-xl` 粉色毛玻璃
- **侧边装饰图**：亮色主题用独立专用文件（`47e2e589...jpg` / `5c4fbffa...jpg`），之前是和暗色共用一张
- **文件**：[page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/page.tsx#L1-L171)

#### B2. globals.css — `.surface-pink` 双主题补全（之前只定义了亮色）

- 新增 **暗色主题独立定义**：
  ```css
  .surface-pink {
    background: oklch(0.72 0.12 340 / 0.08);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  ```
- 亮色主题加深：`.light .surface-pink { background: ... / 0.5 }`（`/0.08` → `/0.5`），白日粉感更强烈
- Header / Hero 信息流 / Footer 在暗色下也有淡粉泡泡感了
- **文件**：[globals.css](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/globals.css#L437-L453)

#### B3. Header — 新增「投稿」胶囊按钮（登录用户可见）

- 在 `ThemeToggle` 之后、`UserMenu` 之前插入：
  ```tsx
  {user && (
    <Link href="/submit" className="rounded-full border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--primary)]/20 hover:border-[var(--primary)] transition-colors">
      投稿
    </Link>
  )}
  ```
- 未登录用户 → 看不到（和 SignInButton 相邻方便登录）
- **文件**：[header.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/layout/header.tsx#L56-L89)

***

### C. 类型系统 & 数据层（4 项）

#### C1. 新增 `screenshot`（截屏）作品类型（全局 4 处同步）

- [types/post.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/types/post.ts#L11-L31)：`POST_TYPES` 枚举 + `POST_TYPE_LABELS` 两处均加 `screenshot: "截屏"`，注释写了截屏/游戏/课堂截图
- [post-schema.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/validators/post-schema.ts#L12-L20)：站长端 `postTypeEnum` 加 `screenshot`，校验 MDX frontmatter 时接受
- [post-type-badge.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/post/post-type-badge.tsx#L10-L18)：徽章配置加 `screenshot: { label: "截屏", variant: "secondary" }`，和 comic 共用 secondary 灰色变体
- 投稿端 `submitPostSchema`（同 `type: z.enum([illustration, screenshot, video])`）和 UI 已对齐

#### C2. posts.ts — `getAllPosts()` 新增 `includeDrafts` 选项

- 签名：`function getAllPosts(opts?: { includeDrafts?: boolean }): PostMeta[]`
- 默认值：`includeDrafts ?? false`
- 草稿判断逻辑升级：
  ```
  原：if (meta.draft && NODE_ENV === "production") continue;
  新：if (meta.draft && !includeDrafts && NODE_ENV === "production") continue;
  ```
- 站长后台 `/dashboard/posts` 调用时传 `includeDrafts: true`，保证后台列表能看到草稿（前台仍隐藏）
- **文件**：[posts.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/posts.ts#L147-L190)

#### C3. Dashboard layout.tsx — 侧边栏按权限动态生成（权限分级 UI）

- 计算：`const isAdmin = session.user.id === process.env.ADMIN_USER_ID;`
- `sidebarLinks = [
    {概览}, {我的收藏}, {账号设置},
    ...(isAdmin ? [{作品管理}, {投稿审核}] : [])  // 仅站长
  ]`
- 普通用户（非 admin）：侧边栏只显示 **概览 / 我的收藏 / 账号设置** 三项；即使手动输 URL，`/dashboard/posts/*` 和 `/dashboard/moderation` 内部还有服务端 403 守卫（见之前的错误修复 #4）
- 布局：`max-w-4xl`，`sm:flex-row` 侧边栏 `sm:w-48`；手机端默认横向排列
- **文件**：[layout.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/layout.tsx#L1-L61)

#### C4. 示例作品图片链接改为 ImgURL CDN

- `content/posts/2026-06-20-sample-illustration/index.mdx`
  - `images: ['https://s3.bmp.ovh/2026/07/01/OMxkgY39.png']`（ImgURL 格式）
  - frontmatter 齐全：title/description/type/originalCreator/sourceUrl/sourcePlatform/tags/publishedAt/draft/images
- **文件**：[index.mdx](file:///C:/Users/29942/Desktop/daniya-fansite/content/posts/2026-06-20-sample-illustration/index.mdx)

***

### D. 37 个新增文件（untracked，整套投稿 & 审核 & 后台 CRUD & 测试）

#### D1. 用户投稿侧（API + 页面）

| 文件                                                                                                                     | 功能                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [submit/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/submit/page.tsx)                               | 用户投稿页面（登录守卫→4项投稿须知→PostForm 配置：validationSchema=submitPostSchema、uploadEndpoint=/api/user/upload-image、hiddenFields=\[draft/publishedAt/originalCreator/sourcePlatform/sourceUrl]、submitEndpoint=/api/user/submit-post、successRedirect=/）            |
| [api/user/upload-image/route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/user/upload-image/route.ts) | 用户图片上传：登录→`canUploadToday(userId)`（单用户 3/日+全站 8/日，超 429 带中文提示和剩余额度 meta）→转调 ImgURL `POST https://www.imgurl.org/api/v2/upload` → `recordUpload` 记一次额度                                                                                                |
| [api/user/submit-post/route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/user/submit-post/route.ts)   | 用户投稿提交：登录→`rawBody=request.json()` 保存原始 body（Zod strip 前）→`submitPostSchema.safeParse` → MDX 正文 `rawBody.body` 读取 → slug 自定义或自动 → slug 冲突检查（已发布 MDX + PendingPost 队列双重 409，自动 slug 冲突自动追加随机后缀重试）→ `prisma.pendingPost.create({ status: "PENDING" })` |

#### D2. 审核侧（API + 页面）

| 文件                                                                                                                                    | 功能                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [moderation/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/moderation/page.tsx)              | 服务端守卫：未登录→redirect；非 ADMIN\_USER\_ID→红色 403 面板「投稿审核页面仅站长可访问」；否则渲染 `<ModerationPanel />`                                                                                                                                                                                                                                                                       |
| [moderation-panel.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/moderation/moderation-panel.tsx) | 审核 UI 客户端：状态 Tab（PENDING/APPROVED/REJECTED，右上角状态计数）+ 列表（投稿人/标题/类型/创建时间/标签/审核状态 + 查看详情按钮）+ 详情抽屉（展示原图/BV号预览/正文MDX/投稿人信息）+ 两个 Tab 操作：**审核通过表单**（title maxLength=120 / description maxLength=300 / originalCreator 必填 / sourcePlatform 枚举下拉 / sourceUrl 必填 / tags / publishedAt / draft 复选，全部默认继承投稿值，空值自动填匿名投稿/other/占位URL）+ **驳回表单**（rejectReason 最小 2 字符必填，文本域） |
| [api/moderation/posts/route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/moderation/posts/route.ts)                  | `GET`：`requireAdmin()`→?status 过滤→?limit 上限 100→findMany 含 user 信息→groupBy 统计各状态数量→返回 `{ list, meta: { statusCounts, limit, filter } }`                                                                                                                                                                                                                       |
| [api/moderation/posts/\[id\]/route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/moderation/posts/%5Bid%5D/route.ts)  | `GET` 单条详情（含投稿人创建时间）；`PUT { action, overrides?, rejectReason? }`：**reject**（status=REJECTED + reviewedBy/At + rejectReason≥2截断≤500）/ **approve**（用 overrides 合并投稿值补齐 必填空值→再次 slug 冲突检查 409→`postMetaSchema.safeParse` 最终强校验 422→`createPostMdx()` 写 MDX→pendingPost.status=APPROVED + publishedSlug）                                                          |

#### D3. 站长后台作品 CRUD（页面 + API + 组件）

| 文件                                                                                                                                                     | 功能                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| [dashboard/posts/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/posts/page.tsx)                               | 作品列表：`getAllPosts({ includeDrafts: true })` → 表格（标题/类型/日期/状态「草稿/已发布」/操作：编辑 + DeleteButton）；服务端 403 守卫 |
| [dashboard/posts/new/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/posts/new/page.tsx)                       | 新建作品：403 守卫+引导去 `/submit` → `<PostForm />`（无任何限制参数，管理员全字段可编辑）                                         |
| [dashboard/posts/\[slug\]/edit/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/posts/%5Bslug%5D/edit/page.tsx) | 编辑作品：403 守卫→`getPostContent`→gray-matter 解析 frontmatter + body→`<PostForm initialData>` 回填            |
| [posts/delete-button.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/posts/delete-button.tsx)                       | 客户端删除按钮：二次确认对话框→`DELETE /api/admin/posts/[slug]`→成功后 `router.refresh()` + toast 提示                    |
| [posts/layout.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/posts/layout.tsx)                                     | 作品子路由 layout，保持内容区间距                                                                                  |
| [api/admin/posts/route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/admin/posts/route.ts)                                             | `GET` 列表（草稿包含）/ `POST` 新建：`requireAdmin()`→frontmatter + body→`createPostMdx()`                       |
| [api/admin/posts/\[slug\]/route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/admin/posts/%5Bslug%5D/route.ts)                         | `GET` 详情 / `PUT` 更新（含 slug 重命名时目录迁移）/ `DELETE` 删除（`fs.rm` 递归删目录）                                      |
| [api/admin/upload-image/route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/admin/upload-image/route.ts)                               | 站长图床代理：`requireAdmin()`→转调 ImgURL 上传→**无限流**（站长独立额度不计入用户限额）                                           |

#### D4. 通用后台组件（admin 目录，投稿/站长共用）

| 文件                                                                                                                | 功能                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [admin/post-form.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/admin/post-form.tsx)           | 通用文章表单（多态 Props）：`initialData?`、`validationSchema?`（Zod Schema 任意）、`uploadEndpoint?`（不同上传 API）、`uploadHint?`、`submitEndpoint?`、`hiddenFields?: Array<"draft"\|"publishedAt"\|"originalCreator"\|"sourcePlatform"\|"sourceUrl">`、`pageTitle?`、`submitButtonText?`、`successRedirect?`。内部包含：标题(max120)/简介(max300)/类型(枚举)/标签(可增删，单标签 max20，最多 8)/图片上传器/视频类型切换时 BV 号输入（附 iframe 预览） + originalCreator/sourcePlatform(sourcePlatformEnum)/sourceUrl + publishedAt 日期 + draft 草稿 + MDX 编辑器（原文/预览 Tab 切换）。提交时按 validationSchema 校验（含 refine），成功后按 successRedirect 跳转。 |
| [admin/image-uploader.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/admin/image-uploader.tsx) | 图片上传器（可配 uploadEndpoint/hint）：`<input type="file" accept="image/*">` → 用 FormData 发 uploadEndpoint → 返回 ImgURL URL push 进数组；缩略图网格 + 删除按钮 + 排序；底部中文提示「图片将上传至 ImgURL 图床（每用户每日 3 / 全站每日 8）」                                                                                                                                                                                                                                                                                                                                                                      |
| [admin/mdx-editor.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/admin/mdx-editor.tsx)         | MDX 编辑器：「编辑 / 预览」Tab 切换；`textarea` 支持换行；预览 Tab 内用 `compileMdx` + `<MDXRemote>` 渲染（需配合 `@next/mdx`，降级时展示 HTML 原文）                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| [admin/bv-input.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/admin/bv-input.tsx)             | BV 号输入框：输入时正则 `^BV[a-zA-Z0-9]{10}$` 校验提示；有效值时下方实时显示 `<BilibiliEmbed>` 预览（iframe 嵌入）                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

#### D5. lib 工具函数（5 个新增）

| 文件                                                                                                                             | 功能                                                                                                                                                                                                                                                                                                         |            |                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [lib/admin.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/admin.ts)                                                 | `requireAdmin()`：`auth()`→未登录返回 401 NextResponse→session.user.id !== ADMIN\_USER\_ID 返回 403 中文错误→否则 `return { error: null, session }`。所有 `api/admin/*` 和 `api/moderation/*` 第一行调用。                                                                                                                         |            |                                                                                                                                                                     |
| [lib/upload-rate-limit.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/upload-rate-limit.ts)                         | 进程内图片上传限流（Map<日期用户, 计数> + Map<日期, 全站计数>；UTC 统一切日）：`USER_DAILY_LIMIT = 3; SITE_DAILY_LIMIT = 8`；`canUploadToday(userId): boolean`；`recordUpload(userId)` 双计数+1；`getUserTodayUploadCount / getSiteTodayUploadCount / _resetForTests()`。**Netlify Serverless / Vercel Edge Function 每个实例独立内存，多实例可能略超限额**；未来可替换 Redis / Upstash / Netlify KV / Vercel KV 持久化（Upstash 跨两家平台共用）。           |            |                                                                                                                                                                     |
| [lib/slugify.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/slugify.ts)                                             | `slugifyWithSuffix(title: string, suffixLen = 4): string`：中文转拼音（简化版 `toLowerCase().replace 空格连字符 → ^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$` 正则 SLUG\_REGEX 约束）→ 末尾追加 `-${随机hex后缀}`（默认 4 字符，审核投稿端冲突重试时传 8）。保证 slug 3\~60 字符、首尾非连字符。                                                                               |            |                                                                                                                                                                     |
| [lib/posts-io.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/posts-io.ts)                                           | `createPostMdx(meta: PostMeta & { slug }, content: string)`：生成 `YYYY-MM-DD-slug` 目录名→slug 防重时自动追加 suffix→`mkdir(dir)`→写 `index.mdx`（gray-matter `stringify` frontmatter + MDX 正文）→调用 `revalidatePath('/')` / `revalidatePath('/post/[slug]', 'layout')` 刷新 Next.js 缓存；返回 `{ slug, dirPath, frontmatter }`。 |            |                                                                                                                                                                     |
| [lib/validators/submit-post-schema.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/validators/submit-post-schema.ts) | 用户投稿 Zod schema：与站长 postMetaSchema **字段限制完全对齐**（title 1-120 / description 1-300 / tags max 8 / images max 20）；`type` 只开放 \`illustration                                                                                                                                                                    | screenshot | video`三种；originalCreator / sourcePlatform / sourceUrl / slug`optional`；`.superRefine\`：① video 类型必须带 BV\_REGEX videoId；② 非 video 类型 images 至少 1 张；并对应「插画/截屏」两种错误文案。 |

#### D6. 测试基础设施（3 个测试文件 + vitest.config）

| 文件                                                                                                                 | 用例数 | 覆盖点                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------ | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [vitest.config.ts](file:///C:/Users/29942/Desktop/daniya-fansite/vitest.config.ts)                                 | —   | environment: jsdom；plugins: viteTsconfigPaths()（识别 `@/` 别名）；setupFiles 暂未配置，默认直接测试                                                                                                                                                                       |
| [tests/admin-guard.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/admin-guard.test.ts)               | 5   | `requireAdmin()` 模拟：① 未登录 → 401；② 非 admin 用户 → 403；③ admin 用户 → 返回 session；④ ADMIN\_USER\_ID 未设置时行为；⑤ 多个连续调用不会状态污染。                                                                                                                                      |
| [tests/submit-post-schema.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/submit-post-schema.test.ts) | 12  | 5 组 describe：基础字段（title 长度/description 长度/type 枚举含 screenshot 拒 comic）；tags（空数组/8 通过 9 拒/单标签 1-20）；images\&video 互斥（非 video 至少 1 / video 必须 BV10 位 / images max20）；可选来源字段（sourceUrl 合法 URL / originalCreator 长度 1-60）；可选 slug（符合 kebab 3-60 / 大小写中文下划线拒） |
| [tests/upload-rate-limit.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/upload-rate-limit.test.ts)   | 9   | 3 组 describe：基础（0 张可传 / 3 张用户满 / 8 张全站满）；多用户隔离（用户 A 3 张不影响 B / A 与 B 合计 8 张触发全站）；重置（\_resetForTests 清计数后恢复 0）                                                                                                                                            |

***

## 手动更新记录（7月2日 · 第二波：账号密码注册登录体系重构 — 6 新增 + 9 删除 + 7 处修改 + 3 项配置）

> 账号体系**从 4 种登录方式精简为 1 种**：旧 GitHub/QQ OAuth + 邮箱 Magic Link + 手机短信验证码 → 新 **Credentials 用户名+密码（bcrypt 哈希）+ Canvas 图形验证码 + 注册页/注册 API + 头像上传对话框**。
>
> 此章节记录的是**在上一章「19 个文件 + 37 个新增」基础上的增量改动**，合计 **22 处变更**。

### A. 基础设施 & 配置层（3 项）

#### A1. package.json — 新增 bcryptjs（密码哈希）+ 类型

- **dependencies 新增 1 包**：`bcryptjs@^3.0.3`（密码加盐哈希与校验，salt 10 轮）
- **devDependencies 新增 1 包**：`@types/bcryptjs@^2.4.6`（bcrypt 类型）
- **nodemailer 仍保留**（dependencies + @types/nodemailer），但邮件发送工具 `src/lib/email.ts` 已删除（留待未来可恢复）
- 原 `@testing-library/*` + vitest + jsdom（即上一章 A1 记录的）保持不变
- **文件**：[package.json](file:///C:/Users/29942/Desktop/daniya-fansite/package.json#L1-L54)

#### A2. prisma/schema.prisma — User 模型新增「用户名 + 密码哈希」核心字段

- **新增 2 个必填字段**：
  - `username String @unique` — 账号密码登录用的唯一用户名（正则：中/英/数/下划线，2-10 字符）
  - `passwordHash String?` — bcrypt 10 轮盐哈希后的密码（User.create 时必填；字段允许 nullable 是为保留未来 OAuth 关联账号无密码的场景）
- **原有保留**：`name? / email? / image?`（注册时 `name=username`；头像通过 `/api/user/profile` PATCH 更新 image）
- **关联保留**：accounts / bookmarks / postLikes / pendingPosts（不变）
- **VerificationToken 保留**（Auth.js 未来扩展性，未删除）
- **文件**：[schema.prisma](file:///C:/Users/29942/Desktop/daniya-fansite/prisma/schema.prisma#L42-L62)（User 模型）

#### A3. next.config.mjs — 追加 B 站封面图 CDN 白名单

- 在原 `s3.bmp.ovh`（ImgURL）+ 3 条 SM.MS(legacy) 基础上，**新增第 5 条 remotePatterns**：
  ```
  { protocol: "https", hostname: "api.bilibili.com" }  // B站封面图
  ```
- 配合 `BilibiliEmbed`（BV号 iframe 组件）展示 B 站视频封面时 `next/image` 不报安全错误
- **文件**：[next.config.mjs](file:///C:/Users/29942/Desktop/daniya-fansite/next.config.mjs#L1-L20)

#### A4. .env.example — 删除 3 类旧配置（QQ OAuth / SendCloud / 腾讯云短信）

- 之前 README「环境变量配置」章节里还存在的 QQ / 邮箱 / 短信 相关配置项（`AUTH_QQ_ID` / `AUTH_QQ_SECRET` / `SENDCLOUD_*` / `TENCENT_*`），`.env.example` 已全部删除
- 现在 .env.example 只保留 **5 项**：AUTH\_SECRET / DATABASE\_URL / DIRECT\_URL / ADMIN\_USER\_ID / IMGURL\_UID+TOKEN
- 对应旧待办清单 3 项的代码与配置文件同步清除

***

### B. 认证体系（最大变更：删 9 旧 + 新增 6 + 1 重写 + 1 重构）

#### B1. src/auth.ts — 完整重写：4 Providers → 仅保留 Credentials

- **全部移除的 Providers**：GitHub OAuth、QQ OAuth、Email Magic Link、SMS 短信验证码
- **保留/新增**：
  - `Credentials` provider：
    - credentials：`username(text)` + `password(password)`
    - `authorize()` 流程：`findUnique({ username })` → `verifyPassword()` → 返回 `{ id, name, email, image }`，无 null 统一失败
  - **pages.signIn = "/login"**（自定义登录页，不使用 Auth.js 默认页）
  - **session.strategy = "jwt"**（Credentials provider 强制需要 JWT 策略）
  - **jwt callback**：把 `user.id` 塞进 token（`token.userId = user.id`）
  - **session callback**：从 token 中取 userId（或 sub 兜底）→ `session.user.id`；再从数据库按 id 查一次最新 image → 同步到 `session.user.image`（**保证每次会话请求都返回用户刚换的新头像**，不被 JWT 静态快照过期卡住）
- **文件**：[auth.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/auth.ts#L1-L70)

#### B2. 删除 9 个旧多方式登录相关文件

| 分类          | 被删除文件                                                                                                          | 删除原因                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 登录 UI       | [login-tabs.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(auth\)/login/login-tabs.tsx)          | 原 Tab 切换 GitHub/QQ/邮箱/手机 4 Tab 组件 → 登录页改为单 LoginForm            |
| 登录表单 × 3    | [email-login-form.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/auth/email-login-form.tsx) | 邮箱 Magic Link 登录表单 → 代码清理                                       |
| 登录表单 × 3    | [oauth-buttons.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/auth/oauth-buttons.tsx)       | GitHub/QQ 两个 OAuth 大按钮 → 代码清理                                   |
| 登录表单 × 3    | [phone-login-form.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/auth/phone-login-form.tsx) | 手机验证码登录表单 + 倒计时 → 代码清理                                          |
| QQ Provider | [qq-provider.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/auth/qq-provider.ts)                    | 自定义 QQ OAuth 2.0 Provider（Auth.js 官方无）→ 不再需要                    |
| 发送工具 × 2    | [email.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/email.ts)                                     | SendCloud 邮件 API 调用封装（Magic Link 发送）→ 不再需要                      |
| 发送工具 × 2    | [sms.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/sms.ts)                                         | 腾讯云短信 SDK 调用封装（6 位验证码发送）→ 不再需要                                  |
| 发送限流        | [rate-limit.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/rate-limit.ts)                           | 短信/邮件发送防刷内存限流（注意：**不是 upload-rate-limit 投稿图片限流**！投稿的那个保留）→ 不再需要 |
| API Route   | [send-sms/route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/auth/send-sms/route.ts)          | 手机验证码 POST 发送路由 → 不再需要                                          |

#### B3. 新增 6 个注册/登录/验证码/密码组件与工具

| 文件                                                                                                                               | 说明                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [src/lib/password.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/password.ts)                                         | bcryptjs 封装：`hashPassword(password)`（salt 10 轮） / `verifyPassword(password, hash)` → 供 auth.ts authorize + /api/auth/register 调用                                                                               |
| [src/app/(auth)/login/register/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(auth\)/login/register/page.tsx) | **注册页面**：服务端守卫已登录重定向；max-w-sm 卡片；标题 2xl；`<RegisterForm/>`；底部"已有账号？去登录 /login 链接"                                                                                                                               |
| [src/app/api/auth/register/route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/auth/register/route.ts)           | **注册 API POST**：请求体 JSON → 校验 username（正则 `[\w一-鿿]{2,10}`，409 用户名已被注册）+ password ≥6 → `hashPassword()` → `prisma.user.create({ username, name: username, passwordHash })` → 返回 `201 { success: true, userId }` |
| [src/components/auth/login-form.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/auth/login-form.tsx)           | **登录表单（客户端）**：用户名/密码/`<Captcha>` 图形验证码（前后端双重校验，大写忽略）→ `signIn("credentials")` redirect=false → 错误统一中文：CredentialsSignin → "用户名或密码错误" / 其他错误直显；成功 `window.location.href="/"`                                    |
| [src/components/auth/register-form.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/auth/register-form.tsx)     | **注册表单（客户端）**：用户名（正则 2-10）/密码 ≥6 /确认密码 / 图形验证码 → fetch /api/auth/register 成功后自动 signIn credentials → 跳 /                                                                                                       |
| [src/components/auth/captcha.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/auth/captcha.tsx)                 | **Canvas 手绘图形验证码**：4 位随机字符（排除 I/O/0/1 易混），画布 110×38，背景浅灰 + 30 噪点 + 3 干扰线 + 字符随机旋转±0.4 弧度 + 每位深色随机颜色；`forwardRef<CaptchaHandle>({refresh})`；`onChange(code)` 回调；点击画布可刷新；组件 useEffect 首次挂载回调父组件 setCaptchaCode   |

#### B4. login/page.tsx — 重构（旧 4 Tab → 新简洁单表单 + 跳转注册）

- 登录守卫（已登录→/）保留
- 结构：`max-w-sm` 卡片 → 标题 "登录达妮娅的瞌睡小屋" → `<LoginForm />` → 底部 "还没有账号？去注册 /login/register 链接"
- 彻底删除 `<LoginTabs />`（4 Tab 切换）
- **文件**：[login/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(auth\)/login/page.tsx#L1-L37)

***

### C. UI 组件层 & Dashboard（5 处新增/重构）

#### C1. src/components/ui/dialog.tsx — 新增 Radix 风格自制 Dialog 复合组件

- **5 个具名导出**：
  - `Dialog`（根组件，Context 提供 open/setOpen，支持受控 `open+onOpenChange` 与非受控两种模式）
  - `DialogTrigger`（forwardRef，点击开弹窗，cursor:pointer）
  - `DialogContent`（`createPortal` 到 `document.body`；open 时 `document.body.style.overflow = "hidden"` 防止背景滚动；Esc 关闭；遮罩 `bg-black/50 backdrop-blur-sm`；面板 `max-w-md rounded-xl border bg-card p-6 shadow-lg`；`useEffect mounted` 避免 SSR 时 `document is not defined`）
  - `DialogTitle`（h2，text-lg font-semibold）
  - `DialogDescription`（p，text-sm muted）
- 使用 `@/lib/utils` 的 `cn()` 合并 class（与项目其他 UI 组件保持一致）
- **文件**：[dialog.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/ui/dialog.tsx#L1-L143)

#### C2. 新增头像上传功能（1组件 + 1 API）

| 文件                                                                                                                     | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [avatar-upload-dialog.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/auth/avatar-upload-dialog.tsx) | 更换头像对话框：Dialog Trigger `<Button variant=outline size=sm>「更换头像」</Button>` → DialogContent 中展示当前 Avatar（24×24）+ `<input type=file hidden accept=image/*>` + `<Button variant=outline>「选择图片」(lucide Upload icon)` → 选图校验（必须 image/\* + ≤5MB）→ URL.createObjectURL 预览 → **两步上传**：① `POST /api/user/upload-image` 走用户额度的 ImgURL 上传 → 返回 ImgURL CDN URL；② `PATCH /api/user/profile { image: url }` 写数据库 → `onImageUpdated(url)` 回调 → `router.refresh()` 刷新服务端组件 |
| [api/user/profile/route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/user/profile/route.ts)           | 【**新增的用户 API，上一章手动记录里漏掉**】PATCH /api/user/profile：`auth()` 会话（非登录 → 401 中文 "请先登录"）→ body JSON 仅接受 `image` 字段（string 校验，400）→ `prisma.user.update({ image: image ?? null })` → 返回 `{ image }`。配合 auth.ts session callback 每次从数据库查 image → 换头像后所有页面用户头像立即可见                                                                                                                                                                                                 |

#### C3. dashboard/settings/page.tsx — 重构（UI 组件化 + 新增更换头像入口）

- 旧版本：简单纯文本展示
- **重构后**：分 2 section
  1. **基本信息**：p-4 rounded-lg 卡片 → 左侧 `Avatar h-12 w-12` + 中部「用户名 / 邮箱」文本 → 右侧 `<AvatarUploadDialog>` 按钮 "更换头像"
  2. **账号操作**：退出登录（红色边框 link → /api/auth/signout）
- 使用 `@/components/ui/*` 3 个组件：`Avatar` + `Separator` + `Button`（AvatarUploadDialog 内部用）
- 顶部保留异步 `auth()` 获取 session + user
- **文件**：[settings/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/settings/page.tsx#L1-L62)

#### C4. dashboard/page.tsx（概览页）— UI 组件化（Avatar + Card）

- 结构保留：用户信息卡片 + 收藏/点赞 2 统计卡片 + 绑定账号展示区
- 变更点：
  - 用 `Avatar` + `Card/CardHeader/CardContent` 替换原生 div/img
  - 保留 `linkedProviders` 数组（GitHub/QQ/邮箱 3 项，虽然对应 provider 代码已删除，**但展示层保留"未绑定"状态不报错**；原样保留不修改）
  - `userRecord?.accounts?.map(a => a.provider)` 对应 `Account.provider` 字段存在（OAuth 未来可扩展）
- **文件**：[dashboard/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/page.tsx#L1-L118)

#### C5. user-menu.tsx — Avatar 组件替换原生 img

- 旧：直接写 `<img>` 展示用户头像，无 fallback
- 新：用 `@/components/ui/avatar` 三件套（`Avatar` / `AvatarImage src={user.image}` / `AvatarFallback {initials}`）→ 头像加载失败时显示首字母缩写
- 菜单项不变（个人中心 → /dashboard；我的收藏 → /dashboard/bookmarks；退出登录 → /api/auth/signout）
- **文件**：[user-menu.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/auth/user-menu.tsx#L1-L94)

***

### D. 确认未变更（避免重复记录）

- `src/app/page.tsx`（Hero Banner 三列布局 + 角色胶囊 4 段）→ 与上一章 B1 记录一致，**未变**
- `src/lib/posts.ts`（`getAllPosts({ includeDrafts })`）→ 与上一章 C2 一致，**未变**
- `src/types/post.ts`（POST\_TYPES 7 种含 screenshot）→ 与上一章 C1 一致，**未变**
- `src/lib/validators/post-schema.ts`（postTypeEnum 含 screenshot）→ 与上一章 C1 一致，**未变**
- `src/components/post/post-type-badge.tsx`（screenshot variant secondary）→ 与上一章 C1 一致，**未变**
- `src/app/globals.css`（`.surface-pink` 双主题）→ 与上一章 B2 一致，**未变**
- `src/components/layout/header.tsx`（投稿胶囊按钮）→ 与上一章 B3 一致，**未变**
- `proxy.ts`（matcher 含 `/api/admin/*`）→ 与上一章 A2 一致，**未变**
- `content/posts/2026-06-20-sample-illustration/index.mdx`（ImgURL 图床 frontmatter）→ 与上一章 C4 一致，**未变**

***

## 手动更新记录（7月2日 · 第三波：Dashboard 个人中心整合 · 方案 A）

> 需求：①删除 `/dashboard` 概览页底部"绑定账号"展示区；②把「账号设置」「作品管理」两块内容**整合到概览页**（方案 A — 保留原独立页面做深链兼容，但侧边栏菜单项移除）。
>
> 变更合计：**1 个新增测试文件 + 2 个源文件改造**；验证结果「4 files / 38 passed / 0 errors / 39 pages 生成成功」。

### A. 改造范围（2 源文件 + 1 测试）

| 类型          | 文件                                                                                                                                       | 变更                                                                                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 源文件（layout） | [src/app/(dashboard)/layout.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/layout.tsx#L23-L35)                 | 侧边栏 `sidebarLinks` 删除 2 菜单项：`/dashboard/settings 账号设置`（普通用户）+ `/dashboard/posts 作品管理`（站长追加）；保留：概览 / 我的收藏 / 投稿审核（站长追加）                                                                                                                                                 |
| 源文件（概览页）    | [src/app/(dashboard)/dashboard/page.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/\(dashboard\)/dashboard/page.tsx#L1-L201) | ①删除「绑定账号」section + 关联查询（accounts.provider）/ linkedProviders / linkedMethods；②整合账号设置 2 section（基本信息 + AvatarUploadDialog 换头像 / Separator / 账号操作-退出登录）；③站长专属新增「作品管理快捷操作」3 Card 网格（新增作品 → /dashboard/posts-new / 管理作品 → /dashboard/posts / 投稿审核 → /dashboard/moderation） |
| 测试文件（新增）    | [tests/dashboard-layout.test.ts](file:///C:/Users/29942/Desktop/daniya-fansite/tests/dashboard-layout.test.ts#L1-L93)                    | **TDD 源码结构断言（2 describe × 13 cases）**：sidebar 4 case（含概览+收藏/保留投稿审核/删除账号设置/删除作品管理）；概览页 9 case（删除绑定账号×2 / 基本信息+AvatarUploadDialog+Separator+账号操作+退出链接 / 作品管理快捷操作+3跳转入口+isAdmin 守卫）                                                                                      |

### B. 删除内容 — 绑定账号区域（原 L91-L115）

```diff
-  // prisma.user.findUnique 中删除 select.accounts.provider
-  // 删除 const linkedProviders / const linkedMethods
-
-  {/* 账号绑定 */}
-  <div className="mt-8">
-    <h3>绑定账号</h3>
-    <div className="space-y-2">
-      {linkedMethods.map((m) => (
-        // GitHub / QQ / 邮箱 3 行，显示 已绑定 / 未绑定
-      ))}
-    </div>
-  </div>
```

### C. 新增内容 — 概览页整合

#### C1. 账号设置（所有登录用户可见）

```
Separator my-8
  ↓
section「基本信息」：p-4 卡片 → h-12 w-12 Avatar + 名称/邮箱 flex-1 + AvatarUploadDialog 更换头像
  ↓
Separator my-6
  ↓
section「账号操作」：退出登录 红色边框 Link → /api/auth/signout
```

#### C2. 作品管理快捷操作（仅 `isAdmin = (user.id === process.env.ADMIN_USER_ID)` 守卫）

```
Separator my-10
  ↓
section「作品管理快捷操作」：grid 1/3 columns
  ├─ Card①「新建 新增作品」 →  /dashboard/posts/new   （MDX 编辑器 + 图床代理）
  ├─ Card②「列表 管理作品」 →  /dashboard/posts       （搜索/分页/状态过滤）
  └─ Card③「审核 投稿审核」 →  /dashboard/moderation   （PendingPost 通过/驳回）
```

### D. 保留说明（深链兼容）

- **原独立页面路由保留**：`/dashboard/settings` 页面、`/dashboard/posts` 系列（new/\[slug]/edit 三页）**代码文件未删除**，仍可通过 URL 直接访问，兼容历史书签 / 深链 / 缓存链接。
- **build 路由表 39/39 全部生成成功**（L393 验证）。

***

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm start            # 启动生产服务器
npm test             # 运行单元测试（vitest run，单次执行）
npm run test:watch   # 单元测试 watch 模式
npx prisma studio    # 打开数据库管理界面
npx prisma db push   # 同步数据库 schema
npx prisma generate  # 重新生成 Prisma Client（schema 改动后执行）
```

***

## 设计理念

- **微博风格信息流**：窄内容区（max-w-2xl），卡片式布局，图片在上文字在下
- **出处标注优先**：每篇作品必须标注原作者名、来源平台和原帖链接，暖金色突出展示；角色归属（目前 DANIYA 单值，OTHER 占位预留给后续扩角色）用 `character Character enum` 在 schema + Zod + UI 三处统一
- **暗/亮双主题**：默认「星空泡泡」暗色主题呼应鸣潮 UI；亮色主题使用白日粉白星尘 + 50% 粉色毛玻璃 Header/Footer/信息流表面；全站文字色一律使用 `text-[var(--foreground)] / text-[var(--muted-foreground)]` CSS 变量，**禁止硬编码** **`text-pink-*`** **类**，避免粉色背景上文字过淡
- **图片外链化 + 代理层抽象**：作品配图使用 ImgURL 图床外链，视频使用 B站 BV 号 iframe 嵌入，仓库不存储媒体文件；统一上传代理屏蔽图床实现细节
- **Hero 响应式三列布局**：桌面端 flex + sticky 滚动 + mask 渐变虚化左右装饰图；手机端隐藏侧边图；Banner 内部拆分为角色胶囊 + 标题胶囊 + 筛选标签三层胶囊结构
- **后台 CRUD + 权限守卫**：MDX 从手动写文件扩展到后台可视化编辑，Auth 中间件 + 管理员校验双锁，图床切换不影响前端
- **用户投稿 + 人工审核双页闭环**：开放登录用户投稿入口 → `/submit` 投稿（含今日额度实时刷新 + 限流）→ 写入 PendingPost → 站长审核通过/驳回 → 用户在「我的投稿 4 Tab」查看状态 → \*\*点卡片进入投稿预览独立路由 `/dashboard/submissions/[slug]`（方案A）\*\*查看详情/驳回理由/修改后重提；非 APPROVED 稿件锁定点赞/收藏/评论，通过后在正式页 `/post/<slug>` 汇总互动
- **ImgURL 免费版限流保护**：用户上传图片共用站长免费账号的 UID/TOKEN，实施「单用户 3 张/日 + 全站 8 张/日」双层限流，防止免费额度被耗尽导致站长本人无法发文
- **权限分级 + 防枚举**：Dashboard 侧边栏根据 `ADMIN_USER_ID` 动态生成；普通用户「概览/收藏/我的投稿」，站长额外「投稿审核」；敏感 API 均有 `requireAdmin()` 兜底；投稿预览页非本人非管理员一律 `notFound()`（不给 403），避免通过 URL 枚举 slug 是否存在
- **登录体验分级**：密码错误 → 通用「用户名或密码错误」红色提示 + 验证码刷新；未注册用户 → `authorize()` 抛 `USER_NOT_REGISTERED` → 前端**居中强制 Dialog**，只能点「确认」或 X 关闭（禁止遮罩/Esc 关闭），防止用户混淆
- **用户反馈全链路全局弹窗（方案 B StatusModal Context）**：上传成功/失败、投稿成功/失败（A-1 错误分级 GREEN/YELLOW/RED，RED 级错误隐藏技术细节统一替换「系统维护中…」）、投稿成功 onDismiss 跳「我的投稿」—— 任何时候都不要在按钮下方用红色内联小字显示错误，**统一屏幕居中彩色边框弹窗**
- **受控组件单一原则**：所有 `<select>` / `<input>` 只允许一种受控模式——要么 `value`（配合 `useState` 完全受控）要么 `defaultValue`（非受控），**禁止两者同时存在**；提交表单受控 props 冲突会触发 React mixed controlled/uncontrolled warning（见第十三波受控 select 修复记录）
- **TDD 源码结构断言优先**：功能开发一律「先写 vitest cases → failing → 实现 → passing → 全量回归」，避免 UI 功能回归；对视觉体验类（角色页/倒计时/播放器面板/弹窗）使用源码结构断言（import fs 读取源码 grep regex），不依赖 jsdom 渲染减少测试耗时
- **音乐播放轻量无侵入**：音乐播放器挂载在 Header 所有页面可触达，但默认不自动播（遵守浏览器自动播放策略）；播放中图标高亮 animate-pulse 呼吸灯；方案3 **HoverCard 悬停展开面板**（`openDelay=80ms / closeDelay=200ms` 双延迟防闪烁）+ **点击只切播放/暂停** 解耦，面板开合完全交给 hover，不干扰页面滚动与表单输入；移动端保留 click 触发 fallback；音频资源存于 `public/music/` 目录与图床外链彻底分开，避免加载受 CDN 影响
- **AI 聊天 5 层安全拦截铁序**（严格按顺序执行，任何一层命中立即 return，避免进入 LLM 烧钱）：① **身份层** — 未登录 → 401 + 居中红色弹窗「该功能仅登录用户可用」，未登录点 FAB 绝不展开 Dialog ② **长度层** — 输入 > 200 字 → 400「消息过长」③ **合规层** — 6 大类关键词正则（自杀自残/毒品/赌博/色情/枪支恐怖/传销诈骗）→ 400「内容违规」④ **成本层** — 登录用户级 + 全站级日调用限流（接真模型时启用，目前 PRESET\_REPLIES 占位限流已预埋）⑤ **长度输出层** — 回复 ≤ 30 字符越短越好；接入真模型前统一占位语「该功能还在测试中QAQ」（TEMP 注释标注）
- **AI 聊天前端渐进式**：右下角 FAB 悬浮毛玻璃 + 粉气泡光晕浮动按钮；Vercel AI SDK `useChat` Hook + SSE 流式打字机效果；后端代理 `/api/chat/route.ts` 屏蔽 API Key，前端永远看不到 AstrBot / DeepSeek Token；切换真模型时只改 route.ts 内部 fetch 地址，FAB 组件零修改
- **版权尊重**：About 页面明确声明所有权利归原作者，提供邮箱/GitHub/B站 三个下架联系渠道；投稿被驳回时必须填写理由，便于用户理解审核标准

