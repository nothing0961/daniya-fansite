"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChatDrawer } from "@/components/chat/chat-drawer-context";

/**
 * NavLinks — 桌面端主导航链接
 * "飞讯" 项渲染为 button，点击直接打开全局聊天抽屉，不跳转页面
 */
export function NavLinks() {
  const pathname = usePathname() ?? "/";
  const { openDrawer, open } = useChatDrawer();

  const navItems = [
    { href: "/", label: "首页" },
    { href: "/works", label: "作品集" },
    { href: "/character", label: "达妮娅" },
  ];

  const activeClass =
    "inline-flex h-9 items-center px-4 rounded-full border border-[rgba(255,255,255,0.12)] bg-[var(--foreground)] text-[var(--background)] text-sm font-semibold tracking-wide shadow-[0_4px_14px_-4px_rgba(255,255,255,0.25),0_1px_3px_rgba(0,0,0,0.3)] transition-all";
  const inactiveClass =
    "inline-flex h-9 items-center px-4 rounded-full border border-transparent text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.06)] transition-colors";

  return (
    <nav className="hidden md:flex items-center gap-1 mx-auto">
      {navItems.map((link) => {
        const isActive =
          link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={isActive ? activeClass : inactiveClass}
            style={isActive ? { textShadow: "0 1px 2px rgba(0,0,0,0.4)" } : undefined}
          >
            {link.label}
          </Link>
        );
      })}
      {/* 飞讯 — button 而非 Link，避免任何页面跳转 */}
      <button
        type="button"
        aria-current={open ? "page" : undefined}
        onClick={() => { if (!open) openDrawer(); }}
        className={open ? activeClass : inactiveClass}
        style={open ? { textShadow: "0 1px 2px rgba(0,0,0,0.4)" } : undefined}
      >
        飞讯
      </button>
    </nav>
  );
}
