/**
 * WorksCard — 作品集卡片（瀑布流单元）
 * 封面图 + 标题 + 作者 + 日期
 * 点击卡片开灯箱；hover 覆盖层：收藏（登录态分流 + /api/bookmarks）、预览
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, Eye } from "lucide-react";
import { toast } from "sonner";
import type { PostMeta } from "@/lib/posts";
import { POST_TYPE_LABELS } from "@/lib/works-constants";

interface WorksCardProps {
  post: PostMeta;
  onPreview: (post: PostMeta) => void;
}

export function WorksCard({ post, onPreview }: WorksCardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  const cover = post.images[0];
  const formattedDate = new Date(post.publishedAt).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (status !== "authenticated" || !session?.user) {
      toast("请先登录后再收藏");
      router.push("/login");
      return;
    }
    if (favBusy) return;
    setFavBusy(true);
    try {
      if (bookmarked) {
        const res = await fetch(
          `/api/bookmarks?postSlug=${encodeURIComponent(post.slug)}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setBookmarked(false);
          toast.success("已取消收藏");
        } else if (res.status === 401) {
          toast.error("登录已过期，请重新登录");
          router.push("/login");
        } else {
          toast.error("取消收藏失败，请稍后重试");
        }
      } else {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postSlug: post.slug }),
        });
        if (res.ok) {
          setBookmarked(true);
          toast.success("已收藏");
        } else if (res.status === 401) {
          toast.error("登录已过期，请重新登录");
          router.push("/login");
        } else if (res.status === 409) {
          setBookmarked(true);
          toast("已在收藏夹中");
        } else {
          toast.error("收藏失败，请稍后重试");
        }
      }
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setFavBusy(false);
    }
  };

  return (
    <div className="wp-card" onClick={() => onPreview(post)}>
      {/* 封面图 */}
      <div className="wp-card-cover">
        {cover ? (
          <img
            src={cover}
            alt={post.title}
            loading="lazy"
            className="wp-card-img"
          />
        ) : post.videoId ? (
          <div className="wp-card-placeholder wp-card-video">
            <span>▶</span>
          </div>
        ) : (
          <div className="wp-card-placeholder">
            <span>暂无图</span>
          </div>
        )}

        {/* 类型角标 */}
        <span className={`wp-card-badge wp-badge--${post.type}`}>
          {POST_TYPE_LABELS[post.type] || post.type}
        </span>

        {/* Hover 覆盖层 */}
        <div className="wp-card-overlay">
          <div className="wp-card-actions">
            <button
              className={`wp-card-btn ${bookmarked ? "wp-card-btn--on" : ""}`}
              title={bookmarked ? "取消收藏" : "收藏"}
              onClick={handleFavorite}
              disabled={favBusy}
            >
              <Heart size={16} fill={bookmarked ? "currentColor" : "none"} />
            </button>
            <button
              className="wp-card-btn"
              title="预览"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onPreview(post);
              }}
            >
              <Eye size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="wp-card-info">
        <h3 className="wp-card-title">{post.title}</h3>
        <div className="wp-card-meta">
          <span className="wp-card-author">{post.originalCreator}</span>
          <span className="wp-card-date">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
