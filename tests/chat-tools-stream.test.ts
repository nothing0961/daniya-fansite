/**
 * 需求：工具层接入（默认 provider 携带工具 + 单轮 function calling + SSE 事件）
 *
 * 断言：
 *   1. route.ts 引入 chat-tools（schema + 执行器）
 *   2. 默认 provider 请求体携带 tools: CHAT_TOOLS_SCHEMAS
 *   3. 单轮限制：回传工具结果的第二轮请求体不再携带 tools
 *   4. 工具轮：tool_status / tool_action(navigate) SSE 事件
 *   5. 自定义 provider 纯聊天（请求体无 tools）
 *   6. 客户端抽屉：解析 tool_action 导航（router.push）与 tool_status 状态提示
 *
 * 风格：源码字符串正则断言（顺序敏感：避免新关键词影响既有 indexOf 测试）
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");
const DRAWER_PATH = path.join(ROOT, "src/components/chat/global-chat-drawer.tsx");

describe("AI 聊天：工具层接入 route.ts", () => {
  it("case1: 引入 chat-tools（CHAT_TOOLS_SCHEMAS + executeChatTool + CHAT_TOOL_RESULT_MAX_LEN）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    expect(src).toMatch(/from ["']@\/lib\/chat-tools["']/);
    expect(src).toMatch(/CHAT_TOOLS_SCHEMAS/);
    expect(src).toMatch(/executeChatTool/);
    expect(src).toMatch(/CHAT_TOOL_RESULT_MAX_LEN/);
  });

  it("case2: 默认 provider 请求体携带 tools: CHAT_TOOLS_SCHEMAS", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    expect(src).toMatch(/tools:\s*CHAT_TOOLS_SCHEMAS/);
    // tools 位于 handleDefaultProvider 内（首轮请求）
    const hdpStart = src.indexOf("async function handleDefaultProvider");
    expect(hdpStart).toBeGreaterThan(0);
    const hdpBody = src.slice(hdpStart, hdpStart + 6000);
    expect(hdpBody).toMatch(/tools:\s*CHAT_TOOLS_SCHEMAS/);
  });

  it("case3: 单轮限制 — 回传工具结果的第二轮请求体不再携带 tools", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const phase2Idx = src.indexOf("const phase2 = await fetch(apiUrl");
    expect(phase2Idx).toBeGreaterThan(0);
    const phase2Body = src.slice(phase2Idx, phase2Idx + 900);
    expect(phase2Body).not.toMatch(/tools:/);
    expect(phase2Body).toMatch(/buildToolRoundMessages/);
    // 单轮注释标记
    expect(src).toMatch(/单轮限制/);
  });

  it("case4: 工具轮 SSE 事件（tool_status + tool_action navigate）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    expect(src).toMatch(/tool_status: "正在调用站内工具/);
    expect(src).toMatch(/tool_action/);
    expect(src).toMatch(/navigateTo/);
    expect(src).toMatch(/navAction = \{ action: "navigate"/);
  });

  it("case5: 自定义 provider 纯聊天（请求体无 tools）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hcpStart = src.indexOf("async function handleCustomProvider");
    expect(hcpStart).toBeGreaterThan(0);
    const hcpBody = src.slice(hcpStart, hcpStart + 3000);
    expect(hcpBody).not.toMatch(/tools:/);
  });

  it("case8: encodeSSE 用 TextEncoder 编码（中文 fallback 不损坏）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const encIdx = src.indexOf("sseEncoder = new TextEncoder()");
    expect(encIdx).toBeGreaterThan(0);
    const esStart = src.indexOf("function encodeSSE");
    expect(esStart).toBeGreaterThan(encIdx);
    const esBody = src.slice(encIdx, esStart + 400);
    expect(esBody).toMatch(/new TextEncoder/);
    // 禁止 charCodeAt 逐字节截断（会把中文按 UTF-16 低位截断成乱码）
    expect(esBody).not.toMatch(/charCodeAt/);
  });
});

describe("AI 聊天：工具层客户端（抽屉）", () => {
  it("case6: 解析 tool_action 导航事件并 router.push", () => {
    if (!fs.existsSync(DRAWER_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(DRAWER_PATH, "utf-8");
    expect(src).toMatch(/CHAT_NAV_PATHS/);
    expect(src).toMatch(/p\?\.tool_action\?\.action === "navigate"/);
    expect(src).toMatch(/router\.push\(path\)/);
    expect(src).toMatch(/works: "\/works"/);
  });

  it("case7: 解析 tool_status 状态提示（setToolStatus）", () => {
    if (!fs.existsSync(DRAWER_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(DRAWER_PATH, "utf-8");
    expect(src).toMatch(/toolStatus/);
    expect(src).toMatch(/p\?\.tool_status/);
    expect(src).toMatch(/setToolStatus\(p\.tool_status\)/);
  });
});
