"use client";
import * as React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const DANIYA_AVATAR_SRC = "/A722CEB5396985A57C541E3CEF95F101.jpg";
const DANIYA_AVATAR_ALT = "达妮娅头像";

/**
 * HeaderChatButton — 集成在顶部导航栏的 AI 聊天按钮
 * 从 DaniyaChatFAB 中剥离 FAB 的 fixed 定位，保留登录拦截 Dialog 逻辑
 *
 * 两种入口：
 *   - 已登录 → 直接跳转 /chat
 *   - 未登录 → 打开「请先登录」居中弹窗（原 FAB 的 Dialog）
 */
export function HeaderChatButton({ className }: { className?: string }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(false);
  const isLoggedIn = Boolean(session?.user);

  if (status === "loading") {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        aria-label="达妮娅聊天"
        className={className}
      >
        <span className="h-5 w-5" />
      </Button>
    );
  }

  const baseBtn = cn(
    "inline-flex h-9 w-9 items-center justify-center rounded-full",
    "bg-[var(--card)]/50 backdrop-blur border border-[var(--border)]",
    "hover:bg-[var(--primary)]/15 hover:border-[var(--primary)]",
    "text-[var(--foreground)] transition-colors shrink-0",
    "relative",
    className,
  );

  const statusDot = cn(
    "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--background)]",
    isLoggedIn
      ? "bg-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.35)]"
      : "bg-slate-400",
  );

  return (
    <>
      {isLoggedIn ? (
        <Link
          href="/chat"
          data-testid="header-chat-button"
          aria-label="打开达妮娅聊天"
          className={baseBtn}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className={statusDot} aria-hidden="true" />
        </Link>
      ) : (
        <button
          type="button"
          data-testid="header-chat-button"
          aria-label="打开达妮娅聊天"
          onClick={() => setOpen(true)}
          className={baseBtn}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className={statusDot} aria-hidden="true" />
        </button>
      )}

      {!isLoggedIn && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="!max-w-[92vw] sm:!max-w-[420px] !p-0 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
              <Avatar className="w-10 h-10 ring-2 ring-[var(--ring)]">
                <AvatarImage src={DANIYA_AVATAR_SRC} alt={DANIYA_AVATAR_ALT} width={40} height={40} />
                <AvatarFallback className="bg-gradient-to-br from-pink-300 to-indigo-300 text-white text-xs">达</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <DialogTitle className="!mb-0 !text-base">达妮娅</DialogTitle>
                <p className="text-xs text-[var(--muted-foreground)]">需要登录才能聊天</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 w-8 h-8 rounded-md hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center gap-4 bg-[var(--card)]">
              <div className="text-5xl drop-shadow-sm">🔒</div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">需要先登录才能和达妮娅聊天哦</h3>
              <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
                粉丝站聊天功能仅供注册用户使用。<br />点右上角「登录/注册」胶囊，3 秒就能搞定 🫧
              </p>
              <Link href="/login"><Button>去登录</Button></Link>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
