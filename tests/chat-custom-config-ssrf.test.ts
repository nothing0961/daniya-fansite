/**
 * 需求：自定义模式 SSRF 防护（复用默认模式的 SSRF 拒绝函数）
 *
 * 断言：
 *   1. 发送 POST /api/chat 自定义模式 customAiConfig.baseURL 内网 → 400 SSRF_FORBIDDEN
 *   2. 自定义模式 baseURL=https://api.example.com/v1（公网）→ 放行，不触发 SSRF 400
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");

describe("AI 聊天：自定义模式 SSRF 防护（复用 isUnsafeHost）", () => {
  it("case1: 自定义模式 customAiConfig.baseURL 内网 → 400 SSRF_FORBIDDEN", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 10000);
    const customIdx = postBody.indexOf("customAiConfig");
    expect(customIdx).toBeGreaterThan(0);
    const customBlock = postBody.slice(customIdx, customIdx + 5000);
    const hasCustomSsrfCheck =
      /customAiConfig.*baseURL[\s\S]{0,500}(isUnsafeHost|isSSRF|blockSSRF|checkSSRF)/i.test(customBlock) ||
      /(isUnsafeHost|isSSRF|blockSSRF|checkSSRF)[\s\S]{0,500}customAiConfig.*baseURL/i.test(customBlock) ||
      /customAiConfig[\s\S]{0,1000}SSRF_FORBIDDEN/.test(customBlock);
    expect(hasCustomSsrfCheck).toBe(true);
  });

  it("case2: 自定义模式 baseURL=https://api.example.com/v1（公网）→ 放行，不触发 SSRF 400", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 10000);
    const hasPublicCheck =
      /isUnsafeHost|isSSRF|blockSSRF|checkSSRF/i.test(postBody);
    expect(hasPublicCheck).toBe(true);
    const ssrfFnMatch = src.match(
      /function\s+(isUnsafeHost|isSSRF|blockSSRF|checkSSRF)[\s\S]*?\}/m,
    )?.[0] ?? "";
    if (ssrfFnMatch) {
      const hasElseAllow = /return\s+false|!unsafe|else|public/.test(ssrfFnMatch);
      expect(hasElseAllow).toBe(true);
    } else {
      const hasAllowLogic =
        /!isUnsafeHost|if\s*\(\s*!.*ssrf|不匹配.*内网|非内网.*放行/.test(postBody);
      expect(hasAllowLogic).toBe(true);
    }
  });
});
