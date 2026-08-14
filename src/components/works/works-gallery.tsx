/**
 * WorksGallery — 瀑布流网格容器
 * 使用 CSS columns 实现 masonry 布局
 * 支持无限滚动：通过 IntersectionObserver 触发加载更多
 * 管理灯箱状态：卡片点击 → WorksLightbox 原位预览
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { WorksCard } from "./works-card";
import { WorksLightbox } from "./works-lightbox";
import type { PostMeta } from "@/lib/posts";

interface WorksGalleryProps {
  posts: PostMeta[];
  totalCount: number;
  onLoadMore: () => void;
  loading: boolean;
}

export function WorksGallery({
  posts,
  totalCount,
  onLoadMore,
  loading,
}: WorksGalleryProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [lightboxPost, setLightboxPost] = useState<PostMeta | null>(null);
  const loadedCount = posts.length;
  const hasMore = loadedCount < totalCount;

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  if (posts.length === 0) {
    return (
      <div className="wp-empty">
        <p className="wp-empty-line">
          「还没有作品呢……要不要做第一个分享的人？」
        </p>
        <div className="wp-empty-actions">
          <Link href="/submit" className="wp-btn wp-btn--primary wp-btn-sm">
            投稿作品
          </Link>
          <Link href="/" className="wp-btn wp-btn--ghost wp-btn-sm">
            回首页看看
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="wp-gallery">
        {posts.map((post) => (
          <WorksCard key={post.slug} post={post} onPreview={setLightboxPost} />
        ))}

        {/* 无限滚动哨兵 */}
        <div ref={sentinelRef} className="wp-sentinel" />

        {loading && (
          <div className="wp-loading">
            <span className="wp-spinner" />
            加载中…
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="wp-end">— 已加载全部作品 —</div>
        )}
      </div>

      <WorksLightbox post={lightboxPost} onClose={() => setLightboxPost(null)} />
    </>
  );
}
