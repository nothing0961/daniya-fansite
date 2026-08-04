/**
 * SignInButton — 登录按钮（胶囊风 Header 适配版）
 * 视觉：半透明+金边胶囊，hover 变实心金
 */
import Link from "next/link";

export function SignInButton() {
  return (
    <Link
      href="/login"
      className="inline-flex h-9 items-center px-3.5 rounded-full
                 text-xs font-bold tracking-wide
                 border border-[rgba(201,169,110,0.55)]
                 text-[color-mix(in_oklch,var(--daniya-star,var(--foreground))_95%,var(--foreground))]
                 bg-[rgba(201,169,110,0.14)]
                 hover:bg-[rgba(201,169,110,0.3)]
                 hover:border-[rgba(201,169,110,0.85)]
                 hover:text-[var(--background)]
                 transition-all shrink-0
                 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]"
    >
      登录
    </Link>
  );
}
