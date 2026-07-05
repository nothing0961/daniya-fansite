/**
 * 我的投稿页面（/dashboard/submissions）— P0 阻塞项
 *
 * 源码结构断言（11 条）：
 *  1) layout sidebarLinks 追加「我的投稿」菜单入口
 *  2) submissions/page.tsx 文件存在
 *  3) submissions/page.tsx 使用 auth() 守卫 + prisma.pendingPost 按 userId 查询
 *  4) submissions/page.tsx 顶部 4 个状态 Tab：ALL/PENDING/APPROVED/REJECTED + 数量徽章
 *  5) PENDING 卡片显示「取消投稿」按钮（灰色可点击）
 *  6) REJECTED 卡片显示驳回理由框 +「修改后重新提交」按钮
 *  7) APPROVED 卡片显示已发布跳转链接 /post/[publishedSlug]
 *  8) /api/user/submissions/[id]/route.ts 存在 DELETE + GET，带 auth + userId 所有权守卫
 *  9) DELETE 路由对非 PENDING 状态返回 409（幂等保护）
 * 10) submit/page.tsx 接受 searchParams.resubmit 查询参数 + prefill 传 PostForm
 * 11) post-form.tsx 新增 prefill prop + onDismiss router.push('/dashboard/submissions') 激活跳转
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel: string): string => {
  try {
    return fs.readFileSync(path.join(ROOT, rel), "utf-8");
  } catch {
    return ""; // 文件不存在时返回空串，让断言明确失败（而不是 throw 读文件错误）
  }
};
const exists = (rel: string): boolean => fs.existsSync(path.join(ROOT, rel));

describe("P0 · 我的投稿页面 基础结构", () => {
  let layout: string, page: string;

  beforeAll(() => {
    layout = read("src/app/(dashboard)/layout.tsx");
    page = read("src/app/(dashboard)/dashboard/submissions/page.tsx");
  });

  it("1) 侧边栏 sidebarLinks 追加 href=/dashboard/submissions label=我的投稿（所有用户可见）", () => {
    expect(layout).toMatch(
      /href:\s*["']\/dashboard\/submissions["'][,\s]*label:\s*["']我的投稿["']/
    );
  });

  it("2) submissions 页面文件必须存在：src/app/(dashboard)/dashboard/submissions/page.tsx", () => {
    expect(exists("src/app/(dashboard)/dashboard/submissions/page.tsx")).toBe(true);
    expect(page.length).toBeGreaterThan(10);
  });

  it("3) submissions 页面使用 auth() 登录守卫 + prisma.pendingPost.findMany 按 userId 过滤", () => {
    expect(page).toMatch(/auth\s*\(\s*\)/); // 必须调 auth
    expect(page).toMatch(/prisma\.pendingPost\.findMany/);
    expect(page).toMatch(/where:\s*\{[\s\S]{0,120}userId/); // 过滤条件里含 userId
  });

  it("4) 顶部 4 个状态 Tab：全部 / 待审核 / 已通过 / 已驳回（或 ALL/PENDING/APPROVED/REJECTED 映射中文）+ 数量 badge", () => {
    // 必须同时出现"待审核""已通过""已驳回"三个状态词
    expect(page).toMatch(/待审核|PENDING/);
    expect(page).toMatch(/已通过|APPROVED/);
    expect(page).toMatch(/已驳回|REJECTED/);
    // 必须有"全部/All/ALL"
    expect(page).toMatch(/全部|ALL\b|All\b/);
    // Tab 数量计数（状态计数角标/徽章）
    expect(page).toMatch(/statusCount|counts|PENDING.*APPROVED.*REJECTED|待审核.*已通过.*已驳回/);
  });
});

describe("P0 · 我的投稿 卡片状态 + 交互按钮", () => {
  let page: string;
  beforeAll(() => {
    page = read("src/app/(dashboard)/dashboard/submissions/page.tsx");
  });

  it("5) PENDING 卡片显示「取消投稿」按钮（触发删除 PendingPost）", () => {
    expect(page).toMatch(/取消投稿|取消.*提交|delete|删除/);
    // 取消按钮必须只在 PENDING 出现：代码中存在 PENDING 条件判断 或 status===PENDING 守卫
    expect(page).toMatch(/PENDING|status.*===.*PEND|status.*=.*PEND/);
  });

  it("6) REJECTED 卡片显示驳回理由框（红色/带红边样式）+「修改后重新提交」按钮", () => {
    expect(page).toMatch(/驳回理由|rejectReason/);
    expect(page).toMatch(/修改后.*(重新|再次|再).*(提交|投稿)|重提|re.?submit/i);
  });

  it("7) APPROVED 卡片显示已发布跳转链接 /post/xxx（href=/post/ 或 publishedSlug 跳转）", () => {
    expect(page).toMatch(/已发布|publishedSlug|APPROVED/);
    // 兼容：href="/post/xxx"（静态字符串）或 href={`/post/xxx`}（模板字符串）两种 JSX 写法
    expect(page).toMatch(/href\s*=\s*\{?\s*["'`]\/post\//);
  });
});

describe("P0 · 我的投稿 单条 API（/api/user/submissions/[id]/route.ts）", () => {
  let api: string;
  beforeAll(() => {
    api = read("src/app/api/user/submissions/[id]/route.ts");
  });

  it("8) API 文件存在，含 GET + DELETE + auth() + userId 本人所有权守卫（非本人 401/403）", () => {
    expect(exists("src/app/api/user/submissions/[id]/route.ts")).toBe(true);
    expect(api).toMatch(/export\s+async\s+function\s+GET/);
    expect(api).toMatch(/export\s+async\s+function\s+DELETE/);
    expect(api).toMatch(/auth\s*\(\s*\)/);
    // 守卫：pendingPost.userId !== session.user.id → 401/403
    expect(api).toMatch(/(userId.*!==.*session|session.*userId|!==.*userId|401|403)/);
  });

  it("9) DELETE 路由对非 PENDING 状态返回 409 Conflict（幂等保护，防止已处理投稿被删）", () => {
    expect(api).toMatch(/status.*!==\s*["']PENDING["']|409|Conflict/);
    expect(api).toMatch(/\{[\s\S]*status\s*:\s*409[\s\S]*\}/);
  });
});

describe("P0 · 我的投稿 驳回重提 + 成功弹窗跳转打通", () => {
  let submitPage: string, postForm: string;

  beforeAll(() => {
    submitPage = read("src/app/submit/page.tsx");
    postForm = read("src/components/admin/post-form.tsx");
  });

  it("10) submit/page.tsx 支持 searchParams.resubmit=<id>，查 Prisma 回填 prefill 到 PostForm（slug 清空防冲突）", () => {
    // 接收 searchParams
    expect(submitPage).toMatch(/searchParams|resubmit/);
    // 查 PendingPost DB
    expect(submitPage).toMatch(/pendingPost|PendingPost|prisma\.pending/);
    // prefill 传进 PostForm（而不是 initialData：initialData=编辑模式，prefill=填值不切模式）
    expect(submitPage).toMatch(/<PostForm[\s\S]*?prefill\s*=/);
  });

  it("11) post-form.tsx 新增 prefill Prop + 提交成功 onDismiss 跳 /dashboard/submissions（原 TODO 取消注释，不保留 void router）", () => {
    // prefill 可选 prop 声明
    expect(postForm).toMatch(/interface\s+PostFormProps[\s\S]{0,500}prefill\s*\?/);
    // 跳转激活：必须出现 router.push 的真实调用，并指向 /dashboard/submissions（旧 my-submissions 被替换）
    expect(postForm).toMatch(/router\.push\s*\(\s*["']\/dashboard\/submissions["']\s*\)/);
    // 不应再包含旧的 TODO 注释路径 /dashboard/my-submissions
    expect(postForm).not.toMatch(/my-submissions/);
    // 不应再包含 "void router" 占位（会抑制 ESLint 的 hack 现在应该去掉）
    expect(postForm).not.toMatch(/void\s+router/);
  });
});
