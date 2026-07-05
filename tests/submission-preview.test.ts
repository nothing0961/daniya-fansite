/**
 * tests/submission-preview.test.ts
 * 方案 A：新路由 /dashboard/submissions/[slug]（投稿预览页）
 *  + Submissions 列表的「查看详情」跳转
 *
 * 断言方式：源码字符串 / 文件存在性，不跑渲染（与 character-page.test.ts / post-form.test.ts 一致）。
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const PREVIEW_PAGE = path.join(
  ROOT,
  "src/app/(dashboard)/dashboard/submissions/[slug]/page.tsx",
);
const SUBMISSIONS_LIST = path.join(
  ROOT,
  "src/app/(dashboard)/dashboard/submissions/page.tsx",
);
const ADMIN_GUARD = path.join(ROOT, "src/lib/admin.ts"); // 复用管理员判断

describe("新路由：/dashboard/submissions/[slug]/page.tsx 存在性", () => {
  it("1) 必须存在新页面文件 submissions/[slug]/page.tsx（方案 A 新路由）", () => {
    expect(fs.existsSync(PREVIEW_PAGE)).toBe(true);
  });
});

describe(fs.existsSync(PREVIEW_PAGE) ? "投稿预览页：代码结构断言" : "投稿预览页：（文件不存在，跳过）", () => {
  const CODE = fs.readFileSync(PREVIEW_PAGE, "utf-8");
  const ADMIN_CODE = fs.readFileSync(ADMIN_GUARD, "utf-8");
  // 从 admin.ts 中提取管理员判断函数名（一般是 requireAdmin 或 isAdmin）
  const ADMIN_FN_M = ADMIN_CODE.match(/export\s+(?:async\s+)?function\s+(requireAdmin|isAdmin|ensureAdmin)\s*\(/);
  const ADMIN_FN = ADMIN_FN_M ? ADMIN_FN_M[1] : "requireAdmin";

  it("2) 必须是 App Router Server Component：export default async function + params: Promise<{ slug: string }>", () => {
    expect(CODE).toMatch(/export\s+default\s+async\s+function\s+\w+/);
    expect(CODE).toMatch(/params\s*:\s*Promise<\s*\{\s*slug\s*:\s*string\s*}\s*>/);
  });

  it("3) 必须 auth() 守卫 + 未登录 redirect 到 /login?callbackUrl=", () => {
    expect(CODE).toMatch(/await\s+auth\s*\(/);
    // 接受：单引号 / 双引号 / 反引号（模板字符串也可以）
    expect(CODE).toMatch(/redirect\s*\(\s*["'`]\/login\?callbackUrl=/);
  });

  it("4) 必须按 slug 从 PendingPost 查询：prisma.pendingPost.findUnique({ where: { slug", () => {
    expect(CODE).toMatch(
      /prisma\.pendingPost\.findUnique\s*\(\s*\{\s*where\s*:\s*\{\s*slug/,
    );
  });

  it("5) 查询不到记录时调用 notFound()（而不是 throw / return null）", () => {
    expect(CODE).toMatch(/notFound\s*\(\s*\)/);
  });

  it(`6) 权限守卫：本人 userId 匹配 或 管理员（${ADMIN_FN}）；否则 notFound()（不给 403 防枚举）`, () => {
    // 至少满足一条：显式比较 userId === session.user.id / pendingPost.userId 或调用 ADMIN_FN
    const hasOwner = /pendingPost\?.userId\s*===\s*session\.user\.id|session\.user\.id\s*===\s*pendingPost\.userId|rec\.userId\s*===\s*userId|userId\s*===\s*rec\.userId/.test(CODE);
    const hasAdmin = new RegExp(`\\b${ADMIN_FN}\\b`).test(CODE) || /ADMIN_USER_ID/.test(CODE);
    expect(hasOwner || hasAdmin).toBe(true);
    // 不允许通过的人都要 notFound
    expect(CODE.match(/notFound\s*\(\s*\)/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("7) 绝对不出现 generateStaticParams（用户私有动态页，禁止预渲染）", () => {
    expect(CODE).not.toMatch(/generateStaticParams\s*\(/);
  });

  it("8) 右上角三种状态胶囊：PENDING 黄-审核中 / REJECTED 红-请重新编辑 / APPROVED 绿-已通过（三态全出现）", () => {
    expect(CODE).toMatch(/审核中/);
    expect(CODE).toMatch(/请重新编辑/);
    expect(CODE).toMatch(/已通过/);
    // 三种配色至少出现：amber / red / emerald（或对应中文语义）
    expect(CODE).toMatch(/amber/i);
    expect(CODE).toMatch(/red/i);
    expect(CODE).toMatch(/emerald/i);
  });

  it("9) REJECTED 态：必须显示 rejectReason，且 CTA 按钮跳到 /submit?resubmit=${item.id}（沿用 submit/page.tsx 已有参数名）", () => {
    expect(CODE).toMatch(/rejectReason/);
    expect(CODE).toMatch(/\/submit\?resubmit=\$\{[^}]+\}/);
    expect(CODE).toMatch(/修改.*重新提交|重新提交.*修改/);
  });

  it("10) APPROVED 态：绿 banner + 查看正式页外链到 /post/${slug}（胶囊旁链接）", () => {
    expect(CODE).toMatch(/该稿件已上线|已通过审核|已发布到正式页/);
    expect(CODE).toMatch(/查看正式页|前往正式页|打开正式页/);
    expect(CODE).toMatch(/\/post\/\$\{[^}]+\}/);
  });

  it("11) 非 APPROVED 态：互动锁 banner（点赞/收藏/评论暂不开放）", () => {
    expect(CODE).toMatch(/暂不开放(点赞|收藏|评论|互动)|(点赞|收藏|评论|互动).*暂不开放|审核中.*(不开放|关闭)|驳回.*(不开放|关闭)/);
  });

  it("12) 内容复刻正式详情页：必须引用 PostMeta + PostCredit + PostGallery + BilibiliEmbed + MDX/正文渲染", () => {
    // 组件名要出现：正式详情页里这几个组件 import 过来，这里也要复用
    expect(CODE).toMatch(/\bPostMeta\b/);
    expect(CODE).toMatch(/\bPostCredit\b/);
    expect(CODE).toMatch(/\bPostGallery\b/);
    expect(CODE).toMatch(/\bBilibiliEmbed\b/);
    // 正文渲染：MDXRemote 或 renderMarkdown / markdown 相关，只要有任意一个就行
    expect(CODE).toMatch(/MDXRemote|markdown|content|body|renderMarkdown/);
  });
});

describe("我的投稿列表：submissions/page.tsx 列表卡片『查看详情』跳转", () => {
  if (!fs.existsSync(SUBMISSIONS_LIST)) {
    it("（列表页不存在，跳过）", () => {
      expect(true).toBe(true);
    });
    return;
  }
  const LIST = fs.readFileSync(SUBMISSIONS_LIST, "utf-8");

  it("13) 列表每张卡片底部或右上角要有『查看详情』Link 到 /dashboard/submissions/${item.slug}（按 slug 定位）", () => {
    expect(LIST).toMatch(/查看详情|详情|预览/);
    expect(LIST).toMatch(/\/dashboard\/submissions\/\$\{[^}]+\.slug\}/);
  });
});
