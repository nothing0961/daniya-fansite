/**
 * 需求：站内内容库服务端注入（route.ts 第三路 system 注入）
 *
 * 断言：
 *   1. route.ts import buildSiteKnowledgeContext from "@/lib/site-knowledge"
 *   2. POST 内调用 buildSiteKnowledgeContext(message)，命中时 system push 注入
 *   3. 注入顺序：用户知识库（knowledgeContext）之后、provider 选择之前
 *   4. site-knowledge.ts 预算/阈值常量（1500 / MIN_HITS 2 / MIN_SCORE 0.3 / MAX_TOP_CHUNKS 6）
 *   5. 检索片段带【站内内容库检索片段】标识前缀
 *
 * 风格：源码字符串正则断言（与 chat-knowledge-context 同款）
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");
const LIB_PATH = path.join(ROOT, "src/lib/site-knowledge.ts");

describe("AI 聊天：站内内容库服务端注入", () => {
  it("case1: route.ts 引入 buildSiteKnowledgeContext", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    expect(src).toMatch(
      /import\s*\{[\s\S]*?buildSiteKnowledgeContext[\s\S]*?\}\s*from\s*["']@\/lib\/site-knowledge["']/,
    );
  });

  it("case2: POST 内检索并 system push 注入（含考据参考 / 剧透克制指令）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    expect(src).toMatch(/const siteContext = buildSiteKnowledgeContext\(message\)/);
    expect(src).toMatch(/if \(siteContext\)/);
    expect(src).toMatch(/sanitized\.push\(\{[\s\S]*?role:\s*"system"/);
    expect(src).toMatch(/以下是站内内容库/);
    expect(src).toMatch(/仅供考据参考/);
    expect(src).toMatch(/剧透克制/);
    expect(src).toMatch(/不要硬扯资料内容/);
  });

  it("case3: 注入顺序 — 用户知识库（knowledgeContext）之后、provider 选择之前", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 10000);
    const sanitizeIdx = postBody.indexOf("sanitizeMessages");
    const knowledgeIdx = postBody.indexOf("knowledgeContext");
    const siteIdx = postBody.indexOf("siteContext");
    const firstProviderIdx = Math.min(
      ...[postBody.indexOf("handleCustomProvider"), postBody.indexOf("handleDefaultProvider")].filter((i) => i > 0),
    );
    expect(sanitizeIdx).toBeGreaterThan(0);
    expect(knowledgeIdx).toBeGreaterThan(sanitizeIdx);
    expect(siteIdx).toBeGreaterThan(knowledgeIdx);
    expect(siteIdx).toBeLessThan(firstProviderIdx);
  });

  it("case4: site-knowledge.ts 预算与阈值常量（1500 字 / 2 命中 / 0.3 得分 / 6 条）", () => {
    if (!fs.existsSync(LIB_PATH)) return expect(true).toBe(false);
    const lib = fs.readFileSync(LIB_PATH, "utf-8");
    expect(lib).toMatch(/SITE_KNOWLEDGE_MAX_LEN\s*=\s*1500/);
    expect(lib).toMatch(/SITE_MIN_HITS\s*=\s*2/);
    expect(lib).toMatch(/SITE_MIN_SCORE\s*=\s*0\.3/);
    expect(lib).toMatch(/SITE_MAX_TOP_CHUNKS\s*=\s*6/);
  });

  it("case5: 检索片段带【站内内容库检索片段】标识前缀", () => {
    if (!fs.existsSync(LIB_PATH)) return expect(true).toBe(false);
    const lib = fs.readFileSync(LIB_PATH, "utf-8");
    expect(lib).toMatch(/【站内内容库检索片段】/);
    expect(lib).toMatch(/function buildSiteKnowledgeContext\(\s*query/);
  });
});
