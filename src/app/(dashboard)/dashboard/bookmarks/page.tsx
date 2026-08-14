/**
 * 我的收藏页 — /dashboard/bookmarks「收藏匣」
 * 眉题 + 匣子弧线装饰 + 收藏列表（FeedList 复用）+ 空状态邀请
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPostBySlug } from "@/lib/posts";
import { FeedList } from "@/components/feed/feed-list";
import Link from "next/link";
import "./../postal.css";

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
      {/* 眉题：收藏匣（与个人中心「小屋一角」同源的匣子语言） */}
      <div className="flex items-center gap-3 mb-1">
        <span className="chest-arch" aria-hidden="true" />
        <p className="text-[11px] tracking-[0.3em] uppercase text-[var(--muted-foreground)]">
          ✦ 收藏匣
        </p>
      </div>
      <h1 className="font-serif text-2xl font-bold tracking-wide text-[var(--foreground)] mb-2">
        我的收藏
      </h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        共收藏 {posts.length} 篇作品，小心愿都收在匣子里
      </p>

      {posts.length > 0 ? (
        <FeedList posts={posts} />
      ) : (
        <div className="text-center py-16">
          <p className="text-[var(--muted-foreground)] mb-4">
            匣子还空着——去首页逛逛，挑一件喜欢的收进来吧
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
