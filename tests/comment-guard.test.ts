import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * 自建评论系统 — 权限守卫的源码结构断言
 *
 * 与 dashboard-layout.test.ts 一样的"文件内容断言"风格：
 * 不 mock DB、不跑真实网络，只断言 API 源码里出现了关键守卫代码：
 *  - POST /api/posts/[slug]/comments 发表评论：必须 auth() + 401 未登录拦截
 *  - DELETE /api/comments/[id] 删除评论：必须 auth() + 401 + 403（作者/站长）
 *  - GET /api/posts/[slug]/comments 读列表：所有人可读，不需要 auth
 */

const ROOT = process.cwd();

const POST_COMMENTS_API = path.join(
  ROOT,
  "src/app/api/posts/[slug]/comments/route.ts"
);
const DELETE_COMMENT_API = path.join(
  ROOT,
  "src/app/api/comments/[id]/route.ts"
);

describe("自建评论 · 发表评论 POST API 守卫", () => {
  it("API 文件 src/app/api/posts/[slug]/comments/route.ts 必须存在", () => {
    expect(fs.existsSync(POST_COMMENTS_API)).toBe(true);
  });

  it("POST handler 必须调用 auth() 并判断未登录时返回 401", () => {
    const src = fs.readFileSync(POST_COMMENTS_API, "utf8");
    // 必须 import/调用 auth
    expect(src).toContain("auth()");
    // 必须有 POST 导出函数
    expect(src).toContain("export async function POST");
    // 必须明确返回 401 给未登录用户（不能是字符串 401/403 误判，所以同时看两个关键标志）
    expect(src).toContain("status: 401");
  });

  it("POST handler 必须用 commentSchema.safeParse 校验 body", () => {
    const src = fs.readFileSync(POST_COMMENTS_API, "utf8");
    expect(src).toContain("commentSchema");
    expect(src).toContain("safeParse");
  });

  it("GET handler 必须存在（所有人可读评论列表）；可以没有 401 守卫", () => {
    const src = fs.readFileSync(POST_COMMENTS_API, "utf8");
    expect(src).toContain("export async function GET");
    // 不要求 auth()（未登录也能看）；所以不做 toContain auth() 断言
  });
});

describe("自建评论 · 删除评论 DELETE API 守卫", () => {
  it("API 文件 src/app/api/comments/[id]/route.ts 必须存在", () => {
    expect(fs.existsSync(DELETE_COMMENT_API)).toBe(true);
  });

  it("DELETE handler 必须有 auth() + 401 未登录拦截 + 403 权限不足拦截", () => {
    const src = fs.readFileSync(DELETE_COMMENT_API, "utf8");
    expect(src).toContain("export async function DELETE");
    expect(src).toContain("auth()");
    expect(src).toContain("status: 401");
    expect(src).toContain("status: 403");
  });

  it("删除权限判断必须包含两个条件：作者本人 OR 站长（ADMIN_USER_ID）", () => {
    const src = fs.readFileSync(DELETE_COMMENT_API, "utf8");
    // 必须从 DB 查 comment.userId（作者身份判断）
    expect(src).toContain("comment.userId");
    // 必须有 ADMIN_USER_ID / isAdmin 之类的站长判断
    expect(
      src.includes("ADMIN_USER_ID") || src.includes("requireAdmin")
    ).toBe(true);
  });
});
