/**
 * UserMenu — 登录后的用户菜单
 * 显示头像 + 下拉菜单（个人中心、收藏、退出）
 *
 * 修改方式：修改 dropdownItems 数组可增减菜单项
 */
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 用户名首字母（fallback）
  const initials = user.name?.charAt(0).toUpperCase() || "?";

  return (
    <div className="relative ml-1" ref={menuRef}>
      {/* 头像按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center"
        aria-label="用户菜单"
      >
        <Avatar className="h-8 w-8 border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
          <AvatarImage src={user.image || undefined} alt={user.name || "用户"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </button>

      {/* 下拉菜单 */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-[var(--border)] bg-white dark:bg-black shadow-lg z-50">
          {/* 用户信息 */}
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-sm font-medium text-[var(--foreground)] truncate">
              {user.name || "用户"}
            </p>
          </div>

          {/* 菜单项 */}
          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              个人中心
            </Link>
            <Link
              href="/dashboard/bookmarks"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              我的收藏
            </Link>
          </div>

          {/* 退出按钮 */}
          <div className="py-1 border-t border-[var(--border)]">
            <Link
              href="/api/auth/signout"
              className="block px-4 py-2 text-sm text-[var(--destructive)] hover:bg-[var(--muted)] transition-colors"
            >
              退出登录
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
