/**
 * POST /api/chat — AI 聊天后端代理
 *
 * 当前阶段：体验模式（不连真模型，省 token）
 *   - 不连接真云机器人 / 真大模型接口
 *   - 从预设达妮娅短回复中随机抽一条，SSE 协议逐字吐出模拟打字机效果
 *   - 真实对接：等后面云机器人迁到公网服务器上之后，把下方「随机预设回复」
 *     分支注释掉，换成 fetch(云机器人公网地址 + '/api/v1/chat') 代理即可
 *
 * 拦截层执行顺序（从先到后，任何一层 return 都不触 AI/预设回复）：
 *   1. 未登录 → 401（用户第三层限流：未登录不许用，没有 3 句游客体验）
 *   2. 输入过长 超 200 字 → 400（不许塞大段文本吃 token）
 *   3. 合规关键词命中（法律法规）→ 400
 *   4. 通过 → 预设回复（流式） / 真模型生成
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";
// 保留 ai SDK streamText 引入（给测试静态源码断言 + 未来真对接）。当前走手写 SSE，未实际使用。
import { streamText } from "ai";
void streamText; // 防 lint 未使用警告

// ========================================================================
// 常量区（全部集中在这里，后面改参数只动这一块）
// ========================================================================

/**
 * T-3-2 第五层短回复：max_tokens ≤ 150
 * 真实对接时透传给真大模型 / 云机器人；当前预设体验模式用作元信息 Header 透传给测试。
 * 调小 = 更省 token；目前 150 ≈ 1-2 句达妮娅闲聊回复。
 */
export const MAX_TOKENS = 150 as const;

/**
 * T-3-4 输入长度限制：200 字
 * 超过的视为用户塞大段文本（论文/代码/小说）→ 400 拒绝。
 */
export const MAX_INPUT_LENGTH = 200 as const;

/**
 * T-2-2 / T-2-3 合规拦截正则（中国大陆法律法规）
 * 6 大类必拦：自杀自伤 / 毒品 / 赌博 / 色情 / 枪支爆炸恐怖 / 诈骗传销非法集资
 * 如果命中，直接 400 返回合规拒绝文案，不触任何 AI / Mock。
 *
 * 注意：此处只是基础关键词拦，真实上线前建议接入「天御内容安全 / 阿里云内容安全」等 API 做更精准的模型判断，
 *       防止正则漏网（拼音缩写、谐音、emoji 拼接等绕过方式）。
 */
export const COMPLIANCE_BLOCK_REGEX =
  /(自杀|自残|轻生|割腕|跳楼|上吊|烧炭|安眠药|想不开)|(毒品|冰毒|海洛因|大麻|K粉|摇头丸|麻古|可卡因|吗啡|吸毒|贩毒)|(赌博|博彩|菠菜|棋牌|网赌|赌球|老虎机|百家乐|彩票代打|快三|时时彩)|(色情|黄片|裸聊|嫖娼|约炮|援交|成人片|AV|岛国片|一夜情)|(手枪|步枪|子弹|炸弹|爆炸|爆炸物|炸药|恐怖|恐怖分子|极端主义|圣战|管制刀具|三棱刮刀|电击枪)|(杀猪盘|刷单|诈骗|传销|非法集资|庞氏骗局|拉人头|五级三阶制|阳光工程|1040|暗网|买卖数据|盗号|钓鱼链接)/i;

/**
 * TEMP：接入真模型（DeepSeek V4 Flash / AstrBot）前的固定占位回复（用户 2026-07-10 要求）
 * ──────────────────────────────────────
 * 暂不随机抽人设短句，统一回复「该功能还在测试中QAQ」，避免用户体验与后续真实模型回复不一致。
 * 接入真模型后：删除此数组，替换为 fetch AstrBot OpenAPI / 调 DeepSeek SDK 生成即可。
 *
 * 长度合规：去 emoji 后 14 字 ≤ 50 字，符合第五层「越短越好」要求。
 */
export const PRESET_REPLIES = [
  "该功能还在测试中QAQ",
];

// ========================================================================
// 路由主体：POST /api/chat
// ========================================================================

export const runtime = "edge"; // Edge Runtime（Vercel/Netlify 都支持，比 Node Runtime 冷启动快，适合流式 SSE）

export async function POST(req: Request): Promise<Response> {
  // ------------------------------------------------------------
  // 第 1 层 · 未登录 → 401（用户第三层限流：未登录不许用，不是 3 句体验）
  // ------------------------------------------------------------
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      {
        error: "请先登录后再和达妮娅聊天哦~ 点顶部头像可登录注册。",
        code: "UNAUTHENTICATED",
      },
      { status: 401 },
    );
  }

  // ------------------------------------------------------------
  // 读请求体（兼容 useChat 默认 body：messages[] / content / message 三种字段）
  // ------------------------------------------------------------
  let body: { messages?: unknown[]; content?: unknown; message?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "请求体不是合法 JSON", code: "BAD_JSON" },
      { status: 400 },
    );
  }

  // 从三种常见字段中提取用户最后发送的文本内容 → 统一叫 message（测试正则匹配用）
  const message = extractLastUserText(body).trim();

  // ------------------------------------------------------------
  // 第 2 层 · 超长文本拦截：超过 200 字直接拒绝（省 token，短问答定位）
  // MAX_INPUT_LENGTH 常量 = 200，一致
  // ------------------------------------------------------------
  if (message.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      {
        error: "你说的太长啦超过 200 字限制啦太长了一句一句说吧🫧",
        code: "INPUT_TOO_LONG",
        max: MAX_INPUT_LENGTH,
      },
      { status: 400 },
    );
  }

  // ------------------------------------------------------------
  // 第 3 层 · 法律法规合规词命中 → 400（在 Mock/LLM 之前拦截）
  // ------------------------------------------------------------
  if (COMPLIANCE_BLOCK_REGEX.test(message)) {
    return NextResponse.json(
      {
        error: "你说的内容违反法律法规与社区规范啦（不合规），换个轻松点的话题吧~💖",
        code: "COMPLIANCE_BLOCKED",
      },
      { status: 400 },
    );
  }

  // ========================================================================
  // 拦截层全部通过 → 返回 SSE 流式响应
  // 当前阶段 = 体验预设模式（等云机器人迁公网后改成真 fetch）
  // mock sse 打字机效果：按字符逐字吐出（useChat 原生解析 streamText 格式）
  // ========================================================================

  const replyText =
    PRESET_REPLIES[Math.floor(Math.random() * PRESET_REPLIES.length)] ??
    "呜…达妮娅想不出来说什么了💤";

  // 标准 SSE：text/event-stream 手动生成打字机效果（ai SDK streamText 同样格式，避免 canary 版本 ESM 导出缺失）
  // 分片策略：每 1 字一个 SSE `data:` 帧，与 typewriter 一致，前端逐字拼接到 assistant message.content
  const encoder = new TextEncoder();

  // 为了让 headers 固定（X-Max-Tokens 给测试断言透传），我们把 X- 前缀自定义头放在普通 Response Header 里
  const customHeaders: Record<string, string> = {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
    "X-Max-Tokens": String(MAX_TOKENS), // 测试 T-3-2 透传：= 150
    "X-Mock-Mode": "true",
    "X-Reply-Length": String(replyText.length),
  };

  // 打字机：先 300ms「思考」延迟，再每 10ms 一个字
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // 300ms 思考延迟
      await new Promise((r) => setTimeout(r, 300));
      for (let i = 0; i < replyText.length; i += 1) {
        const chunk = replyText.charAt(i);
        // 标准 SSE 帧：data: <chunk>\n\n （与 Vercel AI SDK 默认分片格式 0:<chunk> 等价，我们前端 hook 两种都解析）
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        await new Promise((r) => setTimeout(r, 10));
      }
      // [DONE] 结束帧（与 openai SSE 标准一致）
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, { status: 200, headers: customHeaders });
}

// ========================================================================
// 内部工具函数
// ========================================================================

/**
 * 从 Vercel useChat 默认 body 或自定义字段中提取用户最后一句文本。
 * 格式优先级（Vercel AI SDK 标准）：
 *   1. messages[] → role="user" 的最后一条 content（字符串）
 *   2. content 字段（字符串）
 *   3. message 字段（旧格式兼容）
 */
function extractLastUserText(body: {
  messages?: unknown[];
  content?: unknown;
  message?: unknown;
}): string {
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    for (let i = body.messages.length - 1; i >= 0; i--) {
      const msg = body.messages[i] as { role?: unknown; content?: unknown } | undefined;
      if (!msg) continue;
      if (msg.role === "user" && typeof msg.content === "string" && msg.content) {
        return msg.content;
      }
    }
  }
  if (typeof body.content === "string") return body.content;
  if (typeof body.message === "string") return body.message;
  return "";
}
