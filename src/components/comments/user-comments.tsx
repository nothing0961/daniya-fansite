"use client";

/**
 * 自建评论前端组件（打通站内用户名+密码体系）
 *
 * 三大状态：
 *  1. 拉取中 → 显示「加载评论中…」
 *  2. 加载完成：
 *     - 列表区：按时间正序，每条 = 头像 + 昵称 + 时间 + 内容 + 【删除（作者/站长可见）】
 *     - 底部输入区：
 *         · 已登录（currentUserId 有值）：textarea（1-1000 字 + 字数计数）+ 发表按钮
 *         · 未登录：「登录后即可评论」引导 + 跳 /login 胶囊按钮
 *  3. 空列表：显示「还没有评论，快来抢第一条吧」
 *
 * Props 由服务端页面组件（如 /post/[slug]/page.tsx）注入，
 * 避免客户端组件自己去拿 auth session 造成冗余请求 & bundle 变大。
 */
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CommentAuthorDTO {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

interface CommentDTO {
  id: string;
  userId: string;
  postSlug: string;
  content: string;
  createdAt: string; // ISO 字符串
  user: CommentAuthorDTO;
}

interface UserCommentsProps {
  postSlug: string;
  /** 当前登录用户 id；未登录传 null */
  currentUserId: string | null;
  /** 当前用户是否是站长（ADMIN_USER_ID），用于展示删除按钮 */
  isAdmin?: boolean;
}

const CONTENT_MAX = 1000;

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** 从用户名/name 里取一个展示名 + 取首字母作为 AvatarFallback */
function pickDisplayName(u: CommentAuthorDTO): string {
  return u.name || u.username || "匿名用户";
}
function pickFallback(u: CommentAuthorDTO): string {
  const name = pickDisplayName(u);
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function UserComments({
  postSlug,
  currentUserId,
  isAdmin = false,
}: UserCommentsProps) {
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [content, setContent] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ===== 1. 初始加载评论列表 =====
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetch(`/api/posts/${encodeURIComponent(postSlug)}/comments`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.comments && Array.isArray(data.comments)) {
          setComments(data.comments as CommentDTO[]);
          setCount(typeof data.count === "number" ? data.count : data.comments.length);
        }
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setLoadError(e.message || "评论列表加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [postSlug]);

  // ===== 2. 发表评论 =====
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    const trimmed = content.trim();
    if (trimmed.length < 1) {
      setSubmitError("评论内容不能为空");
      return;
    }
    if (trimmed.length > CONTENT_MAX) {
      setSubmitError(`评论内容最多 ${CONTENT_MAX} 字`);
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/posts/${encodeURIComponent(postSlug)}/comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: trimmed }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          // 401 → 引导登录；其他错误 → 显示返回信息
          if (res.status === 401) {
            setSubmitError("请先登录后再发表评论");
          } else {
            setSubmitError(data?.error || `发表失败（${res.status}）`);
          }
          return;
        }

        // 成功：清空输入框 + 把新评论追加到列表
        setContent("");
        setSubmitError(null);
        if (data?.comment) {
          setComments((prev) => [...prev, data.comment as CommentDTO]);
          setCount((n) => n + 1);
        }
      } catch (e) {
        setSubmitError((e as Error).message || "网络异常，请重试");
      }
    });
  }

  // ===== 3. 删除评论（作者本人 or 站长） =====
  function onDelete(commentId: string) {
    const ok = window.confirm("确定要删除这条评论吗？此操作不可撤销。");
    if (!ok) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          alert(`删除失败：${data?.error || res.status}`);
          return;
        }
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setCount((n) => Math.max(0, n - 1));
      } catch (e) {
        alert(`删除失败：${(e as Error).message}`);
      }
    });
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
        评论{typeof count === "number" ? ` (${count})` : ""}
      </h3>

      {/* ========== 加载 / 加载失败 ========== */}
      {loading && (
        <p className="text-sm text-[var(--muted-foreground)] mb-4">加载评论中…</p>
      )}
      {!loading && loadError && (
        <p className="text-sm text-red-500 mb-4">加载失败：{loadError}</p>
      )}

      {/* ========== 评论列表 ========== */}
      {!loading && comments.length === 0 && !loadError && (
        <div className="rounded-lg border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--muted-foreground)]">
          还没有评论，快来抢第一条吧 ✨
        </div>
      )}

      {!loading && comments.length > 0 && (
        <ul className="space-y-4 mb-6">
          {comments.map((c) => {
            const canDelete =
              !!currentUserId &&
              (currentUserId === c.userId || isAdmin);
            return (
              <li
                key={c.id}
                className="flex gap-3 p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)]"
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={c.user.image || undefined} alt={pickDisplayName(c.user)} />
                  <AvatarFallback>{pickFallback(c.user)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {pickDisplayName(c.user)}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatDate(c.createdAt)}
                    </span>
                    {canDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDelete(c.id)}
                        disabled={isPending}
                      >
                        删除
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-[15px] leading-relaxed text-[var(--foreground)] whitespace-pre-wrap break-words">
                    {c.content}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Separator className="my-6" />

      {/* ========== 底部输入区 ========== */}
      {currentUserId ? (
        <form onSubmit={onSubmit} className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={CONTENT_MAX + 100} // 允许临时超一点点，Zod 再校验
            placeholder="说点什么吧～（1-1000 字）"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-y"
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span
              className={`text-xs ${
                content.length > CONTENT_MAX
                  ? "text-red-500"
                  : "text-[var(--muted-foreground)]"
              }`}
            >
              {content.length} / {CONTENT_MAX}
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              {submitError && (
                <span className="text-xs text-red-500">{submitError}</span>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={isPending || content.length < 1 || content.length > CONTENT_MAX}
              >
                {isPending ? "发表中…" : "发表评论"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3 flex-wrap rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3">
          <p className="text-sm text-[var(--muted-foreground)]">
            登录后即可评论（使用站内的用户名 + 密码登录）
          </p>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-colors">
            去登录 →
          </Link>
        </div>
      )}
    </div>
  );
}
