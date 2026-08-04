/**
 * WorksClient — 作品集客户端容器
 * 处理无限滚动的 page 状态
 * 当 allPosts 变化（Tab/排序切换）时自动重置状态
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import { WorksGallery } from "./works-gallery";
import type { PostMeta } from "@/lib/posts";

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

  const loadedPosts = allPosts.slice(0, loadedPages * pageSize);

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
      pageSize={pageSize}
      onLoadMore={handleLoadMore}
      loading={loading}
    />
  );
}
