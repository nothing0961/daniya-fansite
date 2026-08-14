/**
 * Footer — 站点底部栏
 * 玻璃胶囊风：顶部粉线光晕 + 站名/导航/出处声明
 * 与 Header 的高光线、圆角、毛玻璃语言统一
 *
 * 角色页（/character）行为：滚动到接近页面底部时 Footer 才淡入出现；
 * 其他页面 Footer 常驻。占位始终保留，不影响滚动与布局。
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChatDrawer } from "@/components/chat/chat-drawer-context";

const FOOTER_LINKS = [
  { href: "/", label: "首页" },
  { href: "/works", label: "作品集" },
  { href: "/character", label: "达妮娅" },
  // 飞讯无独立路由：渲染为 button 打开聊天终端，避免指向已删除页面的 404
  { href: "/chat", label: "飞讯", isChat: true },
];

/** 距页面底部多少像素内视为「到底」 */
const NEAR_BOTTOM_THRESHOLD = 120;

const FOOTER_LINK_CLASS =
  "px-3 py-1.5 rounded-full text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[rgba(231,155,190,0.08)] transition-colors";

export function Footer() {
  const pathname = usePathname();
  const isCharacter = pathname === "/character";
  const { openDrawer } = useChatDrawer();
  const [nearBottom, setNearBottom] = useState(true);

  useEffect(() => {
    if (!isCharacter) return;
    const el = document.getElementById("main-scroll");
    if (!el) return;
    const update = () => {
      setNearBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_THRESHOLD);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isCharacter]);

  const hidden = isCharacter && !nearBottom;

  return (
    <footer
      className={`relative z-10 px-3 sm:px-4 md:px-6 pb-2 sm:pb-3 pt-1
                 transition-all duration-500 ease-out
                 ${hidden ? "opacity-0 translate-y-3 invisible pointer-events-none" : "opacity-100 translate-y-0 visible"}`}
    >
      {/* 顶部粉线光晕 — 与 Header 顶部高光线呼应 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px
                   bg-gradient-to-r
                   from-transparent via-[rgba(231,155,190,0.4)] to-transparent"
      />

      <div
        className="mx-auto max-w-5xl rounded-2xl
                   border border-[rgba(255,255,255,0.06)]
                   bg-[color-mix(in_oklch,var(--background)_85%,transparent)]
                   backdrop-blur-xl
                   shadow-[0_0_0_1px_rgba(231,155,190,0.06)_inset,
                           0_1px_0_rgba(255,255,255,0.04)_inset,
                           0_10px_30px_-10px_rgba(0,0,0,0.4)]"
      >
        <div className="px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* 品牌区 */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="relative w-8 h-8 shrink-0 rounded-md overflow-hidden
                         ring-1 ring-[rgba(231,155,190,0.4)]"
            >
              <img
                src="/625294f4d0b740f4bf5ce693ddb0b35920260521.png"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div
                className="font-serif text-sm font-bold text-[var(--foreground)] tracking-wide"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
              >
                达妮娅的瞌睡小屋
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)] truncate">
                鸣潮 · 达妮娅同人二创 curation 小屋
              </div>
            </div>
          </div>

          {/* 导航 */}
          <nav
            aria-label="页脚导航"
            className="flex items-center gap-1 flex-wrap sm:ml-auto"
          >
            {FOOTER_LINKS.map((link) =>
              link.isChat ? (
                <button
                  key={link.href}
                  type="button"
                  onClick={openDrawer}
                  className={FOOTER_LINK_CLASS}
                >
                  {link.label}
                </button>
              ) : (
                <Link key={link.href} href={link.href} className={FOOTER_LINK_CLASS}>
                  {link.label}
                </Link>
              ),
            )}
          </nav>
        </div>

        {/* 底部声明行 */}
        <div
          className="px-6 pb-2.5 pt-0 text-[11px] leading-relaxed
                     text-[var(--muted-foreground)]/80"
        >
          <p>
            二创作品版权归原作者所有 · 本站在非商业用途下运营 · 灵感来自
            《鸣潮》角色达妮娅
          </p>
        </div>
      </div>
    </footer>
  );
}
