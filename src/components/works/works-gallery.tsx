/**
 * WorksGallery — 瀑布流网格容器
 * 使用 CSS columns 实现 masonry 布局
 * 支持无限滚动：通过 IntersectionObserver 触发加载更多
 */
"use client";

import { useEffect, useRef, useCallback } from "react";
import { WorksCard } from "./works-card";
import type { PostMeta } from "@/lib/posts";

interface WorksGalleryProps {
  posts: PostMeta[];
  totalCount: number;
  pageSize: number;
  onLoadMore: () => void;
  loading: boolean;
}

export function WorksGallery({
  posts,
  totalCount,
  pageSize,
  onLoadMore,
  loading,
}: WorksGalleryProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
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
        <p>暂无作品</p>
      </div>
    );
  }

  return (
    <div className="wp-gallery">
      {posts.map((post) => (
        <WorksCard key={post.slug} post={post} />
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
  );
}
