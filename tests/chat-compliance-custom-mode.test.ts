/**
 * 需求：自定义模式也先过合规（即使 customAiConfig 存在）
 *
 * 断言：
 *   1. POST body 即使存在 customAiConfig.baseURL/apiKey，先执行 COMPLIANCE_BLOCK_REGEX.test(message)
 *   2. 合规拦截在 customAiConfig 分支前（合规 index 更小）
 *   3. 自定义模式合规拦截仍返回 400 COMPLIANCE_BLOCKED code
 *   4. 自定义模式 max_tokens 仍硬限制到 ≤150
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");

describe("AI 聊天：自定义模式合规 + max_tokens 硬限制", () => {
  it("case1: 即使 customAiConfig 存在，先执行 COMPLIANCE_BLOCK_REGEX.test(message)", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 8000);
    const customIdx = postBody.indexOf("customAiConfig");
    expect(customIdx).toBeGreaterThan(0);
    const complianceIdx = postBody.search(/COMPLIANCE_BLOCK_REGEX|COMPLIANCE_BLOCKED/);
    expect(complianceIdx).toBeGreaterThan(0);
    expect(complianceIdx).toBeLessThan(customIdx);
    const hasComplianceTestBefore =
      /COMPLIANCE_BLOCK_REGEX\.test/.test(postBody.slice(0, customIdx + 1));
    expect(hasComplianceTestBefore).toBe(true);
  });

  it("case2: 合规拦截在 customAiConfig 分支前（合规 index 更小）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 8000);
    const complianceIdx = postBody.search(
      /if\s*\([^)]*COMPLIANCE_BLOCK_REGEX[^)]*\)/,
    );
    const customBranchIdx = postBody.search(
      /if\s*\([^)]*customAiConfig[^)]*\)/,
    );
    expect(complianceIdx).toBeGreaterThan(0);
    expect(customBranchIdx).toBeGreaterThan(0);
    expect(complianceIdx).toBeLessThan(customBranchIdx);
  });

  it("case3: 合规拦截返回 400 COMPLIANCE_BLOCKED code（正则字面量块兼容嵌套括号）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 8000);
    const complianceIdx = postBody.search(/COMPLIANCE_BLOCK_REGEX\.test/);
    expect(complianceIdx).toBeGreaterThan(0);
    const nearBlock = postBody.slice(Math.max(0, complianceIdx - 30), complianceIdx + 600);
    expect(nearBlock).toMatch(/COMPLIANCE_BLOCKED/);
    expect(nearBlock).toMatch(/status\s*:\s*400/);
    expect(nearBlock).toMatch(/NextResponse\.json/);
  });

  it("case4: 自定义模式 max_tokens 仍硬限制到 ≤150（Math.min(..., 150) 在 handleCustomProvider 内）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasHardLimit =
      /Math\.min\s*\([^)]*,\s*150\s*\)/.test(src) ||
      /Math\.min\s*\([^)]*,150\s*\)/.test(src) ||
      /\.maxTokens|maxTokens\b[\s\S]{0,200}150/.test(src);
    expect(hasHardLimit).toBe(true);
  });
});
