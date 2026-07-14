/**
 * 需求：test-connection 路由协议检测
 *
 * 路由文件路径：src/app/api/chat/test-connection/route.ts
 * 注意：该文件目前不存在，测试前先 assert 文件存在，用 try/catch 包 fs.readFileSync
 *
 * 断言（6 cases）：
 *   1. anthropic.com → protocol="claude-native" + docs 含 anthropic 文档 URL
 *   2. googleapis.com / generativelanguage → protocol="gemini-native" + docs 含 gemini 代理教程 URL
 *   3. 响应体顶层有 choices[0].message.content 且有 object="chat.completion" → protocol="openai-compatible" ok=true 无 docs
 *   4. localhost + connect ECONNREFUSED/超时 → protocol="local-ollama-unreachable" + docs 含 cloudflared 内网穿透教程
 *   5. 响应有 invalid_api_key 或 HTTP 401/403 → protocol="api-key-invalid"，无 docs，仅 hint 含「无效」/「控制台确认」
 *   6. 响应格式都不匹配 → protocol="unknown-non-openai" + docs 含 OpenRouter + 搜代理关键词
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TEST_CONN_PATH = path.join(
  ROOT,
  "src/app/api/chat/test-connection/route.ts",
);

function readTestConnSrc(): string {
  try {
    return fs.readFileSync(TEST_CONN_PATH, "utf-8");
  } catch {
    return "";
  }
}

describe("AI 聊天：test-connection 路由协议检测", () => {
  it("case0: src/app/api/chat/test-connection/route.ts 文件存在", () => {
    try {
      fs.readFileSync(TEST_CONN_PATH, "utf-8");
      expect(true).toBe(true);
    } catch {
      expect(false).toBe(true);
    }
  });

  it("case1: 命中 anthropic.com 关键字 → protocol='claude-native' + docs 含 anthropic 文档 URL", () => {
    const src = readTestConnSrc();
    if (!src) return expect(false).toBe(true);
    const hasAnthropicDetect = /anthropic\.com/.test(src);
    expect(hasAnthropicDetect).toBe(true);
    const claudeNative = /protocol\s*[:=]\s*["']claude-native["']/.test(src);
    expect(claudeNative).toBe(true);
    const hasDocsAnthropic =
      /docs.*anthropic/i.test(src) || /anthropic.*docs/i.test(src) || /anthropic\.com.*docs/.test(src);
    expect(hasDocsAnthropic).toBe(true);
  });

  it("case2: 命中 googleapis.com / generativelanguage → protocol='gemini-native' + docs 含 gemini 代理教程 URL", () => {
    const src = readTestConnSrc();
    if (!src) return expect(false).toBe(true);
    const hasGoogleDetect =
      /googleapis\.com/.test(src) || /generativelanguage/.test(src);
    expect(hasGoogleDetect).toBe(true);
    const geminiNative = /protocol\s*[:=]\s*["']gemini-native["']/.test(src);
    expect(geminiNative).toBe(true);
    const hasDocsGemini =
      /docs.*gemini/i.test(src) || /gemini.*docs/i.test(src) || /gemini.*代理/i.test(src);
    expect(hasDocsGemini).toBe(true);
  });

  it("case3: 响应体顶层有 choices[0].message.content 且 object='chat.completion' → protocol='openai-compatible' ok=true 无 docs", () => {
    const src = readTestConnSrc();
    if (!src) return expect(false).toBe(true);
    const hasChoicesDetect =
      /choices\[0\].*message.*content/.test(src) ||
      /choices.*message.*content/.test(src);
    expect(hasChoicesDetect).toBe(true);
    const hasChatCompletion = /object\s*[:=]\s*["']chat\.completion["']/.test(src);
    expect(hasChatCompletion).toBe(true);
    const openaiCompatible = /protocol\s*[:=]\s*["']openai-compatible["']/.test(src);
    expect(openaiCompatible).toBe(true);
    const hasOkTrue = /ok\s*[:=]\s*true/.test(src);
    expect(hasOkTrue).toBe(true);
  });

  it("case4: localhost + connect ECONNREFUSED/超时 → protocol='local-ollama-unreachable' + docs 含 cloudflared 内网穿透教程", () => {
    const src = readTestConnSrc();
    if (!src) return expect(false).toBe(true);
    const hasLocalhostDetect = /localhost/.test(src);
    const hasConnRefused = /ECONNREFUSED/.test(src) || /timeout|超时/.test(src);
    expect(hasLocalhostDetect).toBe(true);
    expect(hasConnRefused).toBe(true);
    const localOllama = /protocol\s*[:=]\s*["']local-ollama-unreachable["']/.test(src);
    expect(localOllama).toBe(true);
    const hasCloudflared =
      /cloudflared/i.test(src) || /内网穿透/i.test(src) || /frp/i.test(src) || /ngrok/i.test(src);
    expect(hasCloudflared).toBe(true);
  });

  it("case5: 响应有 invalid_api_key 或 HTTP 401/403 → protocol='api-key-invalid'，无 docs，仅 hint 含「无效」/「控制台确认」", () => {
    const src = readTestConnSrc();
    if (!src) return expect(false).toBe(true);
    const hasInvalidKey =
      /invalid_api_key/.test(src) || /401|403/.test(src);
    expect(hasInvalidKey).toBe(true);
    const apiKeyInvalid = /protocol\s*[:=]\s*["']api-key-invalid["']/.test(src);
    expect(apiKeyInvalid).toBe(true);
    const hasHintInvalid = /无效|控制台确认|check.*console|confirm.*key/i.test(src);
    expect(hasHintInvalid).toBe(true);
  });

  it("case6: 响应格式都不匹配 → protocol='unknown-non-openai' + docs 含 OpenRouter + 搜代理关键词", () => {
    const src = readTestConnSrc();
    if (!src) return expect(false).toBe(true);
    const unknownNonOpenai = /protocol\s*[:=]\s*["']unknown-non-openai["']/.test(src);
    expect(unknownNonOpenai).toBe(true);
    const hasOpenRouter = /OpenRouter/i.test(src);
    expect(hasOpenRouter).toBe(true);
    const hasProxy = /代理|proxy|middleware|forward/i.test(src);
    expect(hasProxy).toBe(true);
  });
});
