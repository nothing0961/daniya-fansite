/**
 * PostMeta — 作品元信息展示
 * 显示发布日期、标签列表
 * variant="card" — 信息流卡片上的精简版
 * variant="detail" — 详情页的完整版
 */
import Link from "next/link";
import { PostTypeBadge } from "./post-type-badge";

interface PostMetaProps {
  type: string;
  publishedAt: string;
  tags: string[];
  variant?: "card" | "detail";
}

export function PostMeta({
  type,
  publishedAt,
  tags,
  variant = "card",
}: PostMetaProps) {
  const formattedDate = new Date(publishedAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (variant === "card") {
    return (
      <div className="flex items-center gap-2">
        <PostTypeBadge type={type} />
        <span className="text-xs text-[var(--muted-foreground)]">
          {formattedDate}
        </span>
      </div>
    );
  }

  // detail 版本
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <PostTypeBadge type={type} />
        <span className="text-sm text-[var(--muted-foreground)]">
          {formattedDate} 发布
        </span>
      </div>
      {tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/tag/${tag}`}
              className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
