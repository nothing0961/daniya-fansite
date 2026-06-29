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
      <h1 className="text-4xl font-bold text-[var(--muted-foreground)] mb-4">
        出错了
      </h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        页面渲染时遇到错误，请稍后重试
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
      >
        重试
      </button>
    </div>
  );
}
