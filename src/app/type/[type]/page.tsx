/**
 * 类型筛选页 — /type/[type]
 * 按作品类型（插画/漫画/视频/文章/COS）筛选作品列表
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostsByType } from "@/lib/posts";
import { FeedList } from "@/components/feed/feed-list";
import { POST_TYPE_LABELS } from "@/types/post";
import Link from "next/link";

// ===== 类型定义 =====
interface TypePageProps {
  params: Promise<{ type: string }>;
}

// ===== 合法类型列表 =====
const VALID_TYPES = Object.keys(POST_TYPE_LABELS);

// ===== 静态生成 =====
export async function generateStaticParams() {
  return VALID_TYPES.map((type) => ({ type }));
}

// ===== 动态 SEO =====
export async function generateMetadata({
  params,
}: TypePageProps): Promise<Metadata> {
  const { type } = await params;
  const label = POST_TYPE_LABELS[type as keyof typeof POST_TYPE_LABELS];
  if (!label) return { title: "未知分类" };

  return {
    title: `${label}作品`,
    description: `达妮娅同人二创 — ${label}类作品合集`,
  };
}

// ===== 页面组件 =====
export default async function TypePage({ params }: TypePageProps) {
  const { type } = await params;

  // 验证类型是否合法
  if (!VALID_TYPES.includes(type)) notFound();

  const posts = getPostsByType(type);
  const label = POST_TYPE_LABELS[type as keyof typeof POST_TYPE_LABELS];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-[var(--primary)] hover:underline mb-2 inline-block"
        >
          ← 返回首页
        </Link>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {label}
          <span className="ml-2 text-base font-normal text-[var(--muted-foreground)]">
            ({posts.length} 篇)
          </span>
        </h1>
      </div>

      <FeedList posts={posts} />

      {posts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[var(--muted-foreground)]">
            该类型暂无作品，敬请期待
          </p>
        </div>
      )}
    </div>
  );
}
