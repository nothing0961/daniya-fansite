/**
 * FeedCard — 信息流作品卡片（微博风格）
 * 图片在上 + 标题/简介/出处标注/标签在下
 * 点击整张卡片跳转到作品详情页
 *
 * 修改方式：
 * - 调整卡片间距/圆角：修改 Card className
 * - 调整图片比例：修改 aspect-video 为其他 Tailwind aspect 类
 */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PostTypeBadge } from "@/components/post/post-type-badge";
import { PostCredit } from "@/components/post/post-credit";
import type { PostMeta } from "@/lib/posts";

interface FeedCardProps {
  post: PostMeta;
}

export function FeedCard({ post }: FeedCardProps) {
  const router = useRouter();
  const formattedDate = new Date(post.publishedAt).toLocaleDateString(
    "zh-CN",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <Link href={`/post/${post.slug}`} className="block group">
      <Card className="overflow-hidden hover:border-[var(--primary)]/40 transition-all duration-200 hover:shadow-lg hover:shadow-[var(--primary)]/5">
        {/* 缩略图区 */}
        {post.images.length > 0 ? (
          <div className="w-full aspect-video overflow-hidden">
            <img
              src={post.images[0]}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        ) : post.videoId ? (
          <div className="w-full aspect-video bg-black flex items-center justify-center relative">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-[var(--primary)]/80 transition-colors">
              <Play className="h-6 w-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        ) : (
          <div className="w-full aspect-video bg-[var(--muted)] flex items-center justify-center">
            <span className="text-[var(--muted-foreground)] text-sm">
              暂无预览图
            </span>
          </div>
        )}

        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <PostTypeBadge type={post.type} />
            <span className="text-xs text-[var(--muted-foreground)]">
              {formattedDate}
            </span>
          </div>
          <h3 className="text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-1">
            {post.title}
          </h3>
        </CardHeader>

        <CardContent>
          {/* 简介 — 最多两行 */}
          <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3 leading-relaxed">
            {post.description}
          </p>

          {/* 出处标注 — 暖金色 */}
          <PostCredit
            creator={post.originalCreator}
            platform={post.sourcePlatform}
            url={post.sourceUrl}
          />

          {/* 标签 */}
          {post.tags.length > 0 && (
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {post.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="text-xs text-[var(--primary)] hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    router.push(`/tag/${tag}`);
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
