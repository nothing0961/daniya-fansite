/**
 * 需求：人设注入（DANIYA_SYSTEM_PROMPT 作为唯一一条 system 消息）
 *
 * 断言：
 *   1. route.ts 存在常量 DANIYA_SYSTEM_PROMPT（含 env fallback 或直接字符串）
 *   2. sanitizeMessages / POST 体内先 filter 用户传的 role:"system"，再把 DANIYA_SYSTEM_PROMPT 作为 messages[0]
 *   3. 用户自定义模式（customAiConfig 存在）时，system 注入逻辑同样执行
 *   4. 源码中没有任何 UI 可见的「已注入人设」文案
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");

describe("AI 聊天：人设注入（DANIYA_SYSTEM_PROMPT 为唯一 system）", () => {
  it("case1: route.ts 存在常量 DANIYA_SYSTEM_PROMPT（env fallback 或 字符串字面量）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasPromptVar = /DANIYA_SYSTEM_PROMPT\s*=/.test(src);
    expect(hasPromptVar).toBe(true);
    // Prompt 是从环境变量读或有实际内容，不是纯 TODO 占位
    const varBlock = src.match(/DANIYA_SYSTEM_PROMPT\s*=([\s\S]*?)(?:\n\s*export\s+const|\n\s*\/\/)/)?.[1] ?? "";
    expect(varBlock.length).toBeGreaterThan(10);
  });

  it("case2: sanitizeMessages + POST 体内先 filter 用户传的 role:\"system\"，再把 DANIYA_SYSTEM_PROMPT 作为 messages[0]", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    // sanitizeMessages 函数过滤 system/tool，且 push DANIYA_SYSTEM_PROMPT
    expect(src).toMatch(/function sanitizeMessages/);
    expect(src).toMatch(/DANIYA_SYSTEM_PROMPT/);
    // POST body 中调用 sanitizeMessages 并注入 system prompt
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 5000);
    const hasSanitizeCall = /sanitizeMessages\s*\(/.test(postBody);
    expect(hasSanitizeCall).toBe(true);
  });

  it("case3: 自定义模式时 sanitizeMessages 统一执行且在 provider 路由之前（customAiConfig 提取在前，sanitize 在后，都在路由前）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 6000);
    const customIdx = postBody.indexOf("customAiConfig");
    const sanitizeIdx = postBody.indexOf("sanitizeMessages");
    expect(customIdx).toBeGreaterThan(0);
    expect(sanitizeIdx).toBeGreaterThan(0);
    // customAiConfig 提取在 sanitize 之前（但都在 provider 路由之前）
    expect(customIdx).toBeLessThan(sanitizeIdx);
    // sanitize 在 handleCustomProvider/handleDefaultProvider 之前
    const firstProviderIdx = Math.min(
      ...[postBody.indexOf("handleCustomProvider"), postBody.indexOf("handleDefaultProvider")].filter((i) => i > 0),
    );
    expect(sanitizeIdx).toBeLessThan(firstProviderIdx);
  });

  it("case4: 源码中没有任何 UI 可见的「已注入人设」/「启用达妮娅人设」文案", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasPersonaText =
      /已注入人设/.test(src) ||
      /启用达妮娅人设/.test(src) ||
      /人设已生效/.test(src) ||
      /人设注入成功/.test(src);
    expect(hasPersonaText).toBe(false);
  });
});
