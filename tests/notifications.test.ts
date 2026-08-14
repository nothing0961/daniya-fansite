import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * 站内通知系统（站长收投稿通知 + 投稿人收审核结果反向通知）
 * 覆盖：
 *  1) Prisma Notification 模型（userId/type/title/link/readAt）
 *  2) submit-post 路由：站长直发分支（不走审核直接 createPostMdx）
 *  3) submit-post 路由：普通用户投稿 → 通知站长（type=SUBMISSION）
 *  4) moderation 路由：通过 → 通知投稿人（type=APPROVED）；驳回 → 通知投稿人（type=REJECTED）
 *  5) Header 铃铛（/api/notifications/unread-count 轮询 + 红点）
 *  6) 通知列表页 + 标记已读 API
 */

const ROOT = process.cwd();
const read = (rel: string): string => {
  try {
    return fs.readFileSync(path.join(ROOT, rel), "utf-8");
  } catch {
    return "";
  }
};
const exists = (rel: string): boolean => fs.existsSync(path.join(ROOT, rel));

describe("通知系统 · Prisma 模型", () => {
  it("schema.prisma 存在 Notification 模型，含 userId / type / title / link / readAt / createdAt", () => {
    const schema = read("prisma/schema.prisma");
    expect(schema).toMatch(/model\s+Notification\s*\{/);
    expect(schema).toMatch(/userId\s+String/);
    expect(schema).toMatch(/type\s+String/);
    expect(schema).toMatch(/title\s+String/);
    expect(schema).toMatch(/link\s+String\?/);
    expect(schema).toMatch(/readAt\s+DateTime\?/);
    expect(schema).toMatch(/createdAt\s+DateTime\s+@default\(now\(\)\)/);
  });

  it("User 模型关联 notifications 数组（级联删除）", () => {
    const schema = read("prisma/schema.prisma");
    expect(schema).toMatch(/notifications\s+Notification\[\]/);
    expect(schema).toMatch(/model\s+Notification[\s\S]*?onDelete:\s*Cascade/);
  });
});

describe("通知系统 · 站长直发（submit-post 路由）", () => {
  let api: string;
  beforeAll(() => {
    api = read("src/app/api/user/submit-post/route.ts");
  });

  it("路由存在 ADMIN_USER_ID 判断（站长与普通用户分流）", () => {
    expect(api).toMatch(/ADMIN_USER_ID/);
  });

  it("站长分支：直接 createPostMdx 发布 + 返回 publishedSlug，不创建 PendingPost", () => {
    expect(api).toMatch(/createPostMdx\s*\(/);
    expect(api).toMatch(/publishedSlug/);
    // 直发分支应带 postMetaSchema 校验 + draft: false
    expect(api).toMatch(/postMetaSchema\.safeParse/);
    expect(api).toMatch(/draft\s*:\s*false/);
  });

  it("普通用户分支：PendingPost 创建成功后写 Notification（type=SUBMISSION，收件人=ADMIN_USER_ID，link=/dashboard/moderation）", () => {
    expect(api).toMatch(/prisma\.notification\.create/);
    expect(api).toMatch(/type\s*:\s*["']SUBMISSION["']/);
    expect(api).toMatch(/userId\s*:\s*process\.env\.ADMIN_USER_ID/);
    expect(api).toMatch(/link\s*:\s*["']\/dashboard\/moderation["']/);
  });
});

describe("通知系统 · 反向通知（moderation 路由）", () => {
  let api: string;
  beforeAll(() => {
    api = read("src/app/api/moderation/posts/[id]/route.ts");
  });

  it("审核通过（approve）→ 通知投稿人 type=APPROVED + link=/post/ 作品页", () => {
    expect(api).toMatch(/prisma\.notification\.create/);
    expect(api).toMatch(/type\s*:\s*["']APPROVED["']/);
    expect(api).toMatch(/userId\s*:\s*existing\.userId/);
    expect(api).toMatch(/link\s*:\s*`\/post\//);
  });

  it("审核驳回（reject）→ 通知投稿人 type=REJECTED + link=/submit?resubmit=（带重提入口）", () => {
    expect(api).toMatch(/type\s*:\s*["']REJECTED["']/);
    expect(api).toMatch(/link\s*:\s*`\/submit\?resubmit=/);
  });
});

describe("通知系统 · 铃铛 + 列表页 + API", () => {
  it("Header 铃铛组件存在（client，轮询 /api/notifications/unread-count，未读红点）", () => {
    const bell = read("src/components/notifications/notification-bell.tsx");
    expect(exists("src/components/notifications/notification-bell.tsx")).toBe(true);
    expect(bell).toContain("use client");
    expect(bell).toMatch(/\/api\/notifications\/unread-count/);
    expect(bell).toMatch(/setInterval/);
    // 红点：count > 0 时显示徽标
    expect(bell).toMatch(/count\s*>\s*0/);
  });

  it("Header 仅在站长登录时渲染铃铛（user.id === ADMIN_USER_ID）", () => {
    const header = read("src/components/layout/header.tsx");
    expect(header).toMatch(/NotificationBell/);
    expect(header).toMatch(/user\.id\s*===\s*process\.env\.ADMIN_USER_ID/);
  });

  it("unread-count API 存在：requireAdmin + readAt: null 计数", () => {
    const api = read("src/app/api/notifications/unread-count/route.ts");
    expect(exists("src/app/api/notifications/unread-count/route.ts")).toBe(true);
    expect(api).toMatch(/requireAdmin/);
    expect(api).toMatch(/notification\.count/);
    expect(api).toMatch(/readAt\s*:\s*null/);
  });

  it("通知列表 API 存在：GET 查询 + PUT 全部已读", () => {
    const api = read("src/app/api/notifications/route.ts");
    expect(exists("src/app/api/notifications/route.ts")).toBe(true);
    expect(api).toMatch(/export\s+async\s+function\s+GET/);
    expect(api).toMatch(/export\s+async\s+function\s+PUT/);
    expect(api).toMatch(/notification\.findMany/);
    expect(api).toMatch(/updateMany[\s\S]{0,200}readAt\s*:\s*new Date\(\)/);
  });

  it("通知列表页存在：/dashboard/notifications，查询当前用户通知 + 进入自动已读组件", () => {
    const page = read("src/app/(dashboard)/dashboard/notifications/page.tsx");
    expect(exists("src/app/(dashboard)/dashboard/notifications/page.tsx")).toBe(true);
    expect(page).toMatch(/notification\.findMany/);
    expect(page).toMatch(/where:\s*\{\s*userId/);
    const mark = read("src/app/(dashboard)/dashboard/notifications/mark-read-on-mount.tsx");
    expect(mark).toContain("use client");
    expect(mark).toMatch(/\/api\/notifications[\s\S]{0,60}method\s*:\s*["']PUT["']/);
  });
});
