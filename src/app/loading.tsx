/**
 * Loading — 根路由加载骨架屏
 * 页面切换时显示加载状态，减少布局跳动
 */
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* 模拟信息流骨架 */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-6 rounded-lg border border-[var(--border)] overflow-hidden">
          {/* 缩略图占位 */}
          <Skeleton className="w-full aspect-video rounded-none" />
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
