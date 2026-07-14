/**
 * FeedPagination — 信息流分页控件
 * 显示上一页/下一页按钮和当前页码
 *
 * 修改方式：调整每页数量修改 pageSize 默认值
 */
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FeedPaginationProps {
  currentPage: number;
  totalPages: number;
  /** 生成分页链接的基础路径，如 "/" 或 "/type/illustration" */
  basePath?: string;
}

const linkClass = cn(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
  "border border-[var(--border)] bg-transparent hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
  "h-9 px-3 text-sm",
);

export function FeedPagination({
  currentPage,
  totalPages,
  basePath = "",
}: FeedPaginationProps) {
  if (totalPages <= 1) return null;

  const separator = basePath.includes("?") ? "&" : "?";

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      {currentPage > 1 ? (
        <Link href={`${basePath}${separator}page=${currentPage - 1}`} className={linkClass}>
          ← 上一页
        </Link>
      ) : (
        <span className={cn(linkClass, "opacity-50 cursor-not-allowed")}>
          ← 上一页
        </span>
      )}

      <span className="text-sm text-[var(--muted-foreground)]">
        {currentPage} / {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link href={`${basePath}${separator}page=${currentPage + 1}`} className={linkClass}>
          下一页 →
        </Link>
      ) : (
        <span className={cn(linkClass, "opacity-50 cursor-not-allowed")}>
          下一页 →
        </span>
      )}
    </div>
  );
}
