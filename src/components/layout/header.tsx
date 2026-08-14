/**
 * Header V2 — 鸣潮风半透明胶囊导航栏（2026-08-04 改版）
 * 服务端组件：检测登录状态，动态展示 UserMenu 或 SignInButton
 *
 * 结构（横向单胶囊）：
 *   [ 头像 + 站名 ] · [ 首页 / 作品集 / 达妮娅 / 飞讯 （当前页白色胶囊高亮） ] · [ 搜索框 · 音乐 · 主题 · 登录/用户 ]
 *
 * 视觉要点：
 *   - 外层半透明深色胶囊 + 顶部高光光晕 + 毛玻璃 + 外发光
 *   - 导航项：当前 active 项用白色实心胶囊
 *   - 功能按钮：圆形（h-9 w-9），半透明填充，hover 有 primary 色高亮
 */
import Link from "next/link";
import { auth } from "@/auth";
import { MusicPlayer } from "@/components/shared/music-player";
import { BgSwitcher } from "@/components/shared/bg-switcher";
import { UserMenu } from "@/components/auth/user-menu";
import { SignInButton } from "@/components/auth/sign-in-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { NavLinks } from "./nav-links";
import { MobileNav } from "./mobile-nav";

/** 主导航链接 — 修改此数组可增减导航项（桌面端高亮逻辑见 nav-links.tsx），移动端 MobileNav 使用同一来源 */
const navLinks = [
  { href: "/", label: "首页" },
  { href: "/works", label: "作品集" },
  { href: "/character", label: "达妮娅" },
  { href: "/chat", label: "飞讯" },
];

export async function Header() {
  // 服务端获取当前会话
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 w-full pt-3 px-3 sm:pt-4 sm:px-4 md:px-6">
      <div
        className="mx-auto max-w-5xl flex h-14 items-center gap-3 px-3 sm:px-4
                   rounded-2xl
                   border border-[rgba(255,255,255,0.08)]
                   bg-[color-mix(in_oklch,var(--background)_90%,transparent)]
                   backdrop-blur-xl
                   shadow-[0_0_0_1px_rgba(231,155,190,0.06)_inset,
                           0_1px_0_rgba(255,255,255,0.05)_inset,
                           0_10px_30px_-10px_rgba(0,0,0,0.5),
                           0_4px_16px_rgba(0,0,0,0.3)]
                   relative"
      >
        {/* 顶部高光光晕（仿鸣潮官方 Header 顶部发光条） */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-px h-px
                     bg-gradient-to-r
                     from-transparent via-[rgba(231,155,190,0.5)] to-transparent"
        />
        {/* 左右两侧轻微外发光 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-20
                     bg-[color-mix(in_oklch,var(--primary)_25%,transparent)]
                     blur-2xl rounded-full opacity-60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-20
                     bg-[color-mix(in_oklch,var(--daniya-accent,var(--accent))_30%,transparent)]
                     blur-2xl rounded-full opacity-60"
        />

        {/* ===== 左侧：头像 + 站名 ===== */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            aria-label="达妮娅的瞌睡小屋 · 返回首页"
            className="relative flex items-center gap-2.5 group"
          >
            {/* 头像：方形圆角，带金边，hover 微亮 */}
            <div
              className="relative w-9 h-9 shrink-0 rounded-md overflow-hidden
                         ring-1 ring-[rgba(231,155,190,0.5)]
                         shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]
                         transition-transform group-hover:scale-105"
            >
              <img
                src="/625294f4d0b740f4bf5ce693ddb0b35920260521.png"
                alt="达妮娅的瞌睡小屋"
                className="w-full h-full object-cover"
              />
            </div>
            {/* 站名：英文小字 + 中文大字，仅 sm 及以上显示 */}
            <div className="hidden sm:block min-w-0" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
              <div
                className="text-[10px] tracking-[0.25em] uppercase font-medium
                           text-[color-mix(in_oklch,var(--daniya-star,var(--foreground))_65%,var(--muted-foreground))]"
              >
                DANIYA · HUT
              </div>
              <div className="text-sm font-bold leading-tight text-[var(--foreground)] tracking-wide">
                达妮娅的瞌睡小屋
              </div>
            </div>
          </Link>
        </div>

        {/* ===== 中间：导航链接（桌面端）—— 当前页白色胶囊高亮 ===== */}
        <NavLinks />

        {/* ===== 右侧：操作区 ===== */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          {/* 搜索栏（桌面端）—— 原生 GET form 跳 /search?q=xxx，嵌入胶囊风 */}
          <form
            action="/search"
            className="hidden lg:flex items-center gap-1.5
                       rounded-full border border-[rgba(255,255,255,0.1)]
                       bg-[rgba(255,255,255,0.06)]
                       pl-3 pr-1.5 h-9 w-52
                       focus-within:w-64
                       focus-within:border-[rgba(231,155,190,0.5)]
                       focus-within:bg-[rgba(255,255,255,0.1)]
                       transition-all"
            role="search"
          >
            <svg
              className="h-4 w-4 text-[var(--muted-foreground)] shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <input
              type="search"
              name="q"
              placeholder="搜索作品 / 标签…"
              className="flex-1 bg-transparent outline-none text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] min-w-0"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
            />
          </form>

          {/* 音乐播放器 */}
          <MusicPlayer />

          {/* 背景图切换 */}
          <BgSwitcher />

          {/* 投稿入口（仅登录） */}
          {user && (
            <Link
              href="/submit"
              className="hidden sm:inline-flex h-9 items-center px-3.5 rounded-full
                         text-xs font-semibold
                         border border-[rgba(231,155,190,0.5)]
                         text-[color-mix(in_oklch,var(--daniya-star,var(--foreground))_85%,var(--foreground))]
                         bg-[rgba(231,155,190,0.15)]
                         hover:bg-[rgba(231,155,190,0.25)]
                         hover:border-[rgba(231,155,190,0.75)]
                         transition-colors shrink-0"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
            >
              投稿
            </Link>
          )}

          {/* 站内通知铃铛（仅站长） */}
          {user && user.id === process.env.ADMIN_USER_ID && <NotificationBell />}

          {/* 根据登录状态显示不同组件 */}
          <div className="shrink-0">
            {user ? <UserMenu user={user} /> : <SignInButton />}
          </div>

          {/* 移动端汉堡菜单 */}
          <MobileNav links={navLinks} user={user} />
        </div>
      </div>
    </header>
  );
}
