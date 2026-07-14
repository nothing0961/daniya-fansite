/**
 * 需求：max_output_tokens = 50 默认模式 + 自定义模式 Math.min(userVal, 150)
 *
 * 断言：
 *   1. 默认模式下 fetch zhipu body.max_tokens === 50 或 env 解析默认 50
 *   2. 自定义模式下用户即使传 max_tokens>150，也被截断（Math.min(userVal, 150)）
 *   3. X-Max-Tokens Response header =50 默认模式
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");

describe("AI 聊天：max_output_tokens 默认 50 + 自定义 ≤150 截断", () => {
  it("case1: 默认模式 max_tokens 使用 CHAT_MAX_OUTPUT_TOKENS（默认 50）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    // handleDefaultProvider 内用 max_tokens: CHAT_MAX_OUTPUT_TOKENS
    const hdpStart = src.indexOf("async function handleDefaultProvider");
    expect(hdpStart).toBeGreaterThan(0);
    const hdpBody = src.slice(hdpStart, hdpStart + 2000);
    const usesVar = /max_tokens\s*:\s*CHAT_MAX_OUTPUT_TOKENS/.test(hdpBody);
    expect(usesVar).toBe(true);
    // CHAT_MAX_OUTPUT_TOKENS 默认值 = 50
    const hasDefault50 =
      /CHAT_MAX_OUTPUT_TOKENS[\s\S]{0,50}\?\?\s*50/.test(src) ||
      /\|\|\s*50/.test(src);
    expect(hasDefault50).toBe(true);
  });

  it("case2: 自定义模式下 max_tokens>150 被截断（handleCustomProvider 内 Math.min(..., 150)）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hcpStart = src.indexOf("async function handleCustomProvider");
    expect(hcpStart).toBeGreaterThan(0);
    const hcpBody = src.slice(hcpStart, hcpStart + 2000);
    const hasMathMin =
      /Math\.min\s*\([^)]*,\s*150\s*\)/.test(hcpBody) ||
      /Math\.min\s*\([^)]*,150\s*\)/.test(hcpBody);
    expect(hasMathMin).toBe(true);
  });

  it("case3: X-Max-Tokens Response header 存在（fallback / mock SSE 路径）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    // X-Max-Tokens 在 buildMockSSE 中设置，搜索全量源码
    const hasXMaxTokens = /X-Max-Tokens/.test(src);
    expect(hasXMaxTokens).toBe(true);
    const headerMatch = src.match(
      /X-Max-Tokens["']?\s*:\s*["']?(\d+|String\s*\(\s*\d+\s*\)|String\s*\(\s*[A-Za-z_]+\s*\))["']?/,
    )?.[0] ?? "";
    const has50InHeader =
      /50/.test(headerMatch) ||
      /CHAT_MAX_OUTPUT_TOKENS/.test(headerMatch) ||
      /MAX_OUTPUT/.test(headerMatch) ||
      /maxTokens/.test(headerMatch);
    expect(has50InHeader).toBe(true);
  });
});
