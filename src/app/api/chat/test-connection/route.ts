/**
 * POST /api/chat/test-connection — 探测用户自定义 AI provider 是否兼容 OpenAI 协议
 *
 * 启发式 6 种协议识别（按优先级顺序）：
 *   1. anthropic.com → claude-native（不兼容，需要中转）
 *   2. googleapis.com / generativelanguage → gemini-native（不兼容，需要代理）
 *   3. 401/403 + invalid_api_key → api-key-invalid
 *   4. 2xx + choices[0].message.content + object="chat.completion" → openai-compatible（成功）
 *   5. localhost + ECONNREFUSED / Timeout → local-ollama-unreachable
 *   6. 其他所有情况 → unknown-non-openai
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { isUnsafeHost } from "../route";

export const runtime = "edge";

export function classifyProtocol(params: {
  baseURL: string;
  status: number;
  respText: string;
  errName?: string;
}): { protocol: string; ok: boolean; docs?: string; hint?: string } {
  const base = (params.baseURL ?? "").toLowerCase();
  const text = params.respText ?? "";
  const errName = (params.errName ?? "").toLowerCase();

  // 1. Anthropic Claude 原生协议（非 OpenAI 兼容）
  if (base.includes("anthropic.com")) {
    return {
      ok: false,
      protocol: "claude-native",
      docs: "https://docs.anthropic.com/zh-CN/docs/claude-code → 使用 OpenRouter / 硅基流动中转",
    };
  }

  // 2. Google Gemini 原生协议（非 OpenAI 兼容）
  if (base.includes("googleapis.com") || base.includes("generativelanguage")) {
    return {
      ok: false,
      protocol: "gemini-native",
      docs: "https://docs.api.jamesliu.dev 或 siliconflow.cn（Gemini 兼容代理）",
    };
  }

  // 3. API Key 无效：401/403 + invalid_api_key 关键词
  const status = params.status ?? 0;
  if (status === 401 || status === 403) {
    return {
      ok: false,
      protocol: "api-key-invalid",
      hint: "请在控制台确认你的 API Key 是否有效且已开通对应模型权限（无效 key 检查）",
    };
  }

  // 3.5 HTTP 400：请求参数错误（常见原因：模型名称不正确、参数格式错误）
  if (status === 400) {
    return {
      ok: false,
      protocol: "bad-request",
      hint: "请求参数错误！请检查模型名称是否正确。DeepSeek 正确模型名：deepseek-chat / deepseek-v2-chat / deepseek-r1-chat",
    };
  }
  // 解析响应 JSON 找 invalid_api_key / invalidApiKey / error.code=INVALID_API_KEY
  try {
    const json = JSON.parse(text);
    if (
      json?.invalid_api_key ||
      json?.invalidApiKey ||
      json?.error?.code === "INVALID_API_KEY" ||
      json?.error?.invalid_api_key
    ) {
      return {
        ok: false,
        protocol: "api-key-invalid",
        hint: "请在控制台确认你的 API Key 是否有效且已开通对应模型权限",
      };
    }
  } catch {
    // 不是 JSON，跳过
  }

  // 4. OpenAI 兼容：2xx + choices[0].message.content + (object="chat.completion" 或 id/created/model 任意两个)
  if (status >= 200 && status < 300) {
    try {
      const json = JSON.parse(text);
      const hasChoicesContent =
        Array.isArray(json?.choices) &&
        json.choices.length > 0 &&
        typeof json.choices[0]?.message?.content === "string";
      const hasObject = json?.object === "chat.completion";
      const idOk = typeof json?.id === "string";
      const createdOk = typeof json?.created === "number";
      const modelOk = typeof json?.model === "string";
      const hasCommonFields =
        [idOk, createdOk, modelOk].filter(Boolean).length >= 2;
      if (hasChoicesContent && (hasObject || hasCommonFields)) {
        return {
          ok: true,
          protocol: "openai-compatible",
        };
      }
    } catch {
      // 不是 JSON，跳过
    }
  }

  // 5. 本地 Ollama 无法访问：localhost + ECONNREFUSED / Timeout / TypeError (fetch failed)
  const isLocalhost =
    base.includes("localhost") ||
    base.includes("127.0.0.1") ||
    base.includes("127.");
  const isConnError =
    errName.includes("timeout") ||
    errName.includes("econnrefused") ||
    errName.includes("typeerror") ||
    /timeout|超时|ECONNREFUSED/i.test(params.errName ?? "");
  if (isLocalhost && (isConnError || status === 0)) {
    return {
      ok: false,
      protocol: "local-ollama-unreachable",
      docs: "用 cloudflare cloudflared 1 命令内网穿透；或购买 GPU 云服务器部署（腾讯云/阿里云 GPU）",
    };
  }

  // 6. 兜底：未知 / 非 OpenAI 兼容
  return {
    ok: false,
    protocol: "unknown-non-openai",
    docs: "两个方向任选：① 搜 '<provider名> openai compatible' 找官方文档；② 用 OpenRouter（openrouter.ai，支持 200+ 模型，原生 OpenAI 格式）—— 代理 proxy forward 中转教程",
  };
}

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: {
    baseURL?: string;
    apiKey?: string;
    model?: string;
  } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      classifyProtocol({
        baseURL: "",
        status: 400,
        respText: "",
        errName: "BadJson",
      }),
      { status: 200 },
    );
  }

  const baseURL = body.baseURL ?? "";
  const apiKey = body.apiKey ?? "";
  const model = body.model ?? "";

  // SSRF 防护：阻止内网地址探测（localhost / 127.* 作为 Ollama 检测特例放行）
  const isLocalForOllama =
    baseURL.toLowerCase().includes("localhost") ||
    baseURL.toLowerCase().includes("127.");
  if (!isLocalForOllama && isUnsafeHost(baseURL)) {
    return NextResponse.json(
      { ok: false, protocol: "ssrf-blocked", hint: "内网地址不允许连接测试" },
      { status: 200 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  let status = 0;
  let respText = "";
  let errName = "";
  try {
    const targetUrl = normalizeUrl(baseURL) + "/chat/completions";
    const resp = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
        stream: false,
      }),
      signal: controller.signal,
    });
    status = resp.status;
    respText = await resp.text();
  } catch (e) {
    if ((e as Error)?.name) {
      errName = (e as Error).name;
    }
    if ((e as Error)?.message) {
      errName = errName + " " + (e as Error).message;
    }
    if ((e as any)?.code) {
      errName = errName + " " + String((e as any).code);
    }
  } finally {
    clearTimeout(timeoutId);
  }

  const result = classifyProtocol({
    baseURL,
    status,
    respText,
    errName,
  });

  return NextResponse.json(result, { status: 200 });
}
