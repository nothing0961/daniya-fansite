/**
 * AuthShell — 登录/注册页共用玻璃卡片容器
 * 星空底 + 玻璃胶囊卡 + 星标点缀，与全站胶囊语言统一
 */
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 py-10">
      <div className="w-full max-w-sm">
        <div
          className="rounded-2xl px-6 py-8
                     border border-[rgba(231,155,190,0.15)]
                     bg-[color-mix(in_oklch,var(--card)_75%,transparent)]
                     backdrop-blur-xl
                     shadow-[0_0_0_1px_rgba(231,155,190,0.06)_inset,
                             0_1px_0_rgba(255,255,255,0.05)_inset,
                             0_16px_40px_-12px_rgba(0,0,0,0.5)]"
        >
          {/* 顶部星标 */}
          <div className="text-center mb-6">
            <div
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full
                         border border-[rgba(231,155,190,0.25)]
                         bg-[rgba(231,155,190,0.1)]"
            >
              <span className="star-twinkle text-sm text-[var(--daniya-star,var(--foreground))]">✦</span>
            </div>
            <h1 className="font-serif text-xl font-bold tracking-wide text-[var(--foreground)]">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">{subtitle}</p>
          </div>

          {children}
        </div>

        {footer && (
          <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]">{footer}</p>
        )}
      </div>
    </div>
  );
}
