/**
 * FeedList — 作品卡片列表容器
 * 以垂直列表形式排列 FeedCard
 *
 * 修改方式：修改 gap 可调整卡片间距，修改 max-w 可调整内容宽度
 */
import { FeedCard } from "./feed-card";
import type { PostMeta } from "@/lib/posts";

interface FeedListProps {
  posts: PostMeta[];
}

export function FeedList({ posts }: FeedListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--muted-foreground)]">暂无作品</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {posts.map((post) => (
        <FeedCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
