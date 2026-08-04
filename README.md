# 达妮娅的瞌睡小屋

> 《鸣潮》角色「达妮娅」同人二创作品 curation 站点
>
> 微博风格卡片信息流，精选搬运优质二创，标注原作者与出处
>
> 🔗 主站 [daniya-fansite.netlify.app](https://daniya-fansite.netlify.app) · 备用 [daniya-fansite.vercel.app](https://daniya-fansite.vercel.app)

## 项目介绍

**技术选型**：Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma + Neon PostgreSQL · Auth.js v5 · MDX

**核心功能**：Hero 三列布局（星空泡泡主题 · 粉白渐变毛玻璃）+ 分页卡片信息流（类型/标签/角色筛选）+ 作品详情页（图片网格 / B站 iframe / MDX / 自建评论）+ 角色页（立绘 + 生日倒计时）+ 投稿审核工作流（PendingPost 三态 + 限流 + 预览独立路由）+ 音乐播放器（HoverCard 悬停面板 · openDelay=80ms）+ 🤖 AI 聊天双轨（A: 智谱 GLM-4.7-Flash 永久免费 / B: 用户自定义 AES-GCM 零托管）+ 移动端响应式适配

**角色归属说明**：`enum Character { DANIYA }` 单值，目前 DANIYA 单值，OTHER 占位预留给后续扩角色。仅 DANIYA 一个枚举值，OTHER 占位预留给后续可能扩展其他鸣潮角色。

**部署平台**：Netlify（主站）· Vercel（备用）

***

## 更新历史

### 当前项目进度总览（截止 7月30日）

> **阶段结论**：项目核心功能 + 体验优化**全链路打通并完成 24 波增量升级**（核心功能 1→13 波 · 功能增强 14→24 波）。
>
> **待完成仅剩 1 项低优**：🎵 音乐 track-2/3 封面+音频真实化。
>
> **最新关键里程碑（5 波置顶）**：
>
> - 📱 **第二十四波 · 移动端聊天适配（7月30日）**：聊天页面响应式改造 — 侧边栏和设置面板在移动端（<768px）变为滑入抽屉式（固定定位 + 遮罩层），顶部新增 Hamburger 菜单按钮；聊天区域在小屏幕全屏展示
> - 🚀 **第二十三波 · Netlify 部署优化（7月30日）**：netlify.toml 新增（60s 函数超时 + Prisma generate 构建步骤 + 音乐 Cache-Control + 安全响应头）；prisma.ts 懒加载重写（getPrisma() + 3s 超时 + executeWithWakeUp 自动唤醒 + 指数退避重试）；auth.ts trustHost: true；authorize() 故障返回 null
> - 🤖 **第二十二波 · AI 聊天双轨方案（7月12日 · 核心）**：轨道 A 智谱 GLM-4.7-Flash 永久免费 + 轨道 B 用户自定义 AES-GCM 零托管；5 层拦截铁序 + SSRF + 人设注入 + 重试/fallback + B1 协议识别 6 类；21 文件 75 cases 全绿
> - 🧹 **第二十一波 · 注释清扫方案 B（7月10日）**：13 文件受影响；净减 54 行注释（296→242，-18%）；TEMP/安全/决策/JSDoc 100% 保留
> - 🔐 **第十九波 · 全站安全审计 A 级**：19 API 路由 100% 守卫；0 密钥泄漏；0 客户端读服务端密钥；3 条低风险（非安全漏洞）

**构建验证**：GetDiagnostics 0 errors · TypeScript 0 errors · **46 files / 335 passed / 1 todo**

### 历次迭代速览（1→13 波合并）

| 阶段       | 日期         | 核心主题                                           | 交付要点                                                                                                                                                                                                                                 |
| -------- | ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 第一批      | 6月30日      | Hero + 媒体外链化                                   | Hero 响应式 fixed→flex 左右图；媒体 SM.MS→ImgURL 外链；3 张 Hero jpg 就位                                                                                                                                                                           |
| 第二批      | 7月1日       | UI 重构 + 后台 CRUD + 图床定型                         | Hero Banner 独立组件 + 暗/亮图自动切换；三列布局 sticky + mask；毛玻璃 `.surface-pink`；完整 Admin CRUD（Auth 守卫 + ImgURL 代理 + MDX 编辑）；图床最终 ImgURL                                                                                                           |
| 第三波（第一波） | 7月2日       | 用户投稿 + 人工审核整套                                  | PendingPost 三态模型；ImgURL 上传限流 3/日用户 + 8/日全站；`/submit` 投稿页；`/dashboard/moderation` 审核面板；权限分级 UI；Vitest 全家桶 3 文件起步；next.config 白名单；screenshot 作品类型全局统一                                                                                  |
| 第三波（第二波） | 7月2日       | 账号体系 4→1（用户名+密码）                               | Credentials Provider 唯一；bcryptjs salt 10；注册页 + 注册 API；Canvas 图形验证码（登录/注册双校验）；JWT 会话 + 每次从 DB 同步 image；AvatarUploadDialog 裁剪换头像；自制 Dialog 复合组件；next.config 白名单追加 B 站封面                                                                |
| 第三波（第三波） | 7月2日       | Dashboard 个人中心整合                               | 删除绑定账号区；侧边栏删除「账号设置/作品管理」；内容合并进 `/dashboard` 概览页；站长专属快捷 3 Card 网格；原独立路由保留深链；TDD 13 cases                                                                                                                                            |
| 第四波      | 7月2日 晚     | 自建评论系统（方案 C）                                   | Prisma Comment 模型 + 复合索引；Zod 1-1000；3 API（GET/POST list · DELETE 本人/站长）；前端组件（加载中/空态/气泡/删除按钮/字数计数）；前 `<GiscusComments />` 替换；2 测试文件 11 cases                                                                                          |
| 第五波      | 7月2日 22:00 | 冗余代码审计 12 项清理                                  | 删除孤儿 giscus.tsx；`.env.local` Giscus+OAuth 残留清；types/post.ts 删除 interface Post + PostMeta（唯一源改 lib/posts.ts）；posts.ts 删 getAllTags/getAllTypes；POST\_TYPES/SOURCE\_PLATFORMS 内部 const；明确不动 `_resetForTests` |
| 第六波      | 7月2日 22:55 | 全局状态弹窗 StatusModal Context                     | 新建 Provider + Hook（showSuccess/showError）；layout 全局 wrap；ImageUploader 接入（成功居中绿边/失败居中红边）；删除上传失败按钮下红色内联小字；8 cases TDD                                                                                                                 |
| 第七波      | 7月3日 00:55 | 提交审核弹窗 + A-1 错误分级                              | StatusModal opts API 升级（autoClose + onDismiss）；classifySubmitError 三级关键词（GREEN 32 / YELLOW 8 / RED 16）；PostForm 接入 + 删 errors.\_form 顶部红条；成功 onDismiss 跳 `/dashboard/submissions`；14 cases TDD                       |
| 第八波      | 7月3日 08:22 | 投稿页「今日额度」卡片 + 实时刷新                             | submit/page 直读限流 Map 双进度条（全站主色/用户 emerald，零额度红字提示）；Server→Client boolean prop 序列化设计（refreshQuotaOnUpload→router.refresh）；ImageUploader 扩展 onUploadSuccess 回调；8 cases TDD                                                             |
| 第九波      | 7月3日       | 我的投稿页 + 取消/驳回重提                                | 侧边栏「我的投稿」菜单；4 Tab（全部/待审核/已通过/已驳回+数量徽章）；PENDING 取消投稿 Server Action（auth+本人+仅 PENDING 409 三重幂等）；APPROVED 外链正式页；REJECTED 驳回理由+修改重提（`/submit?resubmit=<id>` 回填 prefill，slug 强制 '' 防撞库）；11 cases TDD                                      |
| 第十波      | 7月3\~4日    | 角色页 + 生日倒计时 + 头像裁剪                             | `/character` 角色页 Hero 2 张真实立绘 + 档案卡 + 三 Tab 17 tests；birthday-countdown 7 状态动态文案 13 tests；react-easy-crop 头像裁剪画布 9 tests；暗/亮主题文字色全面 CSS 变量化                                                                                          |
| 第十一波     | 7月5日 上午    | 未注册用户登录专属弹窗                                    | `authorize()` 抛 `USER_NOT_REGISTERED` 区分密码错；LoginForm 新增 state + 强制 Dialog（仅 「确认」/「X」 两按钮可关，遮罩/Esc 丢弃 false）；验证码刷新+清空输入；8 cases TDD 更新                                                                                               |
| 第十二波     | 7月5日 下午    | 投稿预览独立路由 `/dashboard/submissions/[slug]`（方案 A） | 三层守卫（未登录 redirect / 不存在 notFound / 非本人非管理员 notFound 防枚举）；三态状态胶囊；状态横幅（APPROVED 绿边/其他锁互动）；REJECTED 驳回理由 + 重提链接；PostForm 成功 onDismiss 真实跳转 + 列表卡片预览胶囊；13 cases TDD                                                                      |
| 第十三波     | 7月5日 15:40 | 受控 select 冲突修复                                 | PostForm「关联角色」下拉删除 defaultValue="DANIYA"，state 初始化已保证默认选中；7 cases TDD                                                                                                                                                                |

### 历次迭代速查表（24 波 · 详细版）

| 波次  | 日期        | 主题                                | 核心产出                                                                                                                                                                            | 受影响文件量                            | 测试             |
| --- | --------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------- |
| 1   | 6月30      | Hero + 媒体外链化                  | Hero 响应式 + 媒体 ImgURL/B站 + 3 张 Hero jpg                                                                                                                                       | 3 源                               | —              |
| 2   | 7月1       | UI 重构 + 后台 CRUD + 图床定型      | Hero Banner 组件 + 三列 sticky + 毛玻璃 + Admin CRUD + 图床 ImgURL                                                                                                                   | 10 源                              | —              |
| 3-1 | 7月2       | 用户投稿 + 人工审核整套             | PendingPost 三态 + 限流 + submit + moderation + 权限分级 + Vitest 全家桶 + screenshot 类型统一                                                                                     | 19 改 + 37 新                       | 26 cases        |
| 3-2 | 7月2       | 账号体系 4→1 精简                  | Credentials 唯一 + bcryptjs + 注册 + 验证码 + JWT + 头像裁剪 + 自制 Dialog                                                                                                            | 6 新增 + 9 删除 + 7 修改                | —              |
| 3-3 | 7月2       | Dashboard 整合（方案 A）          | 侧边栏精简 + 概览合并 + 站长快捷 3 Card + 深链兼容                                                                                                                                   | 2 源 + 1 test                      | 13 cases       |
| 4   | 7月2 晚     | 自建评论（方案 C）                | Comment 模型 + 3 API + 前端组件 + 替换 Giscus                                                                                                                                       | 1 模型 + 3 源 + 2 tests              | 11 cases       |
| 5   | 7月2 22:00 | 冗余代码审计 12 项                 | giscus.tsx + env 残留删除；types/post.ts 去重；内部 const 统一                                                                                                                       | 10 项清理 + 2 项保留                    | —              |
| 6   | 7月2 22:55 | 全局 StatusModal Context        | Provider + Hook + layout wrap + ImageUploader 接入                                                                                                                                  | 1 新 + 2 改                         | 8 cases        |
| 7   | 7月3 00:55 | 提交弹窗 + A-1 错误分级            | StatusModal opts API + classifySubmitError 三级 + PostForm 接入                                                                                                                     | 2 新 + 2 改                         | 14 cases       |
| 8   | 7月3 08:22 | 投稿页「今日额度」实时刷新           | 额度卡片双进度条 + onUploadSuccess 回调透传                                                                                                                                         | 3 改                               | 8 cases        |
| 9   | 7月3       | 我的投稿页 + 取消/重提               | 4 Tab 列表 + 取消投稿三重幂等 + 驳回理由+重提回填                                                                                                                                     | 2 新 + 2 改                         | 11 cases       |
| 10  | 7月3-4     | 角色页 + 生日倒计时 + 头像裁剪        | /character + 7 状态倒计时 + react-easy-crop 裁剪                                                                                                                                   | 4 新 + 3 改                         | 39 cases       |
| 11  | 7月5 上午    | 未注册专属弹窗                    | authorize() USER_NOT_REGISTERED + 强制 Dialog                                                                                                                                     | 2 改                               | 8 cases        |
| 12  | 7月5 下午    | 投稿预览独立路由 [slug]（方案A）    | 三层守卫 + 三态胶囊 + 锁横幅 + 驳回重提 + 外链                                                                                                                                      | 1 新 + 3 改                         | 13 cases       |
| 13  | 7月5 15:40 | 受控 select 冲突修复               | PostForm select 删除 defaultValue，仅留 value 受控                                                                                                                                | 1 改 + 1 test 更新                   | 7 cases        |
| 14  | 7月5       | Character enum 字段              | `enum Character { DANIYA }`（OTHER 占位预留给后续扩角色）+ 两模型 character + Zod nullable + UI 下拉                                                                               | 1 prisma + 1 types + 2 zod + 2 UI | 4 cases        |
| 15  | 7月5 晚     | 音乐播放器方案2（Popover 面板）      | @radix-ui/react-popover + 三层面板 UI + track-1 真实化                                                                                                                             | 4 新 + 1 资源                        | 18 cases       |
| 16  | 7月10 凌晨   | 音乐播放器方案3（HoverCard 悬停）    | @radix-ui/react-hover-card + openDelay=80ms/closeDelay=200ms + 点击仅切播放                                                                                                      | 3 改 + 1 新                         | 18 cases 重写    |
| 17  | 7月10      | 达妮娅 AI 聊天 UI（核心）            | 4 包 + /api/chat（5 层拦截）+ DaniyaChatFAB（FAB+Dialog+SSE 流式）                                                                                                               | 2 新 + 1 改 + 6 tests 新             | 22 cases       |
| 18  | 7月10 午后   | README 双域名 & 全链路同步          | 全表追加 + 完成度扩 2 行 + 设计理念 +3 条                                                                                                                                             | README 仅                          | —              |
| 19  | 7月10 午后   | 全站安全审计 A 级                | 19 API 守卫 + 0 密钥泄漏 + 0 客户端读服务端密钥                                                                                                                                    | 审计报告 1 份                          | —              |
| 20  | 7月10 午后   | L1 环境变量残留清理                 | .env 删除 7 行旧残留；源码 0 触碰                                                                                                                                                     | .env 仅                          | —              |
| 21  | 7月10 午后   | 注释清扫 B 方案                   | 13 文件；净减 54 行注释（296→242，-18%）；TEMP/安全/JSDoc 100% 保留                                                                                                                     | 13 源                              | 265 passed     |
| 22  | 7月12      | AI 聊天双轨方案（核心）               | 轨道 A 智谱 GLM-4.7-Flash 免费 + 轨道 B 自定义 AES-GCM；5 层拦截 + SSRF + 人设注入 + 重试/fallback                                                                                   | 4 新 + 15 tests 新                  | +75 cases      |
| 23  | 7月30      | Netlify 部署优化                | netlify.toml（60s + Prisma generate + Cache-Control）+ prisma.ts 懒加载 + auth.ts trustHost                                                                                         | 3 改 + 1 新 + 1 配置                  | 335 passed     |
| 24  | 7月30      | 移动端聊天适配                    | chat/page.tsx 响应式（抽屉+汉堡菜单+全屏聊天区）+ chat-sidebar h-full + chat-settings-panel max-md:w-full                                                                          | 3 改                               | 335 passed     |
