/**
 * 需求：飞讯知识库上下文注入
 *
 * 断言：
 *   1. route.ts：请求体 knowledgeContext 为字符串时，sanitizeMessages 之后以 system 角色 push 注入
 *   2. 注入指令含考据参考、剧透克制、无相关内容不硬扯
 *   3. global-chat-drawer.tsx：发送前调用 buildKnowledgeContext + loadKnowledgeDocs，请求体带 knowledgeContext
 *   4. chat-settings-panel.tsx：存在「知识库」TabsTrigger 与导入/列表结构
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");
const DRAWER_PATH = path.join(ROOT, "src/components/chat/global-chat-drawer.tsx");
const PANEL_PATH = path.join(ROOT, "src/components/chat/chat-settings-panel.tsx");

describe("AI 聊天：知识库上下文注入", () => {
  it("case1: route.ts 存在 knowledgeContext 注入（system 角色 push，位于 sanitizeMessages 之后）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    expect(src).toMatch(/body\.knowledgeContext === "string"/);
    expect(src).toMatch(/sanitized\.push\(\{[\s\S]*?role:\s*"system"/);
    const postStart = src.indexOf("async function POST");
    const postBody = src.slice(postStart, postStart + 7000);
    const sanitizeIdx = postBody.indexOf("sanitizeMessages");
    const knowledgeIdx = postBody.indexOf("knowledgeContext");
    expect(sanitizeIdx).toBeGreaterThan(0);
    expect(knowledgeIdx).toBeGreaterThan(0);
    expect(sanitizeIdx).toBeLessThan(knowledgeIdx);
    const firstProviderIdx = Math.min(
      ...[postBody.indexOf("handleCustomProvider"), postBody.indexOf("handleDefaultProvider")].filter((i) => i > 0),
    );
    expect(knowledgeIdx).toBeLessThan(firstProviderIdx);
  });

  it("case2: 注入指令含考据参考、剧透克制、无相关内容不硬扯", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    expect(src).toMatch(/仅供考据参考/);
    expect(src).toMatch(/剧透克制/);
    expect(src).toMatch(/不要硬扯资料内容/);
  });

  it("case3: global-chat-drawer 发送前调用知识库检索并把 knowledgeContext 放入请求体", () => {
    if (!fs.existsSync(DRAWER_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(DRAWER_PATH, "utf-8");
    expect(src).toMatch(/from ["']@\/lib\/knowledge-base["']/);
    expect(src).toMatch(/buildKnowledgeContext\(text,\s*loadKnowledgeDocs\(\)\)/);
    expect(src).toMatch(/knowledgeContext:\s*knowledgeContext \?\? undefined/);
  });

  it("case4: 设置面板存在知识库 tab（总开关 + 上传 + 列表管理）", () => {
    if (!fs.existsSync(PANEL_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(PANEL_PATH, "utf-8");
    expect(src).toMatch(/TabsTrigger value="knowledge"/);
    expect(src).toMatch(/知识库总开关/);
    expect(src).toMatch(/handleKnowledgeUpload/);
    expect(src).toMatch(/handleAddKnowledgeDoc/);
    expect(src).toMatch(/handleRemoveKnowledgeDoc/);
    expect(src).toMatch(/已导入的资料/);
  });
});
