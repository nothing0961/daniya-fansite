/**
 * 搜索页 — /search
 * 客户端搜索：输入关键词 → 调 /api/search → 展示结果
 * 采用防抖策略减少 API 请求
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { FeedCard } from "@/components/feed/feed-card";
import type { PostMeta } from "@/lib/posts";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PostMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  /**
   * 防抖搜索 — 用户停止输入 300ms 后发起请求
   */
  const debouncedSearch = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (q: string) => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          if (q.trim().length === 0) {
            setResults([]);
            setSearched(false);
            return;
          }

          setLoading(true);
          setSearched(true);
          try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setResults(data.results);
          } catch (err) {
            console.error("搜索失败:", err);
            setResults([]);
          } finally {
            setLoading(false);
          }
        }, 300);
      };
    })(),
    []
  );

  // 当输入变化时触发防抖搜索
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        搜索作品
      </h1>

      {/* 搜索输入框 */}
      <div className="relative mb-8">
        <Input
          type="text"
          placeholder="搜索作品标题、描述、标签、原作者..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-12 text-base pl-10"
          autoFocus
        />
        {/* 搜索图标 */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>

      {/* 搜索结果 */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin h-6 w-6 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
          <p className="text-sm text-[var(--muted-foreground)] mt-3">
            搜索中...
          </p>
        </div>
      )}

      {!loading && searched && (
        <div className="mb-4 text-sm text-[var(--muted-foreground)]">
          找到 {results.length} 篇作品
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="flex flex-col gap-5">
          {results.map((post) => (
            <FeedCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && query.trim() !== "" && (
        <div className="text-center py-16">
          <p className="text-[var(--muted-foreground)]">
            未找到匹配的作品
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            试试其他关键词
          </p>
        </div>
      )}

      {/* 初始空状态 */}
      {!searched && (
        <div className="text-center py-16">
          <p className="text-[var(--muted-foreground)]">
            输入关键词搜索作品
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            支持搜索标题、描述、标签和原作者名
          </p>
        </div>
      )}
    </div>
  );
}
