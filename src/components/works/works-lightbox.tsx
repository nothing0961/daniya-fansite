/**
 * WorksLightbox — 作品集灯箱
 * 卡片点击后原位弹出大图浏览：多图切换、ESC/←→、视频占位 + 源平台跳转、
 * 收藏（登录态分流 + /api/bookmarks）、「查看详情」跳详情页
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, ExternalLink, Heart, X } from "lucide-react";
import { toast } from "sonner";
import type { PostMeta } from "@/lib/posts";
import { POST_TYPE_LABELS } from "@/lib/works-constants";

interface WorksLightboxProps {
  post: PostMeta | null;
  onClose: () => void;
}

export function WorksLightbox({ post, onClose }: WorksLightboxProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [imageIndex, setImageIndex] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  useEffect(() => {
    if (post) setImageIndex(0);
  }, [post]);

  const imageCount = post?.images.length ?? 0;

  const prev = useCallback(() => {
    if (imageCount < 2) return;
    setImageIndex((i) => (i - 1 + imageCount) % imageCount);
  }, [imageCount]);

  const next = useCallback(() => {
    if (imageCount < 2) return;
    setImageIndex((i) => (i + 1) % imageCount);
  }, [imageCount]);

  useEffect(() => {
    if (!post) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [post, onClose, prev, next]);

  const handleFavorite = async () => {
    if (!post) return;
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

  if (!post) return null;

  const currentImage = post.images[imageIndex];
  const typeLabel = POST_TYPE_LABELS[post.type] || post.type;

  return createPortal(
    <div className="wl-root" role="dialog" aria-modal="true">
      <div className="wl-overlay" onClick={onClose} />

      <div className="wl-panel">
        {/* 顶栏 */}
        <div className="wl-top">
          <div className="wl-top-info">
            <span className={`wp-card-badge wl-type-badge wp-badge--${post.type}`}>
              {typeLabel}
            </span>
            <h2 className="wl-title">{post.title}</h2>
          </div>
          <button className="wl-icon-btn" onClick={onClose} title="关闭 (ESC)">
            <X size={18} />
          </button>
        </div>

        {/* 媒体区 */}
        <div className="wl-media">
          {currentImage ? (
            <img src={currentImage} alt={post.title} className="wl-img" />
          ) : post.videoId ? (
            <div className="wl-video-placeholder">
              <span className="wl-video-icon">▶</span>
              <p className="wl-video-text">视频内容请在源平台查看</p>
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="wl-source-link"
              >
                {post.sourcePlatform || "源平台"} <ExternalLink size={14} />
              </a>
            </div>
          ) : (
            <div className="wl-no-image">暂无预览图</div>
          )}

          {imageCount > 1 && (
            <>
              <button className="wl-nav wl-nav--prev" onClick={prev} title="上一张 (←)">
                <ChevronLeft size={20} />
              </button>
              <button className="wl-nav wl-nav--next" onClick={next} title="下一张 (→)">
                <ChevronRight size={20} />
              </button>
              <span className="wl-counter">
                {imageIndex + 1} / {imageCount}
              </span>
            </>
          )}
        </div>

        {/* 底部信息 */}
        <div className="wl-footer">
          <div className="wl-meta">
            <span className="wl-author">作者 · {post.originalCreator}</span>
            <span className="wl-date">
              {new Date(post.publishedAt).toLocaleDateString("zh-CN")}
            </span>
          </div>

          {post.tags.length > 0 && (
            <div className="wl-tags">
              {post.tags.map((tag) => (
                <span key={tag} className="wl-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="wl-actions">
            <button
              className={`wp-btn wp-btn--ghost wl-fav ${bookmarked ? "wl-fav--on" : ""}`}
              onClick={handleFavorite}
              disabled={favBusy}
            >
              <Heart size={15} fill={bookmarked ? "currentColor" : "none"} />
              {bookmarked ? "已收藏" : "收藏"}
            </button>
            <Link
              href={`/post/${post.slug}`}
              className="wp-btn wp-btn--primary"
              onClick={onClose}
            >
              查看详情 →
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
