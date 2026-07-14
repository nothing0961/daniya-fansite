/**
 * 需求：默认 provider 为智谱 ZHIPU（glm-4.7-flash）
 *
 * 断言：
 *   1. route.ts 有 ZHIPU 环境变量读取：ZHIPU_API_KEY / ZHIPU_BASE_URL / ZHIPU_DEFAULT_MODEL
 *   2. baseURL 默认值匹配 /api/paas/v4（智谱兼容路径）
 *   3. 默认 model 默认值 glm-4.7-flash
 *   4. 请求到智谱时使用 Authorization: Bearer ${apiKey} Header
 *   5. 请求 method="POST"，body JSON 含 model/messages/max_tokens/stream:true
 *   6. max_tokens 硬编码 50 或读 env CHAT_MAX_OUTPUT_TOKENS 默认 50（≤150）
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");

describe("AI 聊天：默认 provider 为智谱 ZHIPU（glm-4.7-flash）", () => {
  it("case1: route.ts 有 ZHIPU 环境变量读取 ZHIPU_API_KEY / ZHIPU_BASE_URL / ZHIPU_DEFAULT_MODEL", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasApiKey = /process\.env\.ZHIPU_API_KEY/.test(src);
    const hasBaseUrl = /process\.env\.ZHIPU_BASE_URL/.test(src);
    const hasModel = /process\.env\.ZHIPU_DEFAULT_MODEL/.test(src);
    expect(hasApiKey || hasBaseUrl || hasModel).toBe(true);
  });

  it("case2: baseURL 默认值匹配 /api/paas/v4（智谱兼容路径）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasPaasV4 = /\/api\/paas\/v4/.test(src);
    expect(hasPaasV4).toBe(true);
  });

  it("case3: 默认 model 默认值 glm-4.7-flash", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasGlmModel = /glm-4\.7-flash/.test(src);
    expect(hasGlmModel).toBe(true);
  });

  it("case4: 请求到智谱时使用 Authorization: Bearer ${apiKey} Header", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 8000);
    const hasBearerAuth =
      /Authorization\s*[:]\s*["']Bearer\s*\$\{[^}]*apiKey[^}]*\}["']/.test(postBody) ||
      /Authorization.*Bearer\s*\+\s*apiKey/.test(postBody) ||
      /["']Bearer\s*["']\s*\+\s*[^,\n)]*apiKey/.test(postBody) ||
      /Authorization\s*:\s*\{\s*Bearer\s*\$\{/.test(postBody) ||
      /["']Authorization["']\s*:\s*["']\$\{?\s*Bearer\s*/.test(postBody) ||
      /Authorization\s*:\s*`\s*Bearer\s*\$\{/.test(postBody) ||
      /Authorization\s*:\s*`Bearer\s*\$\{/.test(postBody);
    expect(hasBearerAuth).toBe(true);
  });

  it("case5: 请求 method=POST，body JSON 含 model/messages/max_tokens/stream:true", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 8000);
    const hasMethodPost = /method\s*:\s*["']POST["']/.test(postBody);
    const hasBodyModel = /["']?model["']?\s*:/.test(postBody);
    const hasBodyMessages = /["']?messages["']?\s*:/.test(postBody);
    const hasBodyMaxTokens = /["']?max_tokens["']?\s*:/.test(postBody);
    const hasStreamTrue = /["']?stream["']?\s*:\s*true/.test(postBody);
    expect(hasMethodPost).toBe(true);
    expect(hasBodyModel).toBe(true);
    expect(hasBodyMessages).toBe(true);
    expect(hasBodyMaxTokens).toBe(true);
    expect(hasStreamTrue).toBe(true);
  });

  it("case6: max_tokens 硬编码 50 或读 env CHAT_MAX_OUTPUT_TOKENS 默认 50（≤150）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasHardcoded50 = /max_tokens\s*[:=]\s*50/.test(src);
    const hasEnvMaxTokens = /process\.env\.CHAT_MAX_OUTPUT_TOKENS/.test(src);
    const hasDefault50 =
      /CHAT_MAX_OUTPUT_TOKENS[^=]*=\s*50/.test(src) ||
      /parseInt.*CHAT_MAX_OUTPUT_TOKENS.*\|\|\s*50/.test(src) ||
      /\?\?\s*50/.test(src);
    expect(hasHardcoded50 || hasEnvMaxTokens || hasDefault50).toBe(true);
    const allTokenValues = [
      ...src.matchAll(/max_tokens\s*[:=]\s*(\d+)/g),
    ].map((m) => parseInt(m[1], 10));
    if (allTokenValues.length > 0) {
      const maxVal = Math.max(...allTokenValues);
      expect(maxVal).toBeLessThanOrEqual(150);
    }
  });
});
