/**
 * 个人中心路由级 loading — 切换页面时立即显示骨架屏
 * 消除"点了没反应"的迟滞感（RSC + 数据库查询期间先渲染骨架）
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8" aria-busy="true">
      <div className="flex items-center gap-3 mb-1">
        <span className="w-5 h-5 rounded-full bg-[var(--muted)]/60 animate-pulse" />
        <span className="w-24 h-3 rounded bg-[var(--muted)]/60 animate-pulse" />
      </div>
      <div className="w-40 h-7 rounded-lg bg-[var(--muted)]/60 animate-pulse mb-2" />
      <div className="w-64 h-4 rounded bg-[var(--muted)]/40 animate-pulse mb-6" />

      <div className="flex gap-1 border-b border-[var(--border)] mb-6">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-16 h-8 rounded bg-[var(--muted)]/40 animate-pulse"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>

      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)]/50 p-4 flex gap-4"
          >
            <div className="w-28 h-24 shrink-0 rounded-md bg-[var(--muted)]/40 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="w-3/5 h-5 rounded bg-[var(--muted)]/50 animate-pulse" />
              <div className="w-full h-3 rounded bg-[var(--muted)]/40 animate-pulse" />
              <div className="w-4/5 h-3 rounded bg-[var(--muted)]/40 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
