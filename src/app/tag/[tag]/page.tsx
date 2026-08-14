/**
 * 标签筛选页 — /tag/[tag]
 * 按标签筛选作品列表
 */
import type { Metadata } from "next";
import { getPostsByTag } from "@/lib/posts";
import { FeedList } from "@/components/feed/feed-list";
import Link from "next/link";

// ===== 类型定义 =====
interface TagPageProps {
  params: Promise<{ tag: string }>;
}

// ===== 动态 SEO =====
export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag}`,
    description: `查看带有 #${tag} 标签的达妮娅同人二创作品`,
  };
}

// ===== 页面组件 =====
export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;

  // 解码 URL 中的标签（处理中文标签）
  const decodedTag = decodeURIComponent(tag);
  const posts = getPostsByTag(decodedTag);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 rounded-full border border-[rgba(231,155,190,0.2)]
                     bg-[rgba(231,155,190,0.06)] px-3 py-1 text-xs text-[var(--primary)]
                     hover:bg-[rgba(231,155,190,0.15)] transition-colors"
        >
          ← 返回首页
        </Link>
        <h1 className="font-serif text-2xl font-bold tracking-wide text-[var(--foreground)]">
          #{decodedTag}
          <span className="ml-2 text-base font-normal text-[var(--muted-foreground)]">
            ({posts.length} 篇)
          </span>
        </h1>
      </div>

      <FeedList posts={posts} />

      {posts.length === 0 && (
        <div className="text-center py-16">
          <p className="mb-2 text-2xl" aria-hidden="true">🫧</p>
          <p className="text-[var(--muted-foreground)]">
            该标签暂无作品
          </p>
          <Link
            href="/"
            className="mt-2 inline-block text-sm text-[var(--primary)] hover:underline"
          >
            浏览全部作品
          </Link>
        </div>
      )}
    </div>
  );
}
