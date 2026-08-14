/**
 * Dashboard 布局 — 登录用户个人中心
 * 侧边栏 + 内容区布局
 *  - 管理员（ADMIN_USER_ID）额外可见：作品管理、投稿审核
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 未登录用户重定向
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.id === process.env.ADMIN_USER_ID;

  /** 侧边栏导航项（根据权限动态生成）
   *   方案 A 整合：账号设置 & 作品管理的内容/入口 已合并到 /dashboard 概览页
   *   保留：概览 / 我的收藏 / 我的投稿 / 投稿审核（站长）
   */
  const sidebarLinks = [
    { href: "/dashboard", label: "概览" },
    { href: "/dashboard/bookmarks", label: "我的收藏" },
    { href: "/dashboard/submissions", label: "我的投稿" },
    ...(isAdmin
      ? [
          { href: "/dashboard/moderation", label: "投稿审核" },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
        {/* 侧边栏 — 玻璃面板 */}
        <aside className="w-full sm:w-48 shrink-0">
          <div
            className="rounded-2xl p-3
                       border border-[rgba(231,155,190,0.12)]
                       bg-[color-mix(in_oklch,var(--card)_60%,transparent)]
                       backdrop-blur-xl
                       shadow-[0_0_0_1px_rgba(231,155,190,0.04)_inset,
                               0_8px_24px_-8px_rgba(0,0,0,0.4)]"
          >
            <DashboardSidebar links={sidebarLinks} />
          </div>
        </aside>

        {/* 内容区 */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
