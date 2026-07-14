# 达妮娅的瞌睡小屋

> 《鸣潮》角色「达妮娅」同人二创作品 curation 站点
>
> 微博风格卡片信息流，精选搬运优质二创，标注原作者与出处
>
> 🔗 主站 [daniya-fansite.netlify.app](https://daniya-fansite.netlify.app) · 备用 [daniya-fansite.vercel.app](https://daniya-fansite.vercel.app)（Vercel 有免费额度，可以实时更新）

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
| 🤖 AI 聊天 | **达妮娅 AI 对话 · 双轨方案（默认免费 + 用户自费）**（[daniya-chat-fab.tsx](file:///C:/Users/29942/Desktop/daniya-fansite/src/components/shared/daniya-chat-fab.tsx) + [route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/chat/route.ts) + [test-connection/route.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/app/api/chat/test-connection/route.ts) + [custom-ai-config.ts](file:///C:/Users/29942/Desktop/daniya-fansite/src/lib/custom-ai-config.ts)）：**轨道 A 默认模型**（智谱 BigModel `GLM-4.7-Flash`，永久免费，站长不花钱，baseURL `https://open.bigmodel.cn/api/paas/v4`，双轨都先过 L1~L3 拦截再过 L4 限流再调用）**+ 轨道 B 用户自定义**（本地 `custom-ai-config.ts` 存 baseURL + apiKey + model，任何 OpenAI 兼容协议即可，max_tokens 硬卡 150 防刷爆）；**5 层安全拦截铁序**（严格按序执行，任何一层命中立即 return 不触模型：① 登录 auth 401 + FAB 强制居中弹窗 ② 输入长度 ≤ 200 字 ③ 6 大类合规正则（自杀自残/毒品/赌博/色情/枪支恐怖/传销诈骗）双轨都生效 ④ 日限流 200 轮/用户/天，仅默认模式生效，自定义密钥模式 bypass ⑤ 调模型）；**人设注入**（route.ts 顶部 `DANIYA_SYSTEM_PROMPT` 常量，`sanitizeMessages()` 删用户传的所有 system/tool 消息再 `unshift` 唯一一条人设，前端不可见不可改不可关）；**FAB UI**（右下角浮动毛玻璃 + 粉光晕 + 登录态 Header 右侧 ⚙️ 齿轮按钮 + 居中 Settings Dialog 三字段 + 删除/测试/保存三按钮 + apiKey blur 掩码前 3 后 3 中间 `*` + 永不可回看明文）；**B1 协议识别**（`/api/chat/test-connection` 启发式 6 类：Claude 原生 / Gemini 原生 / api-key-invalid / openai-compatible / local-ollama-unreachable / unknown-non-openai，2s 超时，Ollama 检测给 cloudflared 1 命令教程）；**B2-X 零托管密钥**（localStorage AES-GCM-256 加密，HKDF 用 session token + `USER_KEY_ENCRYPTION_SALT` 派生 key，服务器 Edge 代理用完即丢不落日志不落 DB）；**SSRF 拦截**（拒绝 `localhost / 127.* / 10.* / 172.16-31.* / 192.168.* / 169.254.* / fc00:* / 0.0.0.0`，仅 Ollama 检测分支放行）；**成本保护**（默认模式智谱 fetch 遇 429/5xx/超时 3s，**重试 2 次** + 指数退避 500ms→1000ms，最终 fallback `PRESET_REPLIES[0]`「该功能还在测试中QAQ」占位 SSE 打字机，Header `X-Mock-Mode=true` + `X-Max-Tokens=50` 透传）；依赖 `@ai-sdk/react` + `ai` + `react-markdown` + `remark-gfm`；**6 env 变量**（`ZHIPU_API_KEY` / `ZHIPU_BASE_URL` / `ZHIPU_DEFAULT_MODEL` / `CHAT_DAILY_QUOTA_PER_USER=200` / `CHAT_MAX_OUTPUT_TOKENS=50` / `USER_KEY_ENCRYPTION_SALT`，缺一不可，ZHIPU_API_KEY 必须单独放 Vercel 面板）；**21 个 AI 聊天测试文件 / 75 cases 全绿**（旧 6 文件 22 cases + 新 11 后端 51 cases + 新 4 前端 24 cases） |
| 测试       | Vitest + @testing-library + jsdom（**46 个测试文件，340 passed / 1 todo**。覆盖：登录表单 8 / 未注册全局弹窗 8 / 角色页 17 / 头像裁剪 9 / 生日倒计时 13 / 投稿表单 7 / 全局弹窗 8 / 提交弹窗 14 / 投稿额度 8 / 投稿预览 13 / 我的投稿 11 / 投稿筛选 3 / schema角色 4 / 播放器基础 17 / **播放器HoverCard面板 20** / 评论守卫 7 / 评论 schema 4 / 仪表盘布局 19 / Header 8 / 主页 5 / 仪表盘管理 5 / next-config 安全头 11 / package-deps-cleanup 2 / README 角色一致性 4 / upload-rate-limit 9 / **AI 聊天 21 个文件（**旧 6 文件 22 cases**：`chat-fab-exists 1` / `chat-dialog-opens 2` / `chat-bubbles-render 3` / `chat-content-compliance 9` / `chat-short-response 4` / `chat-unauthenticated-block 4`；**新 11 后端 51 cases**：`chat-persona-injection 4` / `chat-default-provider-zhipu 6` / `chat-fallback-placeholder 4` / `chat-daily-quota-200 5` / `chat-compliance-custom-mode 4` / `chat-ssrf-block 7` / `chat-protocol-detect 7` / `chat-custom-config-ssrf 2` / `chat-env-config-parse 6` / `chat-max-output-50 3` / `chat-dual-track-routing 5`；**新 4 前端 24 cases**：`chat-settings-gear 5` / `chat-api-key-masking 5` / `chat-localstorage-aesgcm 7` / `chat-connection-test-dialog 5` → 合计 **75 cases**）/ 等）。任何修改提交前必须跑 **三条铁律**：① `npm test` 全绿 ② `npx tsc --noEmit` 0 errors ③ `npm run build` 路由全部生成成功 |
| 部署       | Netlify / Vercel（双平台；Vercel 有免费额度可正常更新，Netlify 上传额度临时用尽）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

***

## 🚧 当前项目进度总览（截止 7月12日 · AI 双轨方案落地后）

> **阶段结论**：项目核心功能 + 体验优化**全链路打通并完成 22 波增量升级**（核心功能 1→13 波 · 功能增强 14→22 波）。**22 波（AI 双轨方案）核心交付完成**，原 AstrBot/DeepSeek 单轨旧方案正式废弃。
>
> **待完成仅剩 1 项低优**：🎵 音乐 track-2/3 封面+音频真实化。
>
> **最新关键里程碑（最新 4 波置顶）**：
>
> - 🤖 **第二十二波 · AI 聊天双轨方案（7月12日 · 核心）**：废弃 AstrBot/DeepSeek 单轨旧方案；**轨道 A 默认免费**（智谱 BigModel `GLM-4.7-Flash` 永久免费，站长不花钱）+ **轨道 B 用户自费**（本地 AES-GCM 加密存 baseURL/apiKey/model，服务器 Edge 用完即丢不落 DB）；**6 env 变量**（`ZHIPU_API_KEY` / `ZHIPU_BASE_URL` / `ZHIPU_DEFAULT_MODEL` / `CHAT_DAILY_QUOTA_PER_USER=200` / `CHAT_MAX_OUTPUT_TOKENS=50` / `USER_KEY_ENCRYPTION_SALT`）；**5 层安全拦截铁序**（①登录 → ②长度200字 → ③合规双轨 → ④日限流仅默认 → ⑤模型）+ **SSRF 拦截**（9 类内网段拒绝，仅 Ollama 检测放行）+ **B1 协议识别 6 类**（Claude/Gemini/api-key-invalid/openai-compatible/Ollama/unknown）+ **B2-X 零托管密钥**（localStorage AES-GCM-256 HKDF 派生 key）+ **人设注入不可见不可改**（`sanitizeMessages()` 删用户 system/tool 注入唯一 `DANIYA_SYSTEM_PROMPT`）+ **默认模式重试 2 次 + fallback 占位**（智谱 429/5xx 指数退避 500→1000ms，最终 `PRESET_REPLIES[0]`「该功能还在测试中QAQ」）；**FAB UI 升级**（Header 登录态 ⚙️ 齿轮按钮 `chat-settings-gear` + 居中 Settings Dialog + 三字段表单 + 删除/测试/保存三按钮 + apiKey blur 掩码前 3 后 3）；**新增 4 文件**（`/api/chat/test-connection/route.ts` + `src/lib/custom-ai-config.ts` + `tests/chat-protocol-detect.test.ts` 等 15 个新 tests）；**TDD 75 cases 新增全绿**，旧 22 cases 零回归；**21 个 AI 聊天测试文件 / 75 cases 全绿**
> - 🧹 **第二十一波 · 注释清扫方案 B（7月10日午后 · 约 65 条）**：🔴 4 条硬垃圾（void session / void Image / streamText 注释 / shouldManageState→isDirectCall）+ 🟡 \~61 条冗语（14 条分割线 + 40 条代码直译 + 7 条数组分组标签）；受影响 13 文件；**净减 54 行单行注释（296→242，约 -18%）**；TEMP/安全分层/业务决策/结构 JSDoc 100% 保留
> - 🔐 **第十九波 · 全站安全审计 A 级**：19 API 路由 100% 带权限守卫；真实密钥 git 追踪文件 0 泄漏；0 个客户端组件读 process.env 服务端密钥；bcrypt 10 轮 + JWT HttpOnly Cookie；仅 3 条低风险（middleware Host 校验 / 内存限流 Map 多实例 / 登录失败限流，均非安全漏洞）
> - 🧹 **第二十波 · L1 环境变量残留清理**：`.env` 物理删除 7 行（AUTH\_GITHUB\_ID/SECRET 2 条旧真实值 + 4 条 `NEXT_PUBLIC_GISCUS_*` 已废弃占位符 + 2 条注释）；`.env.local` 原本干净 0 改动；其他代码零触碰
> - 📄 **第十八波 · README 双域名 & 全链路同步**：新增 daniya-fansite.vercel.app 备用域名 5 处同步（外链徽章 / 部署行 / AUTH\_URL 注释 / 限流 Netlify|Vercel 双写 + KV 推荐 / D5 手动记录一致）
> - 🤖 **第十七波 · 达妮娅 AI 聊天 UI**（**已被第二十二波双轨方案扩展落地**）：右下角 FAB + 居中 Dialog + Vercel AI SDK SSE 流式打字机；**5 层安全拦截铁序**；新增 4 包（`@ai-sdk/react` / `ai` / `react-markdown` / `remark-gfm`）；6 个 chat 测试文件 22 cases 全绿（**注：原占位语「该功能还在测试中QAQ」仍保留，作为默认模式 429/5xx 重试 2 次失败后的最终 fallback 占位**）
> - 🎵 **第十六波 · 音乐 HoverCard 悬停展开（方案3）**：Popover → **HoverCard**（`openDelay=80ms / closeDelay=200ms` 双延迟）；**点击只切播放/暂停** 解耦；新增 `@radix-ui/react-hover-card` + hover-card.tsx；18 cases TDD
> - 🎵 **第十五波 · 音乐播放器方案2 Popover 面板**：封面+歌名+三控制+音量+进度条；track-1 真实化音频+封面
> - 🦸 **第十四波 · Character enum 角色字段**：`enum Character { DANIYA }`（OTHER 占位预留给后续扩角色）；Post/PendingPost 两模型 `character? Character?` nullable 无默认；前后端 Zod schema 两处 nullable/optional；下拉 UI + 预览 badge；4 cases TDD
>
> **构建验证（最新 · 7月12日 AI 双轨方案落地后回归）**：`GetDiagnostics 0 errors` · `TypeScript 0 errors`（tsc --noEmit 空输出）· 路由全部生成成功 · **46 files / 340 passed / 1 todo**（AI 聊天 21 文件 75 cases 全绿 + 旧 265 cases 零回归）

### 📅 历次迭代速览（1→13 波合并，详情见末尾「历次迭代速查表」）

| 阶段       | 日期         | 核心主题                                           | 交付要点                                                                                                                                                                                                                                 |
| -------- | ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 第一批      | 6月30日      | Hero + 媒体外链化                                   | Hero 响应式 fixed→flex 左右图；媒体 SM.MS→ImgURL 外链；3 张 Hero jpg 就位                                                                                                                                                                           |
| 第二批      | 7月1日       | UI 重构 + 后台 CRUD + 图床定型                         | Hero Banner 独立组件 + 暗/亮图自动切换；三列布局 sticky + mask；毛玻璃 `.surface-pink`；完整 Admin CRUD（Auth 守卫 + ImgURL 代理 + MDX 编辑）；图床最终 ImgURL                                                                                                           |
| 第三波（第一波） | 7月2日       | 用户投稿 + 人工审核整套                                  | PendingPost 三态模型；ImgURL 上传限流 3/日用户 + 8/日全站；`/submit` 投稿页；`/dashboard/moderation` 审核面板；权限分级 UI；Vitest 全家桶 3 文件起步；next.config 白名单；screenshot 作品类型全局统一                                                                                  |
| 第三波（第二波） | 7月2日       | 账号体系 4→1（用户名+密码）                               | Credentials Provider 唯一；bcryptjs salt 10；注册页 + 注册 API；Canvas 图形验证码（登录/注册双校验）；JWT 会话 + 每次从 DB 同步 image；AvatarUploadDialog 裁剪换头像；自制 Dialog 复合组件；next.config 白名单追加 B 站封面                                                                |
| 第三波（第三波） | 7月2日       | Dashboard 个人中心整合                               | 删除概览页绑定账号；侧边栏删除「账号设置/作品管理」；内容合并进 `/dashboard` 概览页；站长专属快捷 3 Card 网格；原独立路由保留深链；TDD 13 cases                                                                                                                                            |
| 第四波      | 7月2日 晚     | 自建评论系统（方案 C）                                   | Prisma Comment 模型 + 复合索引；Zod 1-1000；3 API（GET/POST list · DELETE 本人/站长）；前端组件（加载中/空态/气泡/删除按钮/字数计数）；前 `<GiscusComments />` 替换；2 测试文件 11 cases                                                                                          |
| 第五波      | 7月2日 22:00 | 冗余代码审计 12 项清理                                  | 删除孤儿 giscus.tsx；`.env.local` Giscus+OAuth 残留清；types/post.ts 删除 interface Post + PostMeta（唯一源改 lib/posts.ts）；posts.ts 删 getAllTags/getAllTypes；POST\_TYPES/SOURCE\_PLATFORMS 内部 const；明确不动 `_resetForTests` 和 ButtonProps 等 shadcn 惯例 |
| 第六波      | 7月2日 22:55 | 全局状态弹窗 StatusModal Context                     | 新建 Provider + Hook（showSuccess/showError）；layout 全局 wrap；ImageUploader 接入（成功居中绿边/失败居中红边）；删除上传失败按钮下红色内联小字；8 cases TDD                                                                                                                 |
| 第七波      | 7月3日 00:55 | 提交审核弹窗 + A-1 错误分级                              | StatusModal opts API 升级（autoClose + onDismiss）；classifySubmitError 三级关键词（GREEN 32 / YELLOW 8 / RED 16，系统级统一替换「系统维护中…」）；PostForm 接入 + 删 errors.\_form 顶部红条；成功 onDismiss 跳 `/dashboard/submissions`；14 cases TDD                       |
| 第八波      | 7月3日 08:22 | 投稿页「今日额度」卡片 + 实时刷新                             | submit/page 直读限流 Map 双进度条（全站主色/用户 emerald，零额度红字提示）；Server→Client boolean prop 序列化设计（refreshQuotaOnUpload→router.refresh）；ImageUploader 扩展 onUploadSuccess 回调；8 cases TDD                                                             |
| 第九波      | 7月3日       | 我的投稿页 + 取消/驳回重提                                | 侧边栏「我的投稿」菜单；4 Tab（全部/待审核/已通过/已驳回+数量徽章）；PENDING 取消投稿 Server Action（auth+本人+仅 PENDING 409 三重幂等）；APPROVED 外链正式页；REJECTED 驳回理由+修改重提（`/submit?resubmit=<id>` 回填 prefill，slug 强制 '' 防撞库）；11 cases TDD                                      |
| 第十波      | 7月3\~4日    | 角色页 + 生日倒计时 + 头像裁剪                             | `/character` 角色页 Hero 2 张真实立绘 + 档案卡 + 三 Tab 17 tests；birthday-countdown 7 状态动态文案 13 tests；react-easy-crop 头像裁剪画布 9 tests；暗/亮主题文字色全面 CSS 变量化                                                                                          |
| 第十一波     | 7月5日 上午    | 未注册用户登录专属弹窗                                    | `authorize()` 抛 `USER_NOT_REGISTERED` 区分密码错；LoginForm 新增 state + 强制 Dialog（仅 「确认」/「X」 两按钮可关，遮罩/Esc 丢弃 false）；验证码刷新+清空输入；8 cases TDD 更新                                                                                               |
| 第十二波     | 7月5日 下午    | 投稿预览独立路由 `/dashboard/submissions/[slug]`（方案 A） | 三层守卫（未登录 redirect / 不存在 notFound / 非本人非管理员 notFound 防枚举）；三态状态胶囊；状态横幅（APPROVED 绿边/其他锁互动）；REJECTED 驳回理由 + 重提链接；PostForm 成功 onDismiss 真实跳转 + 列表卡片预览胶囊；13 cases TDD                                                                      |
| 第十三波     | 7月5日 15:40 | 受控 select 冲突修复                                 | PostForm「关联角色」下拉删除 defaultValue="DANIYA"，state 初始化已保证默认选中；7 cases TDD                                                                                                                                                                |

### 📊 完成度统计（截止 7月12日 · AI 双轨方案落地后）

| 分类              | 已完成                                                                                                                                        | 待完成                                                                     | 已删除·不再需要                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | --------------------------- |
| 基础设施            | **9+4**（基础 9 + L1 环境残留 7 行清理 + 安全审计 A 级 + README 双域名 + 注释清扫 B）                                                                             | —                                                                       | —                           |
| UI & Hero & 主题  | **8+1**（基础 8 + src 13 文件注释清扫 -18%）                                                                                                         | —                                                                       | —                           |
| 后台 CRUD & 图床代理  | 2                                                                                                                                          | —                                                                       | —                           |
| 用户投稿 + 人工审核     | **18 项**（额度卡片+实时刷新+我的投稿4Tab+取消/重提+独立预览路由方案A）                                                                                               | —                                                                       | —                           |
| 账号体系            | 9 项（4 Provider→Credentials 唯一 + bcrypt + 注册 + 验证码 + JWT + 头像裁剪）                                                                            | —                                                                       | 5 项（GitHub/QQ/邮箱/SMS/旧短信限流） |
| 登录体验            | **4 项**（未注册 USER\_NOT\_REGISTERED 专属弹窗 + 强制 Dialog + 刷新 + 8 tests）                                                                         | —                                                                       | —                           |
| Dashboard 整合    | 6 项（侧边栏精简 + 概览页整合 + 站长快捷 3 Card + 深链兼容）                                                                                                    | —                                                                       | —                           |
| 评论（方案 C）        | 11 项（自建 Comment 模型 + 3 API + 前端组件 + 2 tests 11 cases）                                                                                      | —                                                                       | 1 项（Giscus 组件 + 4 条 env）    |
| 代码质量 & 冗余       | **12+3**（原 11 + select 冲突修复 + 安全审计 + 注释清扫 B + L1 变量残留）                                                                                     | —                                                                       | 2 项（giscus.tsx + 旧 env 残留）  |
| 🎵 音乐播放器（方案2→3） | 方案2 7 项 + 方案3 6 项（Popover→HoverCard + openDelay/closeDelay + 点击仅切播放）                                                                       | **1 项低优可选**（track-2/3 真实音频+封面）                                          | —                           |
| 🤖 AI 聊天（17→22波双轨） | **23+ 项**（**17 波 UI 8 项** + **22 波双轨 15 项** — 6 env 变量 + 智谱默认模型 fetch + 重试 2 次 + fallback 占位 + 自定义 baseURL+apiKey+model 路由 + 5 层拦截铁序 + SSRF 9 类拦截 + B1 协议识别 6 类 + B2-X AES-GCM-256 零托管密钥 + HKDF 派生 + 人设注入 sanitizeMessages + FAB 齿轮按钮 + 居中 Settings Dialog 3 字段 3 按钮 + apiKey blur 掩码前 3 后 3 + **15 新测试文件 75 cases**）                          | —                                                                       | 1 项（AstrBot 单轨 + DeepSeek V4 Flash + Prisma 聊天历史表） |
| 配置 & 上线         | 17+3 子项全 ✅（原 17 + **AI 双轨方案 6 env 变量 + 双轨路由 + fallback 占位保留** + 注释清扫 B 后续）                                                                 | —                                                                       | —                           |

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

编辑 `.env` 文件（复制 [.env.example](file:///C:/Users/29942/Desktop/daniya-fansite/.env.example) 为 `.env` 填写即可）：

```env
# 🔐 必配
# 1) Auth.js 密钥（生成：openssl rand -base64 32）
AUTH_SECRET="your-random-secret"
# 2) 站点 URL（双平台填主站域名即可；回调自动带 Referer；备用：daniya-fansite.vercel.app）
AUTH_URL="https://daniya-fansite.netlify.app"
# 3) Neon PostgreSQL（Pooled 运行时 / Direct 给 Prisma migrate）
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
# 4) 管理员用户 ID（查 User 表）—— /dashboard/* 权限
ADMIN_USER_ID=your-user-id
# 5) ImgURL 图床凭证（https://www.imgurl.org/vip/user 获取 UID + Token）
IMGURL_UID=your-uid
IMGURL_TOKEN=your-token

# ⚠️ 以下 Provider 代码已物理删除（账号体系仅 Credentials 用户名+密码），勿需配置：
# GitHub OAuth / QQ OAuth / SendCloud 邮件 / 腾讯云短信

# ============================================================
# 🤖 AI 聊天双轨方案（22 波落地，6 个 env 缺一不可）
# ============================================================
# 默认模型 L1 — 智谱 BigModel（轨道 A，站长不花钱，永久免费）
#   获取地址：https://open.bigmodel.cn  → 注册手机号 + 实名 → API Keys 新建
#   ⚠️ 安全：密钥只填 .env.local / Vercel Environment Variables，永远不要提交到 Git
ZHIPU_API_KEY="your-zhipu-api-key-xxxx.xxxx"
ZHIPU_BASE_URL="https://open.bigmodel.cn/api/paas/v4"   # ⚠️ 智谱兼容路径是 /api/paas/v4，不是 /v1
ZHIPU_DEFAULT_MODEL="glm-4.7-flash"

# 默认模型 L2 — 限流/输出长度（自定义密钥模式下不生效，用户自己掏钱无限流）
CHAT_DAILY_QUOTA_PER_USER=200   # 单用户日调用上限（默认模式）
CHAT_MAX_OUTPUT_TOKENS=50       # 单次回复最大 token（默认 ≤ 50；自定义模式硬卡 ≤ 150）

# 自定义密钥 localStorage AES-GCM HKDF salt（保持默认即可，多项目共用时才改）
USER_KEY_ENCRYPTION_SALT="daniya-custom-ai-v1"
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

1. 先用账号密码登录一次，让系统在数据库创建 User 记录
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

## 作品赏析

精选达妮娅同人二创作品，按发布日期倒序展示，卡片包含：缩略图 / 标题 / 简介 / 类型徽章 / 标签 / 出处标注（暖金色）/ 角色归属徽章 / 点赞收藏按钮。点卡片进入作品详情页，支持：图片网格 / B站视频 iframe / MDX 正文 / 出处标注区块 / 自建评论区。

首页筛选：类型胶囊（插画/截屏/漫画/视频/文章/COS/其他）+ 标签云 + 角色筛选 + 分页卡片流；搜索页 `/search` 关键词匹配 title/description/tags。

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
├── content/posts/             # 二创内容库（MDX，后台写入或手动）
├── prisma/schema.prisma       # User / PendingPost（character + rejectReason + publishedSlug）/ Comment / Account / Bookmark / PostLike / VerificationToken；enum Character { DANIYA }
├── public/                    # 静态资源（Hero 三张图 + Logo + 立绘）
│   └── music/                 # 站点背景音乐（ogg/mp3，歌单由 src/data/music-playlist.ts 管理）
├── src/
│   ├── data/music-playlist.ts # DANIYA_PLAYLIST 歌单（id/title/artist/src/coverUrl?；track-1 真实化，track-2/3 占位）
│   ├── app/                   # App Router 页面与 API
│   │   ├── layout.tsx         # 根布局（ThemeProvider + StatusModalProvider + Header/Footer + **全局挂载 DaniyaChatFAB**）
│   │   ├── page.tsx           # 首页（Hero 三列 + birthday-countdown + 分页信息流）
│   │   ├── globals.css        # 星空泡泡主题样式入口（surface-pink 双主题粉色毛玻璃）
│   │   ├── hero-banner.tsx / side-image.tsx / birthday-countdown.tsx
│   │   ├── (auth)/login/      # 登录（LoginForm + 未注册强制 Dialog）+ register 注册页
│   │   ├── (dashboard)/       # 个人中心：概览 / 收藏 / 我的投稿（4 Tab + 取消/重提）/ 投稿预览 [slug]（三层守卫+三态横幅）；站长额外：投稿审核 / 作品 CRUD（深链兼容）
│   │   ├── post/[slug]/page.tsx · type/[type] · tag/[tag] · character · about · search · submit
│   │   └── api/               # 21 条路由：auth（register/[...nextauth]）· bookmarks · likes · posts/[slug]/comments · comments/[id] · rss · search · **chat（5 层拦截 + 双轨路由 SSE + 智谱 fallback）** · **chat/test-connection（B1 协议识别 6 类）** · admin/*（posts + upload-image）· user/*（upload-image + submit-post + submissions/[id] + profile）· moderation/*（posts + [id]）
│   ├── components/            # 按功能分目录
│   │   ├── admin/             # PostForm（多态 props + 关联角色下拉）/ ImageUploader（uploadEndpoint + onUploadSuccess）/ MdxEditor / BvInput
│   │   ├── auth/              # LoginForm（未注册强制 Dialog）/ RegisterForm / Captcha / AvatarUploadDialog（裁剪+缩放+旋转）/ UserMenu / SignInButton
│   │   ├── comments/          # UserComments（加载/空态/气泡/删除/字数 X/1000）
│   │   ├── feed/ · interaction/ · layout/ · media/ · post/
│   │   ├── shared/            # ThemeProvider / ThemeToggle / **🎵 MusicPlayer（方案3 HoverCard）** / **🤖 DaniyaChatFAB（FAB+Dialog+SSE流式+齿轮设置+apiKey掩码+连接测试）**
│   │   └── ui/                # 自制 Dialog（5 具名导出）/ StatusModalProvider / Popover / HoverCard（音乐方案3）/ Button Card Badge Input Avatar Skeleton Separator Accordion Textarea …
│   ├── lib/                   # admin（requireAdmin 双守卫）/ password（bcrypt 10）/ upload-rate-limit（3/日用户+8/日全站 Map）/ submit-error-classifier（GREEN/YELLOW/RED）/ posts（getAllPosts MDX 读取）/ posts-io（createPostMdx 写入）/ slugify / search / prisma（单例）/ utils（cn）/ validators/*（post-schema / submit-post-schema / comment-schema Zod）
│   └── types/post.ts          # PostMeta/PostType/SourcePlatform（POST_TYPES/SOURCE_PLATFORMS 内部 const）
├── tests/                     # **46 files / 340 passed / 1 todo**（登录弹窗·未注册弹窗·角色页·头像裁剪·生日倒计时·投稿表单·全局弹窗·提交弹窗·投稿额度·我的投稿·投稿预览·Player·Player HoverCard·**AI 聊天 21 files 75 cases（17波6文件22 + 22波15文件53）** 等）
├── auth.ts                    # Auth.js v5（Credentials 唯一 + authorize() 抛 USER_NOT_REGISTERED + JWT 会话每次同步 image）
├── proxy.ts                   # Next.js middleware（/dashboard + /api/admin/* + /api/bookmarks + /api/likes 守卫）
├── mdx-components.tsx
├── vitest.config.ts           # jsdom + vite-tsconfig-paths（@/ 别名）
└── next.config.mjs            # remotePatterns：SM.MS(legacy) / ImgURL s3.bmp.ovh / B站封面 api.bilibili.com
```

***

## 设计系统速览（星空泡泡主题）

### 色彩（灵感来源：达妮娅粉白长发 + 泡影视阈技能）

| 变量              | 用途        | 色值（暗色锚点）                               |
| --------------- | --------- | -------------------------------------- |
| `--background`  | 页面背景      | 深蓝黑 `oklch(0.12 0.015 260)` + 三层星云径向渐变 |
| `--foreground`  | 正文文字      | 浅灰白 `oklch(0.92 0.01 250)`             |
| `--primary`     | 主色·粉      | 柔粉 `oklch(0.72 0.12 340)`（发色渐变提取）      |
| `--accent`      | 强调·泡泡紫    | 梦幻紫 `oklch(0.60 0.16 290)`             |
| `--credit`      | 出处标注      | 暖金 `oklch(0.70 0.12 60)`（泡影暖光）         |
| `--card`        | 卡片底色（毛玻璃） | 半透明 + `backdrop-blur(8px)`             |
| `--bubble-glow` | 泡泡光晕      | 粉色柔光，卡片 hover 加强                       |

亮色主题（`.light`）：粉白渐变背景 + 白日星尘；Header/Footer/信息流三区域使用 **`.surface-pink`** **50% 粉色毛玻璃**；暗色主题下 `.surface-pink` 自动淡化（柔粉 8% + backdrop-blur 12px），避免粉得刺眼。

纯 CSS 动画：body 三层星云径向渐变 + 5 处星尘微粒；`#__next::before/::after` 两颗大泡泡 20s 漂浮；`.card` 内外双层光晕 hover translateY(-2px)；`.bubble-surface::before/::after` Header/Hero/Footer 两颗小气泡；`.star-twinkle-*` 星星闪烁变体。

### 布局规范（响应式）

| 断点              | 行为                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| ≥1024px（lg）     | 桌面：角色胶囊 + 标题/筛选胶囊 **左右并排**；信息流居中 max-w-2xl，左右 sticky SideImage + mask 渐变虚化；信息流外框 `.surface-pink rounded-xl` 粉色毛玻璃 |
| 768\~1023px（md） | 平板：角色胶囊 + 标题胶囊 **上下堆叠**；Hero min-height+py-8 自适应增高；左右侧图保留                                                         |
| <768px（手机）      | 角色胶囊 & 侧边图 `display:none`；信息流单栏铺满                                                                                 |

Hero 角色胶囊（lg+ 720×320+ rounded-3xl）：① Daniya 英文名 + 三枚身份标签 💤/🍰/❄️ ② 档案 3 段 + 暖金 credit blockquote ③ Separator ④ 校服泡泡梗自白；右立绘 ring-4 `--primary`/20 粉色外光晕。

### 图片尺寸规范

| 用途                 | 比例                   | 用途         | 比例              |
| ------------------ | -------------------- | ---------- | --------------- |
| 信息流卡片缩略图           | 16:9 800×450         | 详情页横屏大图    | 16:9 1920×1080  |
| 详情页竖屏大图            | 4:5 1080×1350        | 详情页方图      | 1:1 1080×1080   |
| Hero 桌面左/右图（暗/亮×2） | 2:3 600×900          | Hero 手机背景图 | 3:4 750×1000    |
| 角色头像 / Logo        | 1:1 200×200 / 200×60 | OG 社交分享    | 1.91:1 1200×630 |

***

## 后台管理系统

**访问路径**（需登录，「作品管理 / 投稿审核」仅 `ADMIN_USER_ID` 可见）：

| 路由                                                         | 用途                               | 权限                  |
| ---------------------------------------------------------- | -------------------------------- | ------------------- |
| `/dashboard`                                               | 个人中心概览（基本信息+更换头像+退出+站长快捷 3 Card） | 所有登录用户              |
| `/dashboard/bookmarks`                                     | 我的收藏列表                           | 所有登录用户              |
| `/dashboard/settings`                                      | 账号设置（独立页面保留，深链兼容）                | 所有登录用户              |
| `/submit`                                                  | 投稿页面（写入 PendingPost 等待审核）        | 所有登录用户              |
| `/dashboard/submissions` + `/dashboard/submissions/[slug]` | 我的投稿 4 Tab + 预览独立路由（三层守卫防枚举）     | 所有登录用户（仅本人/站长可访问单条） |
| `/dashboard/posts` · `/new` · `/[slug]/edit`               | 作品列表 / 新建 / 按 slug 编辑            | 仅站长                 |
| `/dashboard/moderation`                                    | 投稿审核：列表 + 状态筛选 + 详情抽屉 + 通过/驳回表单  | **仅站长**             |

**图片上传工作流**：

- **站长后台** → `/api/admin/upload-image`（IMGURL 凭证，**无限流**）→ 响应归一化 → 写 Frontmatter
- **用户投稿** → `/api/user/upload-image`（登录 + canUploadToday 3/日+8/日 限流，超 429）→ 通过后同上

**审核通过工作流**（`/dashboard/moderation` 操作）：

1. 站长查看投稿详情（图片/B站预览/MDX正文/投稿者）
2. 通过表单预填发布日期/来源平台/原作者/原帖链接/标题/简介/标签 → 可修改
3. 调 `/api/moderation/posts/[id]` PUT `action=approve`
4. `postMetaSchema` 强校验 → `createPostMdx()` 写 MDX → `revalidatePath` 刷新
5. 更新 PendingPost.status = APPROVED + publishedSlug + reviewedBy/At

驳回：PUT `action=reject`，rejectReason ≥2 字符必填，写入 `rejectReason` 字段，不生成 MDX。

***

## 待办清单

### 必须完成

—（**核心功能 0 项待完成**；以下为中低优先级可选增量，不阻塞上线）

### 已删除 · 不再需要配置（代码已移除）

> 账号体系：GitHub/QQ OAuth + 邮箱 Magic Link + 手机短信验证码 4 种 → 精简为 用户名+密码（bcrypt）+ 注册页 + Canvas 验证码。
> 评论：Giscus（GitHub Discussions，方案 A/D）→ 自建评论系统（方案 C，体验一致性优先）。
> AI 聊天：**AstrBot 单轨 + DeepSeek V4 Flash + Prisma 聊天历史表 旧方案**（7月10日前设想）→ **第二十二波双轨方案完全替代**（智谱 GLM-4.7-Flash 永久免费默认 + 用户自定义 OpenAI 兼容密钥自选，本地 AES-GCM 零托管）；AstrBot 需云服务器 7x24 + HMAC + IP 白名单的运维成本已完全免除。

- [x] **~~配置 Giscus 评论~~**：`<GiscusComments />` → `<UserComments />`（自建）；giscus.tsx 物理删除；`.env.local` 4 条 `NEXT_PUBLIC_GISCUS_*` + 旧 GitHub/QQ/SendCloud/SMS 残留全部清理；`.env.example` 移除
- [x] **~~配置 GitHub OAuth / QQ OAuth / 邮箱登录 / 手机验证码 / 旧短信限流~~**：对应 provider / 发送工具 / 路由 / 表单文件全部删除（代码 9 文件 + 配置 3 类）
- [x] **~~🤖 AI 聊天接入 AstrBot / DeepSeek V4 Flash 真模型（AstrBot 单轨旧方案）~~**：被第二十二波双轨方案完全替代 — 不再需要 AstrBot 云服务器 7x24 部署、不再需要 HMAC + IP 白名单、不再需要 PRESET\_REPLIES 物理删除（占位语保留为 fallback）、不再需要 `@ai-sdk/openai-compatible` Provider、不再需要 Prisma AIChatSession/AIChatMessage 表（聊天历史可选化）

### 待用户完成

- [x] 角色简介文案（首页 Hero 胶囊 4 段）
- [x] 角色页立绘 ×2（492b30d...jpg + 625294f...png；复用为歌单 track-1 封面）
- [x] ImgURL 凭证（UID + TOKEN）
- [x] 站点背景音乐首曲接入（track-1 真实化：鸣潮先约电台 ogg）
- [x] 🤖 AI 聊天 UI Mock（FAB + Dialog + SSE + 5 层拦截 + 占位语）— 已被 22 波双轨方案升级
- [x] **🤖 AI 聊天双轨方案（22 波 · 7月12日完成）**：智谱 `ZHIPU_API_KEY` 已在 Vercel Environment Variables 单独配置（**已替换过一次，2026-07-12 同步泄露风险已消除**）；用户自选方案：A 用默认模型（站长承担，无配置）、B 自填 baseURL + apiKey + model（用户自费，localStorage AES-GCM 加密）
- [ ] **🎵 歌单 track-2 / track-3 真实化（低优）**：替换占位 src + 补充 coverUrl

### 可选增强（低优先级）

- [ ] 🎵 音乐播放器：播放模式切换（列表循环 / 单曲循环 / 随机）+ 播放列表抽屉
- [ ] 🎞️ 详情页：PostGallery 网格 → lightbox 灯箱 / 左右滑动轮播
- [ ] 🔐 安全：登录失败 5 次/10 分钟 用户名+IP 限流；密码重置流程
- [ ] 📱 移动端：Header 投稿 + 搜索合并进 MobileNav；首页卡片圆角手机端微调
- [ ] 🤖 角色扩展：OTHER 角色时 `/character` 多角色切换 Tab
- [ ] 🔍 搜索：高级过滤（类型/时间/角色多选）
- [ ] 🤖 聊天体验：快捷推荐问题 chips（已确认暂 skip）；多轮会话 memory（22 波双轨方案下，前端已保留完整 messages 列表，sessionId 聚合属于性能/存储层优化，待 Upstash Redis 跨实例持久化升级时一起做）

***

## 错误修复要点（7月2日 全站审查 7 类）

> 合并记录要点（完整代码锚点见对应源文件）

| # | 严重度     | 问题                                                  | 修复要点                                                                 |
| - | ------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| 1 | 数据丢失级   | 用户投稿 MDX 正文 Zod 默认 strip 丢 body                     | safeParse 前保存 rawBody，正文从 rawBody.body 读取                            |
| 2 | 审核通过被拒级 | 投稿端 / 站长端 title/description/tags 限制不一致              | 投稿端对齐站长端：title 1-120 / description 1-300 / tags max 8                |
| 3 | 类型系统级   | 投稿端开放 screenshot 类型，全局 POST\_TYPES/postTypeEnum 未定义 | types/post.ts + post-schema.ts + post-type-badge.tsx 四处同步 screenshot |
| 4 | 安全级     | Dashboard /posts 三页仅做登录检查未比对 ADMIN\_USER\_ID        | 三页全部加红色 403 面板（new 页额外提供「前往投稿」跳转）                                    |
| 5 | 类型级     | Moderation API groupBy 回调隐式 any                     | 结果变量显式注解 `Record<string, number>`                                    |
| 6 | 用户体验级   | 审核通过表单 title/description 缺少 maxLength               | 加 maxLength=120/300 + 字符计数提示，与 Schema 一致                             |
| 7 | 测试级     | submit-post-schema.test.ts 用例仍按旧限制写                 | 12 用例全部更新新限制 + 加 comic 类型投稿端应失败（投稿端只开 3 种）                           |

验证：GetDiagnostics 0 + vitest 25 passed + next build 37/37 全部通过。

***

## 历次迭代速查表（21 波 · 压缩合并版）

> 流水账压缩版；具体文件锚点直接查 src/ 源码 + tests/ 源码结构断言（ground truth）。

| 波次  | 日期        | 主题                                | 核心产出                                                                                                                                                                            | 受影响文件量                            | 测试             |
| --- | --------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------- |
| 1   | 6月30      | Hero + 媒体外链化                      | Hero 响应式 + 媒体 ImgURL/B站 + 3 张 Hero jpg                                                                                                                                          | 3 源                               | —              |
| 2   | 7月1       | UI 重构 + 后台 CRUD + 图床定型            | Hero Banner 组件 + 三列 sticky + 毛玻璃 + Admin CRUD + 图床 ImgURL                                                                                                                       | 10 源                              | —              |
| 3-1 | 7月2       | 用户投稿 + 人工审核整套                     | PendingPost 三态 + 限流（3/日+8/日）+ /submit + /dashboard/moderation + 权限分级 UI + Vitest 全家桶 + screenshot 类型统一                                                                          | 19 改 + 37 新                       | 起步 26 cases    |
| 3-2 | 7月2       | 账号体系 4→1 精简                       | Credentials 唯一 + bcryptjs + 注册页/API + Canvas 验证码 + JWT(DB image 同步) + AvatarUploadDialog + 自制 Dialog + B 站封面白名单                                                                 | 6 新增 + 9 删除 + 7 修改                | —              |
| 3-3 | 7月2       | Dashboard 整合（方案 A）                | 删除绑定账号区；侧边栏删除「账号设置/作品管理」；概览页合并 + 站长快捷 3 Card；原独立路由保留深链                                                                                                                          | 2 源 + 1 test                      | 13 cases       |
| 4   | 7月2 晚     | 自建评论（方案 C）                        | Comment 模型 + 3 API + 前端组件 + 替换 Giscus                                                                                                                                           | 1 模型 + 3 源 + 2 tests              | 11 cases       |
| 5   | 7月2 22:00 | 冗余代码审计 12 项                       | giscus.tsx + .env.local 残留删除；types/post.ts 去重；POST\_TYPES/SOURCE\_PLATFORMS 内部 const；明确不动 `_resetForTests`                                                                      | 10 项清理 + 2 项保留                    | —              |
| 6   | 7月2 22:55 | 全局 StatusModal Context            | Provider + Hook + layout wrap + ImageUploader 接入成功/失败弹窗 + 删除按钮下红色内联小字                                                                                                           | 1 新 + 2 改                         | 8 cases        |
| 7   | 7月3 00:55 | 提交弹窗 + A-1 错误分级                   | StatusModal opts API + classifySubmitError 三级 + PostForm 接入 + onDismiss 跳 /dashboard/submissions                                                                                | 2 新 + 2 改                         | 14 cases       |
| 8   | 7月3 08:22 | 投稿页「今日额度」实时刷新                     | 额度卡片 UI 双进度条 + Server→Client boolean prop + ImageUploader onUploadSuccess 回调透传                                                                                                  | 3 改                               | 8 cases        |
| 9   | 7月3       | 我的投稿页 + 取消/重提                     | 4 Tab 列表 + PENDING 取消投稿三重幂等 + APPROVED 外链 + REJECTED 驳回理由+?resubmit=id 回填                                                                                                       | 2 新 + 2 改                         | 11 cases       |
| 10  | 7月3-4     | 角色页 + 生日倒计时 + 头像裁剪                | /character 页 + 7 状态倒计时组件 + react-easy-crop AvatarUploadDialog + 主题文字 CSS 变量化                                                                                                    | 4 新 + 3 改                         | 39 cases       |
| 11  | 7月5 上午    | 未注册专属弹窗                           | auth.ts authorize() USER\_NOT\_REGISTERED + LoginForm 强制 Dialog 仅 2 按钮可关 + 验证码刷新+清空                                                                                             | 2 改                               | 8 cases 更新     |
| 12  | 7月5 下午    | 投稿预览独立路由 \[slug]（方案A）             | 三层守卫 + 三态胶囊 + 锁横幅 + 驳回重提 + APPROVED 外链 + 成功弹窗 onDismiss 真实跳转                                                                                                                    | 1 新 + 3 改                         | 13 cases       |
| 13  | 7月5 15:40 | 受控 select defaultValue+value 冲突修复 | PostForm 关联角色 select 删除 defaultValue，仅留 value 受控                                                                                                                                | 1 改 + 1 test 更新                   | 7 cases        |
| 14  | 7月5       | **Character enum 字段**             | `enum Character { DANIYA }`（OTHER 占位预留给后续扩角色）+ Post/PendingPost 两模型 character 字段 + Zod 两处 nullable/optional + UI 下拉/预览 badge                                                    | 1 prisma + 1 types + 2 zod + 2 UI | 4 cases        |
| 15  | 7月5 晚     | 音乐播放器方案2（Popover 面板）              | @radix-ui/react-popover + popover.tsx + music-player 方案2 全量重写（6 状态 + 8 事件 + 三层面板 UI）+ 歌单 track-1 真实化 + Header 挂载                                                                | 4 新 + 1 资源                        | 18 cases       |
| 16  | 7月10 凌晨   | **音乐播放器方案3（HoverCard 悬停）**        | @radix-ui/react-hover-card + hover-card.tsx + music-player Popover→HoverCard 替换 + openDelay=80/closeDelay=200 双延迟 + 点击仅切播放/暂停 解耦 + 移动端 click fallback                           | 3 改 + 1 新                         | 18 cases 重写    |
| 17  | 7月10      | **达妮娅 AI 聊天 UI（核心）**              | 4 包（@ai-sdk/react / ai / react-markdown / remark-gfm）+ /api/chat（5 层安全拦截铁序：登录/200字/合规/限流/调模型）+ DaniyaChatFAB（FAB+Dialog+SSE流式打字机+未登录强制弹窗阻断）+ layout 全局挂载                  | 2 新 + 1 改 + 6 tests 新             | **22 cases**   |
| 18  | 7月10 午后   | README 双域名 & 全链路同步                | 第十六/十七波全表追加 + 完成度表扩 2 行 + 待办 AI 三步走 + 设计理念 +3 条 + 新增 daniya-fansite.vercel.app 5 处同步（徽章/部署行/AUTH\_URL/限流+KV/D5）                                                                 | README 仅 0 源码                     | —              |
| 19  | 7月10 午后   | **全站安全审计 A 级**                    | 6 真实密钥反向 literal 0 命中 + 19/19 API 路由守卫 + 客户端 0 读 process.env 密钥家族 + bcrypt+JWT 审计 + 0 明文密码日志；3 条低风险（非安全漏洞）                                                                      | 审计报告 1 份                          | —              |
| 20  | 7月10 午后   | **L1 环境变量残留清理**                   | `.env` 物理删除 7 行（AUTH\_GITHUB\_ID/SECRET 旧真实值 2 + 4×NEXT\_PUBLIC\_GISCUS\_\* + 2 注释）；.env.local 0 改动；源码 0 触碰                                                                     | `.env` 仅                          | —              |
| 21  | 7月10 午后   | **注释清扫 B 方案**                     | 🔴 4 条硬垃圾（void session/Image/streamText 散碎/shouldManageState→isDirectCall）+ 🟡 \~61 条冗语（14 条分割线 + 40 条直译 + 7 条数组分组标签）；13 文件受影响；净减 54 行注释（296→242，-18%）；TEMP/安全/决策/JSDoc 100% 保留 | 13 源                              | **265/265 通过** |
| 22  | 7月12      | **AI 聊天双轨方案（核心）**                 | **轨道 A 默认免费**（智谱 BigModel `GLM-4.7-Flash` 永久免费）+ **轨道 B 用户自费**（localStorage AES-GCM-256 + HKDF 零托管）；**6 env** 变量；`/api/chat` 5 层安全拦截铁序（双轨先过 L1~L3 再 L4 限流再调模型）+ SSRF 9 类内网段拒绝 + 人设注入 `sanitizeMessages` 删用户 system/tool 注入唯一 `DANIYA_SYSTEM_PROMPT` + 智谱 fetch 重试 2 次（指数退避 500→1000ms）+ fallback `PRESET_REPLIES[0]`「该功能还在测试中QAQ」占位 SSE；`/api/chat/test-connection` B1 协议识别 6 类（Claude/Gemini/api-key-invalid/openai-compatible/Ollama/unknown）；`src/lib/custom-ai-config.ts` AES-GCM-256 encrypt/decrypt/delete；FAB 升级 ⚙️ 齿轮按钮 `chat-settings-gear` + 居中 Settings Dialog 3 字段（baseURL/apiKey/model）3 按钮（删除/测试/保存）+ apiKey blur 掩码前 3 后 3 中间 `*`；废弃 AstrBot 单轨旧方案  | 4 新（route/test-connection/custom-ai-config/集成到 fab） + **15 tests 新** | **+75 cases**（21 文件 / 75 AI cases / 旧 22 零回归） |

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
- **用户投稿 + 人工审核双页闭环**：开放登录用户投稿入口 → `/submit` 投稿（含今日额度实时刷新 + 限流）→ 写入 PendingPost → 站长审核通过/驳回 → 用户在「我的投稿 4 Tab」查看状态 → **点卡片进入投稿预览独立路由** **`/dashboard/submissions/[slug]`（方案A）** 查看详情/驳回理由/修改后重提；非 APPROVED 稿件锁定点赞/收藏/评论，通过后在正式页 `/post/<slug>` 汇总互动
- **ImgURL 免费版限流保护**：用户上传图片共用站长免费账号的 UID/TOKEN，实施「单用户 3 张/日 + 全站 8 张/日」双层限流，防止免费额度被耗尽导致站长本人无法发文
- **权限分级 + 防枚举**：Dashboard 侧边栏根据 `ADMIN_USER_ID` 动态生成；普通用户「概览/收藏/我的投稿」，站长额外「投稿审核」；敏感 API 均有 `requireAdmin()` 兜底；投稿预览页非本人非管理员一律 `notFound()`（不给 403），避免通过 URL 枚举 slug 是否存在
- **登录体验分级**：密码错误 → 通用「用户名或密码错误」红色提示 + 验证码刷新；未注册用户 → `authorize()` 抛 `USER_NOT_REGISTERED` → 前端**居中强制 Dialog**，只能点「确认」或 X 关闭（禁止遮罩/Esc 关闭），防止用户混淆
- **用户反馈全链路全局弹窗（方案 B StatusModal Context）**：上传成功/失败、投稿成功/失败（A-1 错误分级 GREEN/YELLOW/RED，RED 级错误隐藏技术细节统一替换「系统维护中…」）、投稿成功 onDismiss 跳「我的投稿」—— 任何时候都不要在按钮下方用红色内联小字显示错误，**统一屏幕居中彩色边框弹窗**
- **受控组件单一原则**：所有 `<select>` / `<input>` 只允许一种受控模式——要么 `value`（配合 `useState` 完全受控）要么 `defaultValue`（非受控），**禁止两者同时存在**；提交表单受控 props 冲突会触发 React mixed controlled/uncontrolled warning（见第十三波受控 select 修复记录）
- **TDD 源码结构断言优先**：功能开发一律「先写 vitest cases → failing → 实现 → passing → 全量回归」，避免 UI 功能回归；对视觉体验类（角色页/倒计时/播放器面板/弹窗）使用源码结构断言（import fs 读取源码 grep regex），不依赖 jsdom 渲染减少测试耗时
- **音乐播放轻量无侵入**：音乐播放器挂载在 Header 所有页面可触达，但默认不自动播（遵守浏览器自动播放策略）；播放中图标高亮 animate-pulse 呼吸灯；方案3 **HoverCard 悬停展开面板**（`openDelay=80ms / closeDelay=200ms` 双延迟防闪烁）+ **点击只切播放/暂停** 解耦，面板开合完全交给 hover，不干扰页面滚动与表单输入；移动端保留 click 触发 fallback；音频资源存于 `public/music/` 目录与图床外链彻底分开，避免加载受 CDN 影响
- **AI 聊天 5 层安全拦截铁序**（严格按顺序执行，任何一层命中立即 return，避免进入 LLM 烧钱，双轨都生效）：① **身份层 L1** — 未登录 → 401 + 居中红色弹窗「该功能仅登录用户可用」，未登录点 FAB 绝不展开 Dialog ② **长度层 L2** — 输入 > 200 字 → 400「消息过长」③ **合规层 L3** — 6 大类关键词正则（自杀自残/毒品/赌博/色情/枪支恐怖/传销诈骗）→ 400「内容违规」（**双轨都生效**）④ **成本层 L4** — 登录用户级日限流 200 轮/天（**仅默认模式生效**，自定义密钥模式 bypass 因为用户自己掏钱）⑤ **模型层 L5** — 调上游 AI；默认模式（智谱）遇 429/5xx/超时 3s **重试 2 次**（指数退避 500→1000ms），两次都失败 → 降级到 `PRESET_REPLIES[0]`「该功能还在测试中QAQ」占位 SSE 打字机，Header 透传 `X-Mock-Mode=true` + `X-Max-Tokens=50`；自定义模式 `max_tokens` 用 `Math.min(用户值, 150)` 硬卡防刷爆
- **AI 聊天双轨方案渐进式**（22 波落地，**完全替代原 AstrBot 单轨旧方案**）：**轨道 A 默认免费**（智谱 BigModel `GLM-4.7-Flash` 永久免费，站长不花钱，baseURL `https://open.bigmodel.cn/api/paas/v4`，6 env 变量在 Vercel 面板单独配 ZHIPU\_\* 三件 + CHAT\_\* 限流 + SALT）；**轨道 B 用户自费**（任意 OpenAI 兼容协议，baseURL + apiKey + model 三字段，max\_tokens 硬卡 150）；**B1 协议识别**（`/api/chat/test-connection` 启发式 6 类 — Claude 原生 / Gemini 原生 / api-key-invalid / openai-compatible / local-ollama-unreachable / unknown-non-openai，2s 超时，Ollama 检测放行给 cloudflared 1 命令教程，弹提示但不拦截）；**B2-X 零托管密钥**（localStorage AES-GCM-256 + HKDF 用 session token + `USER_KEY_ENCRYPTION_SALT` 派生 key，apiKey 输入框 onBlur 前 3 后 3 中间 `*` 掩码，onFocus 强制清空 + placeholder「如需修改请重新输入完整 Key」，**永不可回看明文**，服务器 Edge 代理用完即丢不落日志不落 DB）；**SSRF 拦截**（拒绝 `localhost / 127.* / 10.* / 172.16-31.* / 192.168.* / 169.254.* / fc00:* / 0.0.0.0`，仅 Ollama 检测分支放行）；**人设注入不可见不可改**（route.ts 顶部 `DANIYA_SYSTEM_PROMPT` 常量，`sanitizeMessages()` 先 filter 掉用户传的所有 `system / tool` 消息再 `unshift` 唯一一条人设，前端 UI 绝不显示「已注入人设」/也不能关闭/也不许用户自定义人设）；**FAB UI 升级**（右下角浮动毛玻璃 + 粉光晕 + 登录态 Header 右侧 ⚙️ 齿轮按钮 `chat-settings-gear` + 居中 Settings Dialog 三字段（baseURL/apiKey/model）+ 三按钮（删除/测试/保存）+ apiKey blur 掩码前 3 后 3）；**占位语保留**（`PRESET_REPLIES[0]`「该功能还在测试中QAQ」**不再仅作 mock 占位**，升级为默认模式 429/5xx 重试 2 次失败后的最终 fallback）
- **版权尊重**：About 页面明确声明所有权利归原作者，提供邮箱/GitHub/B站 三个下架联系渠道；投稿被驳回时必须填写理由，便于用户理解审核标准

