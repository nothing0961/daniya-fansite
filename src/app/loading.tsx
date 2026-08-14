/**
 * Loading — 根路由加载骨架屏
 * 按首页三栏布局占位，切换时减少布局跳动
 */
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-[1400px] px-6 py-4"
      style={{
        display: "grid",
        gridTemplateColumns: "280px minmax(0, 1fr) 300px",
        gap: "1rem",
      }}
    >
      {/* 左栏：俄罗斯方块机 + 语音回声占位 */}
      <div className="space-y-3">
        <Skeleton className="h-[500px] w-full rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-4/5 rounded-xl" />
          <Skeleton className="h-10 w-3/5 rounded-xl" />
          <Skeleton className="h-10 w-2/3 rounded-xl" />
        </div>
      </div>

      {/* 中栏：主舞台占位（文字 + 立绘海报卡） */}
      <div className="space-y-3">
        <div className="flex gap-4 h-full">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-1/2 rounded-xl" />
            <Skeleton className="h-14 w-3/4 rounded-xl" />
            <Skeleton className="h-6 w-2/3 rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-10 w-48 rounded-full" />
          </div>
          <Skeleton className="w-[240px] shrink-0 self-center rounded-2xl" style={{ aspectRatio: "2/3" }} />
        </div>
      </div>

      {/* 右栏：回声面板占位（含站点速览） */}
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );
}
