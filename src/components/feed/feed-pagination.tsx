/**
 * FeedPagination — 信息流分页控件
 * 显示上一页/下一页按钮和当前页码
 *
 * 修改方式：调整每页数量修改 pageSize 默认值
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface FeedPaginationProps {
  currentPage: number;
  totalPages: number;
  /** 生成分页链接的基础路径，如 "/" 或 "/type/illustration" */
  basePath?: string;
}

export function FeedPagination({
  currentPage,
  totalPages,
  basePath = "",
}: FeedPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      {currentPage > 1 ? (
        <Link href={`${basePath}?page=${currentPage - 1}`}>
          <Button variant="outline" size="sm">
            ← 上一页
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          ← 上一页
        </Button>
      )}

      <span className="text-sm text-[var(--muted-foreground)]">
        {currentPage} / {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link href={`${basePath}?page=${currentPage + 1}`}>
          <Button variant="outline" size="sm">
            下一页 →
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          下一页 →
        </Button>
      )}
    </div>
  );
}
