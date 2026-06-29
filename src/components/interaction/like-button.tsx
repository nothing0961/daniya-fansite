/**
 * LikeButton — 点赞按钮
 * 未登录 → 点击跳转登录页
 * 已登录 → 点击切换点赞状态（乐观更新）
 * 显示点赞总数
 *
 * 修改方式：修改图标即可改变按钮外观
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  postSlug: string;
}

export function LikeButton({ postSlug }: LikeButtonProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 挂载后加载初始点赞状态
  useEffect(() => {
    async function loadLikeState() {
      try {
        const res = await fetch(
          `/api/likes?postSlug=${encodeURIComponent(postSlug)}`
        );
        if (res.ok) {
          const data = await res.json();
          setCount(data.count);
          setLiked(data.liked);
        }
      } catch {
        // 加载失败时保持默认状态
      }
      setMounted(true);
    }
    loadLikeState();
  }, [postSlug]);

  const handleToggle = async () => {
    setLoading(true);

    // 乐观更新
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postSlug }),
      });
      if (res.status === 401) {
        // 未登录 — 回滚并跳转
        setLiked(prevLiked);
        setCount(prevCount);
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setCount(data.count);
      } else {
        // 请求失败 — 回滚
        setLiked(prevLiked);
        setCount(prevCount);
      }
    } catch {
      // 网络错误 — 回滚
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-[var(--border)] text-[var(--muted-foreground)]"
      >
        <svg className="h-4 w-4 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        --
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
        liked
          ? "border-red-500/50 bg-red-500/10 text-red-400"
          : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-red-500/50 hover:text-red-400"
      }`}
      title={liked ? "取消点赞" : "点赞"}
    >
      {/* 爱心图标 — 实心/空心 */}
      <svg
        className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`}
        fill={liked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      {loading ? "..." : count}
    </button>
  );
}
