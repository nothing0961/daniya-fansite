/**
 * BookmarkButton — 收藏按钮
 * 未登录 → 点击跳转登录页
 * 已登录 → 点击切换收藏状态（乐观更新）
 *
 * 修改方式：修改图标或文字即可改变按钮外观
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BookmarkButtonProps {
  postSlug: string;
  /** 初始收藏状态（服务端渲染时传入，可选） */
  initialBookmarked?: boolean;
}

export function BookmarkButton({
  postSlug,
  initialBookmarked = false,
}: BookmarkButtonProps) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);

    try {
      if (bookmarked) {
        // 取消收藏
        const res = await fetch(
          `/api/bookmarks?postSlug=${encodeURIComponent(postSlug)}`,
          { method: "DELETE" }
        );
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.ok) setBookmarked(false);
      } else {
        // 添加收藏
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postSlug }),
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.ok) setBookmarked(true);
      }
    } catch (err) {
      console.error("收藏操作失败:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
        bookmarked
          ? "border-[var(--credit)] bg-[var(--credit)]/10 text-[var(--credit)]"
          : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--credit)] hover:text-[var(--credit)]"
      }`}
      title={bookmarked ? "取消收藏" : "收藏作品"}
    >
      {/* 书签图标 — 实心/空心 */}
      <svg
        className="h-4 w-4"
        fill={bookmarked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
      {loading ? "..." : bookmarked ? "已收藏" : "收藏"}
    </button>
  );
}
