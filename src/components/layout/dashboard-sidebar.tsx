/**
 * DashboardSidebar — 个人中心侧边栏（客户端）
 * 玻璃胶囊导航，当前页粉色胶囊高亮
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarLink {
  href: string;
  label: string;
}

export function DashboardSidebar({ links }: { links: SidebarLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex sm:flex-col gap-1 overflow-x-auto whitespace-nowrap pb-2 sm:pb-0 sm:whitespace-normal">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "px-3 py-2 text-sm rounded-full text-[#1a0a14] font-semibold bg-gradient-to-r from-[var(--hp-pink)] to-[var(--hp-pink-deep)] shadow-[0_4px_14px_rgba(231,155,190,0.3)]"
                : "px-3 py-2 text-sm rounded-full text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[rgba(231,155,190,0.08)] transition-colors"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
