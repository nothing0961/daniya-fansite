/**
 * NotificationBell — 站内通知铃铛（仅站长）
 * 挂载时拉一次未读数 + 每 30s 轮询 + 窗口聚焦时刷新
 */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/notifications/unread-count", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (typeof json?.count === "number") setCount(json.count);
      } catch {
        // 网络错误静默，下次轮询再试
      }
    }

    refresh();
    timerRef.current = setInterval(refresh, 30_000);
    const onFocus = () => {
      refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={`站内通知${count > 0 ? `（${count} 条未读）` : ""}`}
      title={count > 0 ? `有 ${count} 条未读通知` : "站内通知"}
      className="relative flex h-9 w-9 items-center justify-center rounded-full
                 border border-[rgba(255,255,255,0.08)]
                 bg-[rgba(255,255,255,0.06)]
                 text-[var(--muted-foreground)]
                 hover:bg-[rgba(231,155,190,0.15)]
                 hover:text-[var(--primary)]
                 transition-colors shrink-0"
    >
      <svg
        className="h-[18px] w-[18px]"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      </svg>

      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full
                     bg-[#e0526e] px-1 text-[10px] font-bold leading-none text-white
                     shadow-[0_0_8px_rgba(224,82,110,0.8)]"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
