/**
 * 需求：聊天滑窗 + 摘要（30 条窗口，客户端持有 summary）
 *
 * 断言：
 *   1. route.ts：正常请求携带的 body.summary 字符串 → 作为 system 消息注入（角色卡之后、知识库之前）
 *   2. route.ts：支持 mode === "summarize" 分支，产出 CHAT_SUMMARY_MAX_TOKENS 上限的摘要 JSON
 *   3. 摘要模式不占每日配额（分支位于 detectQuotaExceeded 之前）
 *   4. global-chat-drawer.tsx：只把最近 WINDOW_SIZE(30) 条发给模型，并携带 summary 字段
 *   5. drawer 超窗后异步触发 summarize（增量 summaryCount，失败静默下轮重试）
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");
const DRAWER_PATH = path.join(ROOT, "src/components/chat/global-chat-drawer.tsx");

describe("AI 聊天：滑窗 + 摘要", () => {
  it("case1: route.ts 注入历史摘要（body.summary 字符串 → system 消息，位于 sanitize 之后）", () => {
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    expect(src).toMatch(/typeof body\.summary === "string"/);
    expect(src).toMatch(/sanitized\.push\(\{[\s\S]*?role:\s*"system"/);
    // 摘要注入块位于 sanitizeMessages 之后（用注入文案定位，避开 summarize 分支中的 body.summary）
    const postStart = src.indexOf("export async function POST");
    const postBody = src.slice(postStart, postStart + 7000);
    const sanitizeIdx = postBody.indexOf("sanitizeMessages");
    const injectionIdx = postBody.indexOf("以下是本次对话更早部分的摘要");
    expect(sanitizeIdx).toBeGreaterThan(0);
    expect(injectionIdx).toBeGreaterThan(sanitizeIdx);
  });

  it("case2: route.ts 支持 summarize 模式（内部操作，产出摘要 JSON）", () => {
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    expect(src).toMatch(/body\.mode\s*===\s*"summarize"/);
    expect(src).toMatch(/handleSummarize\(/);
    expect(src).toMatch(/CHAT_SUMMARY_MAX_TOKENS/);
    expect(src).toMatch(/NextResponse\.json\(\{\s*summary\s*\}/);
  });

  it("case3: 摘要模式不触发每日配额（POST 内 summarize 分支位于 quota 检查之前）", () => {
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("export async function POST");
    const postBody = src.slice(postStart, postStart + 7000);
    const summarizeIdx = postBody.indexOf('body.mode === "summarize"');
    const quotaIdx = postBody.indexOf("detectQuotaExceeded");
    expect(summarizeIdx).toBeGreaterThan(0);
    expect(quotaIdx).toBeGreaterThan(summarizeIdx);
  });

  it("case4: drawer 仅发送最近 30 条消息并携带 summary 字段", () => {
    const src = fs.readFileSync(DRAWER_PATH, "utf-8");
    expect(src).toMatch(/WINDOW_SIZE\s*=\s*30/);
    expect(src).toMatch(/\.slice\(-WINDOW_SIZE\)/);
    expect(src).toMatch(/summary:\s*activeSummary \?\? undefined/);
    expect(src).toMatch(/messages:\s*nextList\.slice\(0, -1\)\.slice\(-WINDOW_SIZE\)/);
  });

  it("case5: drawer 超窗后异步触发 summarize（增量 summaryCount，失败静默）", () => {
    const src = fs.readFileSync(DRAWER_PATH, "utf-8");
    expect(src).toMatch(/mode:\s*"summarize"/);
    expect(src).toMatch(/summaryCount/);
    expect(src).toMatch(/list\.slice\(summaryCount, overflowEnd\)/);
    expect(src).toMatch(/if \(!resp\.ok\) return/);
    expect(src).toMatch(/void triggerSummarize\(messagesRef\.current\)/);
  });
});
