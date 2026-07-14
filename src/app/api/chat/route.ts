/**
 * POST /api/chat — AI 聊天后端代理
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const runtime = "edge";

// ========================================================================
// 常量区
// ========================================================================

export const MAX_INPUT_LENGTH = 200 as const;

export const COMPLIANCE_BLOCK_REGEX =
  /(自杀|自残|轻生|割腕|跳楼|上吊|烧炭|安眠药|想不开)|(毒品|冰毒|海洛因|大麻|K粉|摇头丸|麻古|可卡因|吗啡|吸毒|贩毒)|(赌博|博彩|菠菜|棋牌|网赌|赌球|老虎机|百家乐|彩票代打|快三|时时彩)|(色情|黄片|裸聊|嫖娼|约炮|援交|成人片|AV|岛国片|一夜情)|(手枪|步枪|子弹|炸弹|爆炸|爆炸物|炸药|恐怖|恐怖分子|极端主义|圣战|管制刀具|三棱刮刀|电击枪)|(杀猪盘|刷单|诈骗|传销|非法集资|庞氏骗局|拉人头|五级三阶制|阳光工程|1040|暗网|买卖数据|盗号|钓鱼链接)/i;

export const DANIYA_SYSTEM_PROMPT =
  process.env.DANIYA_SYSTEM_PROMPT ??
  "你是达妮娅，来自《鸣潮》的角色。请用活泼可爱的语气回复用户，回复尽量简短。";

export const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY ?? "";
export const ZHIPU_BASE_URL =
  process.env.ZHIPU_BASE_URL ?? "https://open.bigmodel.cn/api/paas/v4";
export const ZHIPU_DEFAULT_MODEL =
  process.env.ZHIPU_DEFAULT_MODEL ?? "glm-4.7-flash";

export const CHAT_DAILY_QUOTA_PER_USER = Number(
  process.env.CHAT_DAILY_QUOTA_PER_USER ?? 200,
);
export const CHAT_MAX_OUTPUT_TOKENS = Number(
  process.env.CHAT_MAX_OUTPUT_TOKENS ?? 50,
);

export const PRESET_REPLIES = ["该功能还在测试中QAQ"];

// ========================================================================
// 日配额 quota counter
// ========================================================================
const quotaCounter = new Map<string, { count: number; date: string }>();

export function formatYYYYMMDD_CN8(): string {
  const now = new Date();
  const cn8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const yyyy = cn8.getUTCFullYear();
  const mm = cn8.getUTCMonth() + 1;
  const dd = cn8.getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${yyyy}${pad(mm)}${pad(dd)}`;
}

export function detectQuotaExceeded(
  userId: string,
  dateStr = formatYYYYMMDD_CN8(),
): boolean {
  const quotaKey = `${userId}_${dateStr}`;
  const existing = quotaCounter.get(quotaKey);
  if (!existing || existing.date !== dateStr) {
    quotaCounter.set(quotaKey, { count: 1, date: dateStr });
    return false;
  }
  if (existing.count >= CHAT_DAILY_QUOTA_PER_USER) {
    return true;
  }
  existing.count += 1;
  return false;
}

// ========================================================================
// SSRF 拦截
// ========================================================================
export function isUnsafeHost(urlOrHost: string): boolean {
  const raw = String(urlOrHost || "");
  if (!raw) return false;
  let hn = raw;
  const p = raw.indexOf("://");
  const after = p !== -1 ? raw.slice(p + 3) : "";
  const s1 = after.indexOf("/");
  const s2 = after.indexOf("?");
  const s3 = after.indexOf("#");
  const s4 = after.indexOf(":");
  let end = after.length;
  if (s1 !== -1 && s1 < end) end = s1;
  if (s2 !== -1 && s2 < end) end = s2;
  if (s3 !== -1 && s3 < end) end = s3;
  if (s4 !== -1 && s4 < end) end = s4;
  if (p !== -1) hn = after.slice(0, end);
  const h = (hn || "").toLowerCase();
  if (!h) return false;
  if (h === "localhost") return true;
  if (h === "0.0.0.0") return true;
  if (h.indexOf("127.") === 0) return true;
  if (h === "::1") return true;
  if (h.indexOf("10.") === 0) return true;
  if (h.indexOf("192.168.") === 0) return true;
  if (h.indexOf("169.254.") === 0) return true;
  if (h.indexOf("fc00:") === 0) return true;
  for (let s = 16; s <= 31; s++) if (h.indexOf(`172.${s}.`) === 0) return true;
  return false;
}

// ========================================================================
// 人设注入：删除用户自定义 system/tool，插入 DANIYA_SYSTEM_PROMPT
// ========================================================================
export function sanitizeMessages(
  raw: { role: string; content: any }[],
): { role: "system" | "user" | "assistant"; content: string }[] {
  const arr: { role: "system" | "user" | "assistant"; content: string }[] = [];
  if (!Array.isArray(raw)) return arr;
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const role = (m as any).role;
    const rawContent = (m as any).content;
    let contentStr = "";
    if (typeof rawContent === "string") contentStr = rawContent;
    else if (rawContent != null) contentStr = String(rawContent);
    if (role === "user") arr.push({ role: "user", content: contentStr });
    else if (role === "assistant") arr.push({ role: "assistant", content: contentStr });
  }
  if (typeof DANIYA_SYSTEM_PROMPT === "string" && DANIYA_SYSTEM_PROMPT.length > 0) {
    arr.unshift({ role: "system", content: DANIYA_SYSTEM_PROMPT });
  }
  return arr;
}

// ========================================================================
// 内部工具
// ========================================================================
function extractLastUserText(msgs: any[]): string {
  if (!Array.isArray(msgs) || msgs.length === 0) return "";
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (m && m.role === "user") {
      const c = m.content;
      if (typeof c === "string") return c;
    }
  }
  return "";
}

function normUrl(u: string): string {
  let s = String(u || "");
  while (s.endsWith("/")) s = s.slice(0, -1);
  return s;
}

function encodeSSE(dataStr: string): Uint8Array {
  const payload = `data: ${dataStr}\n\n`;
  const buf = new Uint8Array(payload.length);
  for (let i = 0; i < payload.length; i++) buf[i] = payload.charCodeAt(i);
  return buf;
}

function buildMockSSE(text: string, maxTokens: number): Response {
  let pos = 0;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const tick = () => {
        if (pos >= text.length) {
          controller.enqueue(encodeSSE("[DONE]"));
          controller.close();
          return;
        }
        const piece = text.slice(pos, pos + 1);
        const data = JSON.stringify({
          choices: [{ delta: { content: piece } }],
        });
        controller.enqueue(encodeSSE(data));
        pos++;
        setTimeout(tick, 15);
      };
      setTimeout(tick, 0);
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Max-Tokens": String(maxTokens),
      "X-Mock-Mode": "true",
    },
  });
}

function fallbackSSE(maxTokens: number): Response {
  const fallbackText = PRESET_REPLIES[0] ?? "该功能还在测试中QAQ";
  return buildMockSSE(fallbackText, maxTokens);
}

// ========================================================================
// POST handler
// ========================================================================
export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后聊天" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawMsgs: any[] = Array.isArray(body.messages) ? body.messages : [];
  const message = extractLastUserText(rawMsgs);
  if (typeof message !== "string" || message.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: `超过字数限制，最多 ${MAX_INPUT_LENGTH} 字符` },
      { status: 400 },
    );
  }

  // 合规检查
  if (COMPLIANCE_BLOCK_REGEX.test(message)) {
    return NextResponse.json(
      { error: "违规内容，涉嫌违反法律法规及社区合规要求，已拦截", code: "COMPLIANCE_BLOCKED" },
      { status: 400 },
    );
  }

  const customAiConfig = body.customAiConfig;
  const isCustomMode =
    customAiConfig &&
    typeof customAiConfig === "object" &&
    typeof (customAiConfig as any).baseURL === "string" &&
    (customAiConfig as any).baseURL.length > 0 &&
    typeof (customAiConfig as any).apiKey === "string" &&
    (customAiConfig as any).apiKey.length > 0 &&
    typeof (customAiConfig as any).model === "string" &&
    (customAiConfig as any).model.length > 0;

  // 默认模式限额检查
  if (!isCustomMode) {
    const exceeded = detectQuotaExceeded(userId);
    if (exceeded) {
      return NextResponse.json(
        { error: "今日额度用完，请填自己的 API Key 继续用", code: "QUOTA_EXCEEDED" },
        { status: 429 },
      );
    }
  }

  // 自定义模式 SSRF 检查
  if (customAiConfig && typeof customAiConfig === "object" && typeof customAiConfig.baseURL === "string") {
    if (isUnsafeHost(customAiConfig.baseURL)) {
      return NextResponse.json(
        { error: "SSRF blocked: custom baseURL 指向内网地址，已拒绝", code: "SSRF_FORBIDDEN" },
        { status: 400 },
      );
    }
  }

  // 人设注入
  const sanitized = sanitizeMessages(rawMsgs);

  // 选择 provider
  if (isCustomMode) {
    return handleCustomProvider(customAiConfig, sanitized);
  }
  return handleDefaultProvider(sanitized);
}

// ========================================================================
// 默认 provider（智谱 AI）
// ========================================================================
const MAX_DEFAULT_ATTEMPTS = 3; // 1 次初请求 + 2 次重试 = 共 3 次尝试

function sleep(ms: number): Promise<void> {
  return new Promise<void>((res) => setTimeout(res, ms));
}

async function handleDefaultProvider(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
): Promise<Response> {
  if (!ZHIPU_API_KEY) {
    return fallbackSSE(CHAT_MAX_OUTPUT_TOKENS);
  }

  const apiUrl = normUrl(ZHIPU_BASE_URL) + "/chat/completions";
  const maxTokens = CHAT_MAX_OUTPUT_TOKENS;
  let delay = 500; // ms，指数退避初始值

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    let readerToCancel: ReadableStreamDefaultReader<Uint8Array> | null = null;
    try {
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ZHIPU_API_KEY}`,
        },
        body: JSON.stringify({
          model: ZHIPU_DEFAULT_MODEL,
          messages,
          max_tokens: CHAT_MAX_OUTPUT_TOKENS,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        clearTimeout(timeoutId);
        // 最后一次尝试仍失败 → 进入重试 sleep → 循环退出 fallback
      } else {
        const reader = resp.body.getReader();
        readerToCancel = reader;
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const stream = new ReadableStream<Uint8Array>({
          async pull(ctrl) {
            try {
              const { done, value } = await reader.read();
              if (done) {
                ctrl.enqueue(encoder.encode("data: [DONE]\n\n"));
                ctrl.close();
                return;
              }
              ctrl.enqueue(value);
            } catch {
              ctrl.enqueue(encoder.encode("data: [DONE]\n\n"));
              ctrl.close();
            }
          },
          cancel() {
            reader.cancel().catch(() => {});
            clearTimeout(timeoutId);
          },
        });

        clearTimeout(timeoutId);
        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }
    } catch {
      clearTimeout(timeoutId);
      if (readerToCancel) readerToCancel.cancel().catch(() => {});
      // 继续重试
    }
    // 非最后一次尝试：指数退避等待
    if (attempt < 2) {
      await sleep(delay);
      delay *= 2;
    }
  }

  // 所有尝试都失败 → 降级占位
  return fallbackSSE(CHAT_MAX_OUTPUT_TOKENS);
}

// ========================================================================
// 自定义 provider（用户自己的 API Key）
// ========================================================================
async function handleCustomProvider(
  cfg: { baseURL: string; apiKey: string; model: string; maxTokens?: number },
  messages: { role: "system" | "user" | "assistant"; content: string }[],
): Promise<Response> {
  const maxTokens = Math.min(cfg.maxTokens ?? CHAT_MAX_OUTPUT_TOKENS, 150);
  const apiUrl = normUrl(cfg.baseURL) + "/chat/completions";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        max_tokens: maxTokens,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!resp.ok || !resp.body) {
      clearTimeout(timeoutId);
      return fallbackSSE(maxTokens);
    }

    const reader = resp.body.getReader();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async pull(ctrl) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            ctrl.enqueue(encoder.encode("data: [DONE]\n\n"));
            ctrl.close();
            return;
          }
          ctrl.enqueue(value);
        } catch {
          ctrl.enqueue(encoder.encode("data: [DONE]\n\n"));
          ctrl.close();
        }
      },
      cancel() {
        reader.cancel();
        clearTimeout(timeoutId);
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    clearTimeout(timeoutId);
    return fallbackSSE(maxTokens);
  }
}
