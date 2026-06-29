/**
 * Dashboard 布局 — 登录用户个人中心
 * 侧边栏 + 内容区布局
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";

/** 侧边栏导航项 */
const sidebarLinks = [
  { href: "/dashboard", label: "概览", icon: "home" },
  { href: "/dashboard/bookmarks", label: "我的收藏", icon: "bookmark" },
  { href: "/dashboard/settings", label: "账号设置", icon: "settings" },
];

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col sm:flex-row gap-8">
        {/* 侧边栏 */}
        <aside className="w-full sm:w-48 shrink-0">
          <nav className="flex sm:flex-col gap-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* 内容区 */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
