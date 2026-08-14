/**
 * WorksClient — 作品集客户端容器
 * 处理无限滚动的 page 状态
 * 当 allPosts 变化（Tab/排序切换）时自动重置状态
 *
 * 规模机制：作品量小（≤ FULL_RENDER_THRESHOLD）时直接全量渲染，
 * 超过阈值才启用哨兵无限滚动 —— 不为小规模套图库模板
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import { WorksGallery } from "./works-gallery";
import type { PostMeta } from "@/lib/posts";

const FULL_RENDER_THRESHOLD = 36;

interface WorksClientProps {
  allPosts: PostMeta[];
  pageSize: number;
}

export function WorksClient({ allPosts, pageSize }: WorksClientProps) {
  const [loadedPages, setLoadedPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoadedPages(1);
    setLoading(false);
  }, [allPosts.length]);

  const loadedPosts =
    allPosts.length <= FULL_RENDER_THRESHOLD
      ? allPosts
      : allPosts.slice(0, loadedPages * pageSize);

  const handleLoadMore = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setLoadedPages((p) => p + 1);
      setLoading(false);
    }, 400);
  }, [loading]);

  return (
    <WorksGallery
      posts={loadedPosts}
      totalCount={allPosts.length}
      onLoadMore={handleLoadMore}
      loading={loading}
    />
  );
}
