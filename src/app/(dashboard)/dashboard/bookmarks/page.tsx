/**
 * 我的收藏页 — /dashboard/bookmarks
 * 展示当前用户所有收藏的作品
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPostBySlug } from "@/lib/posts";
import { FeedList } from "@/components/feed/feed-list";
import Link from "next/link";

export default async function BookmarksPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  // 获取用户收藏列表
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // 将 postSlug 映射为作品元数据
  const posts = bookmarks
    .map((b) => getPostBySlug(b.postSlug))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
        我的收藏
      </h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        共收藏 {posts.length} 篇作品
      </p>

      {posts.length > 0 ? (
        <FeedList posts={posts} />
      ) : (
        <div className="text-center py-16">
          <p className="text-[var(--muted-foreground)] mb-4">
            还没有收藏任何作品
          </p>
          <Link
            href="/"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            去发现作品 →
          </Link>
        </div>
      )}
    </div>
  );
}
