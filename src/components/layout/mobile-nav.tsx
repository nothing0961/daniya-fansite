/**
 * MobileNav — 移动端侧滑导航菜单
 * 点击汉堡图标展开，包含搜索、导航链接、投稿入口、登录、音乐和主题切换
 *
 * 修改方式：修改 links 传入的数组即可改变移动端菜单项
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MusicPlayer } from "@/components/shared/music-player";
import { useChatDrawer } from "@/components/chat/chat-drawer-context";

interface NavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  links: NavLink[];
  user?: { id: string; name?: string | null } | null;
}

export function MobileNav({ links, user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { openDrawer } = useChatDrawer();

  const close = () => setOpen(false);
  const isLoggedIn = Boolean(user);

  const handleLinkClick = (e: React.MouseEvent, link: NavLink) => {
    if (link.href === "/chat") {
      e.preventDefault();
      close();
      openDrawer();
    } else {
      close();
    }
  };

  return (
    <div className="md:hidden">
      {/* 汉堡菜单按钮 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label={open ? "关闭菜单" : "打开菜单"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* 遮罩层 */}
      {open && (
        <div
          className="fixed inset-0 top-14 z-40 bg-black/50"
          onClick={close}
        />
      )}

      {/* 侧滑菜单面板 */}
      <div
        className={`fixed top-14 right-0 z-50 h-[calc(100vh-3.5rem)] w-72 bg-[var(--background)] border-l border-[var(--border)] transform transition-transform duration-200 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 搜索栏 */}
        <div className="px-4 pt-4">
          <form
            action="/search"
            role="search"
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)]/50 px-3 py-2"
            onSubmit={close}
          >
            <Search className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
            <input
              type="search"
              name="q"
              placeholder="搜索作品 / 标签…"
              className="flex-1 bg-transparent outline-none text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
            />
          </form>
        </div>

        {/* 导航链接 */}
        <nav className="flex flex-col px-4 pt-3 gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link)}
              className="px-3 py-2.5 text-sm rounded-md hover:bg-[var(--muted)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 分隔线 */}
        <div className="mx-4 my-3 border-t border-[var(--border)]" />

        {/* 操作区：登录 / 投稿 / 个人中心 */}
        <div className="px-4 flex flex-col gap-1 pb-4">
          {isLoggedIn ? (
            <>
              <Link
                href="/submit"
                onClick={close}
                className="px-3 py-2.5 text-sm rounded-md bg-[var(--primary)]/15 text-[var(--primary)] text-center font-medium hover:bg-[var(--primary)]/25 transition-colors"
              >
                📝 投稿
              </Link>
              <Link
                href="/dashboard"
                onClick={close}
                className="px-3 py-2.5 text-sm rounded-md hover:bg-[var(--muted)] transition-colors"
              >
                个人中心
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              onClick={close}
              className="block w-full text-center px-3 py-2.5 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] font-medium"
            >
              登录
            </Link>
          )}
        </div>

        {/* 底部工具栏：音乐 + 主题 */}
        <div className="mt-auto px-4 py-3 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MusicPlayer />
            <span className="text-xs text-[var(--muted-foreground)] select-none">音乐</span>
          </div>
        </div>
      </div>
    </div>
  );
}
