/**
 * Skeleton — 加载骨架屏组件
 * 内容加载前展示灰色占位块，减少布局跳动
 */
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
