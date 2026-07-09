# 🤖 粉丝站内置聊天 AI · 方案讨论记录
> 日期：2026-07-09
> 状态：**方案已定稿，等待用户确认 3 个前置条件后开工（用户当前先处理其他事务，此文档用于回归追溯）**
> 关联代码库：`c:\Users\29942\Desktop\daniya-fansite`

---

## 对话历史摘要

### 问题 1（先问的通用方案）
> **用户问**：如果我想在粉丝站内置一个聊天 AI 的话，该怎么做？

> **回答核心（四维度决策）**：
> 1. **LLM 供应商首选 A：硅基流动 SiliconFlow + deepseek-v3**（≈¥0.5~2/百万tokens，中文角色扮演好，API 兼容 OpenAI SDK）；备选：OpenAI、Ollama 本地、Coze/Dify 低代码
> 2. **入口形态首选 A：右下角 FAB 悬浮按钮 + Dialog**（毛玻璃+粉/金描边，复用 shadcn/ui Dialog，不打断浏览流，移动端体验好）；备选：独立 `/chat` 页面、只嵌 `/character` 角色页
> 3. **存储：存 Prisma Conversation + ChatMessage 两张表**（推荐，登录用户跨设备同步；游客 localStorage / 5 句体验）
> 4. **体验必做：Vercel `ai` 包 + SSE 流式打字机 + react-markdown 渲染**；限流复用 upload-rate-limit.ts 思路（游客 5/24h/IP、登录 60/1h/user、全站 1000/24h 兜底）
> 5. **落地路线三波次**：波1 MVP（能聊 + FAB + 流式 + 后端代理隐藏 Key）→ 波2 体验优化（历史会话 + 气泡美化 + 快捷推荐问题）→ 波3 完全体（RAG 知识库接 MDX 作品 + 管理员会话审查 + 头像语音表情）

---

### 问题 2（用户补充已有资产，关键的复用场景）
> **用户问**：我之前有用 **AstrBot + NappCat** 实现了一个 QQ 聊天机器人，人设用的就是达妮娅，我想问能不能加到这里面来？

> **回答结论：✅ 完全可以，而且首推路线 A（AstrBot 官方 OpenAPI），人设 100% 和 QQ 上的达妮娅一致。**

---

## 路线 A vs 路线 B · 决策矩阵（最终选：**只做路线 A**，路线 B 留兜底）

| 维度 | **路线 A ⭐⭐⭐⭐⭐ 首选 · AstrBot v4.18.0+ 原生 OpenAPI `POST /api/v1/chat`** | **路线 B · 走 NappCat OneBot 模拟私聊消息（绕 QQ 一圈）** |
|---|---|---|
| 对接原理 | 粉丝站后端 → 调 AstrBot 6185 端口的 `/api/v1/chat`（scope=chat 的 Bearer abk_* Key）→ AstrBot 内部直接用和 QQ **完全相同的 Agent 链**（人设/模型/插件/知识库）→ SSE 流式回传 | 粉丝站后端 → 调 NappCat `/send_private_msg` 用**闲置小号 QQ** 给现有达妮娅机器人号发私聊 → QQ 协议 → AstrBot 回复 → 再用 OneBot HTTP/WS 上报把回复抓回来 |
| 人设复用度 | 100% 全链路（语气/梗/记忆和 QQ 一字不差） | 70%（人设模型复用，但走 QQ 协议有风控） |
| 延迟 | 400ms~2s（和 QQ 本地响应相当） | 3~10s，两次 QQ 服务端跳转 |
| 风险 | ✅ 零风险：纯内部 HTTP，不过 QQ 协议 | ⚠️ 高风险：闲置小号高频发私聊会触发腾讯风控 → 两个号一起冻结 |
| 开发量 | 小：1 个代理 route + FAB 组件（约 300 行）+ 复用 `ai` 包 | 中：多一套「发送消息 → 匹配回包事件 → 解绑定 userId」的关联逻辑 |
| 会话隔离 | ✅ 原生：`username = web_<userId>` + 自己传 `session_id`，**QQ 会话和网页会话完全隔离，互不串记忆** | ❌ 乱：只有一个虚拟小号，多网页用户共用一个会话上下文，要靠拼前缀隔离 system prompt，有侵入性 |
| 走不走得通的前置依赖 | AstrBot ≥ v4.18.0 + 网络 6185 互通（同机最省事） | 另一个闲置 QQ 号 + 双 NappCat 实例 + 高频限流 |

---

## 路线 A · AstrBot OpenAPI 技术细节（落地时对照用）

### AstrBot 侧用户 5 分钟配置（等用户回来让他先做）
1. AstrBot WebUI → 设置 → API Keys → **新建 Key，scope 只勾 `chat`（最小权限原则，不给 config/bot/provider）**
2. 记下 Key（`abk_` 开头）
3. 版本检查 ≥ v4.18.0（不够：`uv tool install astrbot --upgrade`）
4. 网络互通：
   - **情况 A（最省事最安全）：AstrBot 与粉丝站同机** → 粉丝站 `.env` 填 `http://127.0.0.1:6185`
   - **情况 B（不同机）：**
     - 同局域网：填内网 IP + 防火墙放行 6185（仅允许粉丝站机器访问，IP 白名单）
     - AstrBot 在家 NAS/电脑（粉丝站在公网 Netlify/Vercel）：cpolar / ngrok / frp 内网穿透 6185 → 拿 HTTPS 公网地址填 `.env`；Nginx 反代时限制只允许 `/api/v1/chat*` 路径，其他 AstrBot WebUI 路径全拦

### 请求格式（后端代理照着写）
```http
POST ${ASTRBOT_API_BASE}/api/v1/chat
Authorization: Bearer ${ASTRBOT_API_KEY}
Content-Type: application/json

{
  "username":   "web_user_<User.id>",    // 游客 = "web_guest_<md5(ip)>"
  "session_id":"conv_<uuid>",            // 不传自动新建，传则续上下文
  "message":    "达妮娅今晚吃什么？",     // 纯文本，与 QQ 用户发送格式一致
  "stream":     true                     // 必须 true，打字机效果
}
```
### 响应格式（SSE 透传，直接喂给 Vercel `ai` 包的 `useChat`）
```
data: { "type": "message_delta", "content": "呜…",           "delta_type": "text" }
data: { "type": "message_delta", "content": "草莓蛋糕🍰",      "delta_type": "text" }
data: { "type": "message_delta", "content": "一起吃呀🫧",       "delta_type": "text" }
data: { "type": "stop", "tokens": { "input": 33, "output": 28 } }
```

### 粉丝站新增环境变量（3 条）
```env
# ===== 达妮娅 AstrBot QQ 机器人 · 对话对接（路线 A）=====
ASTRBOT_API_BASE=https://你的域名或内网IP:6185    # 结尾不要 /；同机 127.0.0.1
ASTRBOT_API_KEY=abk_xxxxxxxxxxxxxxxx              # scope=chat 的 Key，**绝对不许 NEXT_PUBLIC_ 开头**
# ASTRBOT_PERSONA_NAME=达妮娅                     # 可选：多人格时指定
```

### 粉丝站代码改动清单（波次 1 MVP · TDD 落地顺序）
| 序号 | 文件 | 动作 | 说明 |
|---|---|---|---|
| 1 | `src/lib/chat-rate-limit.ts` | 新增 | 拷贝 upload-rate-limit.ts 改规则：游客 5/日/IP、登录 60/时/user、全站 1000/日 兜底 |
| 2 | `src/app/api/chat/route.ts` | 新增 | POST 代理：auth → 限流 → username/session_id 组装 → fetch AstrBot → **SSE ReadableStream 直接透传（不缓存整句，省内存）**；AstrBot 连接失败 A-1 RED 级：统一回复「达妮娅现在去睡觉啦💤 晚点再来哦～」不暴露技术细节 |
| 3 | `src/components/shared/daniya-chat-fab.tsx` | 新增 | FAB + Dialog：复用 shadcn/ui Dialog 样式（毛玻璃+粉/金边）；Vercel `useChat()` 管消息/输入/loading/打字机；左气泡：达妮娅圆立绘+毛玻璃；右气泡：用户 image 头像（复用头像裁剪）+粉色实心；loading=「达妮娅正在打泡泡 🫧…」animate-pulse |
| 4 | `src/app/layout.tsx` | 修改 | `</body>` 前挂 `<DaniyaChatFAB />`；全站右下角可触达，无侵入 |
| 5 | `.env.example` | 修改 | 新增 3 条 ASTRBOT 变量空模板 |
| 6 | `README.md` | 修改 | 新增「AI 达妮娅对话」章节；待办清单移动「聊天 AI」为波次 1 已完成（落地后再改） |

### 波次 2 体验（波 1 跑一周再上）
- Prisma `Conversation` / `ChatMessage` 新模型 + `npx prisma db push`
- 对话框侧栏：会话列表 / 新建 / 删除
- 4 个快捷 chip（「给我看今天的新作品？」「达妮娅生日？」「推荐 3 张插画？」「QQ 和网页的你是同一人吗？」）
- `/post/<slug>` / `/tag/<tag>` 正则匹配自动包 `next/link` 跳转

### 波次 3 完全体
- RAG 知识库（MDX 作品 + character 文案 embedding 入库 → 回复引用站内链接）
- 管理员 dashboard 审查用户聊天记录（合规留存）
- 敏感词过滤 + 4 种回复模式表情（日常/瞌睡/兴奋/生气）

---

## ⏳ 待用户回归后 · 需要先回答的 3 个前置条件（回答完我立刻按 TDD 开工）

> 填完此表 = 可以开始写代码

| 编号 | 问题 | 待用户填写（空=暂未答复） | 可选值 |
|---|---|---|---|
| ① | AstrBot 版本 ≥ v4.18.0 吗？ | __ | "是 / 否，需要你给升级命令" |
| ② | AstrBot 与粉丝站网络互通吗？ | __ | A=同机部署（最省事）<br>B=不同机同局域网<br>C=不同机需内网穿透/cpolar |
| ③ | 入口形态 + 历史存储？ | 入口：__<br>存储：__ | 入口：FAB悬浮(推荐) / 独立/chat / 两者都要<br>存储：Prisma DB(推荐) / 仅浏览器localStorage |

---

## 验证命令（用户回来先手动跑 1 条，确认网络链路 OK 再合并代码）

```bash
# 用 curl 先手工测 AstrBot OpenAPI 是否真的能从粉丝站机器连通
curl -X POST "${ASTRBOT_API_BASE}/api/v1/chat" \
  -H "Authorization: Bearer ${ASTRBOT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"username":"web_test_user_001","session_id":"test_conv_001","message":"达妮娅你好呀，说一句自我介绍？","stream":false}'
```
> 预期：返回 JSON，含达妮娅人设的回复；如果通 → 代码侧 99% 能直接复用，只需写前端组件包装即可。

---

## 其他说明

- **成本**：复用你现有 AstrBot 已配置好的 LLM Key（不用再买第二个 key）。粉丝站流量 < QQ 群流量时，账单增幅通常 < 10%/月。
- **安全**：ASTRBOT_API_KEY 只在 Next.js Route Handler（服务端）里读 process.env；前端组件拿不到；反代路径白名单 + IP 白名单 = 外部刷不到你的 AstrBot 管理后台。
- **体验一致性**：「QQ 上的达妮娅」和「粉丝站上的达妮娅」人格统一，但会话独立（不会把 QQ 粉丝的聊天暴露给网页用户，也不会反串记忆）——这点比重新搭一套独立 AI 好太多。
- **回到本文件的方式**：后续用户说「回到聊天 AI 的事」或「继续 AstrBot 对接」时，直接打开此文件按上表核对 3 个前置条件即可启动 TDD 流程。
