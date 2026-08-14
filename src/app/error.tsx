/**
 * Error 边界 — 页面渲染出错时显示
 * "use client" 是必需的，因为错误边界需要在客户端捕获错误
 */
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 将错误记录到控制台（生产环境可改为上报到日志服务）
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-full
                   border border-[rgba(231,155,190,0.3)] bg-[rgba(231,155,190,0.1)]"
        aria-hidden="true"
      >
        <span className="text-2xl">💤</span>
      </div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
        达妮娅打了个盹，页面走丢了
      </h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-8">
        页面渲染时遇到错误，请稍后重试
      </p>
      <button
        onClick={reset}
        className="inline-flex h-10 items-center px-6 rounded-full
                   border border-[rgba(231,155,190,0.5)]
                   bg-[rgba(231,155,190,0.12)]
                   text-sm font-semibold text-[var(--primary)]
                   hover:bg-[rgba(231,155,190,0.25)]
                   transition-colors"
      >
        重试
      </button>
    </div>
  );
}
