/**
 * Header — 站点顶部导航栏
 * 服务端组件：检测登录状态，动态展示 UserMenu 或 SignInButton
 *
 * 修改方式：
 * - 修改 navLinks 数组可增减导航项
 * - 修改 Logo 文字/图片可更换站点标识
 */
import Link from "next/link";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { SignInButton } from "@/components/auth/sign-in-button";
import { MobileNav } from "./mobile-nav";

/** 主导航链接 — 修改此数组可增减导航项 */
const navLinks = [
  { href: "/", label: "首页" },
  { href: "/character", label: "达妮娅" },
  { href: "/about", label: "关于" },
];

export async function Header() {
  // 服务端获取当前会话 — 传递给客户端组件
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md surface-pink">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        {/* 左侧：Logo */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
          >
            <img src="/A722CEB5396985A57C541E3CEF95F101.jpg" alt="达妮娅的瞌睡小屋" className="h-7 w-7 rounded object-cover" />
            <span className="hidden sm:inline">达妮娅的瞌睡小屋</span>
          </Link>
        </div>

        {/* 中间：导航链接（桌面端）—— 小胶囊样式，跟「投稿」按钮同款视觉 */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--primary)]/20 hover:border-[var(--primary)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 右侧：操作区 */}
        <div className="flex items-center gap-2">
          {/* 搜索栏（桌面端）—— 原生 GET form 跳 /search?q=xxx，跟投稿按钮同款胶囊外观 */}
          <form
            action="/search"
            className="hidden md:flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md pl-3 pr-1.5 h-8 w-48 focus-within:w-64 focus-within:border-[var(--primary)] focus-within:bg-[var(--card)]/80 transition-all"
            role="search"
          >
            <svg className="h-4 w-4 text-[var(--muted-foreground)] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <input
              type="search"
              name="q"
              placeholder="搜索作品 / 标签…"
              className="flex-1 bg-transparent outline-none text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] min-w-0"
            />
          </form>

          <ThemeToggle />

          {/* 投稿入口 */}
          {user && (
            <Link
              href="/submit"
              className="rounded-full border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--primary)]/20 hover:border-[var(--primary)] transition-colors"
            >
              投稿
            </Link>
          )}

          {/* 根据登录状态显示不同组件 */}
          {user ? (
            <UserMenu user={user} />
          ) : (
            <SignInButton />
          )}

          {/* 移动端汉堡菜单 */}
          <MobileNav links={navLinks} />
        </div>
      </div>
    </header>
  );
}
