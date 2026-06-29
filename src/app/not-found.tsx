/**
 * 404 页面 — 资源未找到时显示
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-[var(--muted-foreground)] mb-4">
        404
      </h1>
      <p className="text-lg text-[var(--foreground)] mb-2">
        页面未找到
      </p>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        你访问的页面不存在或已被移除
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
      >
        返回首页
      </Link>
    </div>
  );
}
