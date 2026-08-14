/**
 * 需求：聊天会话持久化 API（列表/新建/追加/删除，401 拦截）+ 客户端同步接线
 *
 * 断言：
 *   1. GET/POST /api/chat-sessions：列表与新建，401 拦截
 *   2. GET/PATCH/DELETE /api/chat-sessions/[id]：消息读取/标题摘要更新/删除，401 + 404 归属校验
 *   3. POST /api/chat-sessions/[id]/messages：整表替换消息（幂等），401 + 404
 *   4. 抽屉：登录态导入合并（planSessionImport/remapImported/apiListSessions/apiCreateSession）
 *   5. 抽屉：登录态消息整表同步（apiReplaceMessages）与删除/改名走 API
 *   6. 游客纯 localStorage（无 API 调用分支）
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LIST_PATH = path.join(ROOT, "src/app/api/chat-sessions/route.ts");
const ITEM_PATH = path.join(ROOT, "src/app/api/chat-sessions/[id]/route.ts");
const MSGS_PATH = path.join(ROOT, "src/app/api/chat-sessions/[id]/messages/route.ts");
const DRAWER_PATH = path.join(ROOT, "src/components/chat/global-chat-drawer.tsx");
const SYNC_PATH = path.join(ROOT, "src/lib/chat-session-sync.ts");

const read = (p: string) => (fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "");

describe("会话持久化：API 路由", () => {
  it("list: GET（列表）+ POST（新建）均 401 拦截未登录", () => {
    const src = read(LIST_PATH);
    expect(src).toMatch(/\/api\/chat-sessions/);
    expect(src).toMatch(/export async function GET/);
    expect(src).toMatch(/export async function POST/);
    expect(src).toMatch(/status: 401/);
    expect(src).toMatch(/请先登录/);
    expect(src).toMatch(/where: \{ userId: session\.user\.id \}/);
  });

  it("item: GET（消息）/PATCH（标题摘要）/DELETE（删除）401 + 404 归属校验", () => {
    const src = read(ITEM_PATH);
    expect(src).toMatch(/export async function GET/);
    expect(src).toMatch(/export async function PATCH/);
    expect(src).toMatch(/export async function DELETE/);
    expect(src).toMatch(/status: 401/);
    expect(src).toMatch(/status: 404/);
    expect(src).toMatch(/findFirst\(\{/);
    expect(src).toMatch(/where: \{ id, userId: session\.user\.id \}/);
    expect(src).toMatch(/summaryCount/);
    expect(src).toMatch(/include: \{ messages/);
  });

  it("messages: POST 整表替换（幂等追加），仅接受 user/assistant", () => {
    const src = read(MSGS_PATH);
    expect(src).toMatch(/\/messages/);
    expect(src).toMatch(/export async function POST/);
    expect(src).toMatch(/status: 401/);
    expect(src).toMatch(/status: 404/);
    expect(src).toMatch(/deleteMany\(\{ where: \{ sessionId: id \} \}\)/);
    expect(src).toMatch(/createMany/);
    expect(src).toMatch(/role === "user" \|\| m\.role === "assistant"/);
    // id 由服务端生成（客户端固定 id 跨会话会撞 ChatMessage 唯一键 P2002）
    expect(src).not.toMatch(/id: m\.id/);
    expect(src).toMatch(/createdAt: new Date\(now \+ i\)/);
  });
});

describe("会话持久化：同步库接线", () => {
  it("抽屉引入 planSessionImport / remapImported 与同步 API 调用", () => {
    const src = read(DRAWER_PATH);
    expect(src).toMatch(/from ["']@\/lib\/chat-session-sync["']/);
    expect(src).toMatch(/planSessionImport/);
    expect(src).toMatch(/remapImported/);
    expect(src).toMatch(/apiCreateSession/);
    expect(src).toMatch(/apiReplaceMessages/);
    expect(src).toMatch(/apiDeleteSession/);
    expect(src).toMatch(/apiPatchSession/);
    expect(src).toMatch(/apiListSessions/);
    expect(src).toMatch(/apiFetchMessages/);
    expect(src).toMatch(/\/api\/chat-sessions/);
  });

  it("导入标记：dbId 字段 + 游客纯 localStorage 分支", () => {
    const src = read(DRAWER_PATH);
    expect(src).toMatch(/dbId/);
    expect(src).toMatch(/status !== "authenticated"/);
    expect(src).toMatch(/restoreLocal\(\)/);
  });

  it("同步库：needsImport + 导入规划纯函数存在", () => {
    const src = read(SYNC_PATH);
    expect(src).toMatch(/export function needsImport/);
    expect(src).toMatch(/export function planSessionImport/);
    expect(src).toMatch(/export function remapImported/);
    expect(src).toMatch(/toImport/);
    expect(src).toMatch(/dbId/);
  });
});
