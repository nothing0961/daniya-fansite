/**
 * 需求 T-1：未登录用户 不允许使用 AI 聊天功能（第三层限流修改：非 3 句体验，而是直接拒绝）
 *
 * 断言：
 *   1. POST /api/chat 路由存在（src/app/api/chat/route.ts 文件存在）
 *   2. route.ts 里必须先 auth() 再处理业务：auth() 返回 null → 返回 401
 *   3. 401 响应 JSON.error 含「请先登录」或「登录后聊天」中文文案
 *   4. 未登录分支 → 必须在「调用任何 AI / Mock 生成函数」之前执行（前置拦截）
 *
 * 风格：源码字符串正则断言（与 login-form.test.ts / submit-modal.test.ts 一致）
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");

describe("AI 聊天 T-1：未登录用户完全禁用（401，不允许 3 句游客体验）", () => {
  it("1-1. src/app/api/chat/route.ts 路由文件已存在", () => {
    expect(fs.existsSync(ROUTE_PATH)).toBe(true);
  });

  it("1-2. route.ts 顶部先引入了 next-auth 的 auth()（用于前置登录态校验）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false); // 先确保文件存在
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasAuthImport =
      /from\s+["']@\/auth["']\s*;?/.test(src) || // 相对路径
      /import\s*\{[^}]*auth[^}]*\}\s*from\s*["']next-auth\/["']/.test(src); // auth 官方包
    expect(hasAuthImport).toBe(true);
  });

  it("1-3. POST 函数体内：先 const session = await auth() → 然后 if (!session?.user?.id) return Response.json(401 + 请登录文案)", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 2500);
    // A: 有 auth() 调用
    expect(postBody).toMatch(/await\s+auth\s*\(\s*\)/);
    // B: if (!session?.user?.id) 分支存在
    expect(postBody).toMatch(/if\s*\(\s*!session\?\.\s*user\?\.\s*id\s*\)/);
    // C: 分支里 return Response.json(..., { status: 401 })
    const unauthBlock = postBody.match(
      /if\s*\(\s*!session\?\.\s*user\?\.\s*id\s*\)\s*\{([^{}]|\{[^{}]*\})*\}/,
    )?.[0] ?? "";
    expect(unauthBlock).toMatch(/Response\.json\s*\(/);
    expect(unauthBlock).toMatch(/status\s*:\s*401/);
    // D: 中文错误文案含「登录」关键词
    expect(unauthBlock).toMatch(/登\s*录/);
  });

  it("1-4. 未登录拦截必须位于「调用 AI / Mock 生成」之前（前置校验，不能先算 token 再拒）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 2500);
    // 在函数体内定位 auth 检查
    const authCheckIdx = postBody.search(/if\s*\(\s*!session\?\.\s*user\?\.\s*id\s*\)/);
    expect(authCheckIdx).toBeGreaterThan(0);
    const llmOrMockIdx = postBody.search(
      /(fetch\s*\(\s*.*(?:chat\/completions)|handleDefaultProvider|handleCustomProvider|PRESET_REPLIES\s*\[|new\s+ReadableStream)/i,
    );
    if (llmOrMockIdx === -1) return;
    expect(authCheckIdx).toBeLessThan(llmOrMockIdx);
  });
});
