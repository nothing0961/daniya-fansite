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

const FAB_BASE_CLASS = cn(
  "fixed z-50 bottom-6 right-6",
  "group cursor-pointer select-none",
  "w-14 h-14 rounded-full",
  "bg-gradient-to-br from-pink-400 via-fuchsia-400 to-indigo-400",
  "shadow-[0_8px_24px_-4px_rgba(236,72,153,0.55)]",
  "ring-1 ring-white/40",
  "flex items-center justify-center",
  "transition-all duration-300",
  "hover:scale-110 hover:shadow-[0_12px_32px_-6px_rgba(236,72,153,0.7)]",
  "active:scale-95",
  "backdrop-blur-sm",
);

function FabContent({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <>
      <span aria-hidden="true" className="text-2xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] group-hover:scale-110 transition-transform">
        💬
      </span>
      <span className={cn(
        "absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
        isLoggedIn ? "bg-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.35)]" : "bg-slate-400",
      )} aria-hidden="true" />
    </>
  );
}

export default function DaniyaChatFAB() {
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(false);
  const isLoggedIn = Boolean(session?.user);

  if (status === "loading") return null;

  return (
    <>
      {isLoggedIn ? (
        <Link href="/chat" data-testid="chat-fab-button" aria-label="打开达妮娅聊天" className={FAB_BASE_CLASS}>
          <FabContent isLoggedIn={true} />
        </Link>
      ) : (
        <button data-testid="chat-fab-button" aria-label="打开达妮娅聊天" onClick={() => setOpen(true)} className={FAB_BASE_CLASS}>
          <FabContent isLoggedIn={false} />
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
              <button type="button" onClick={() => setOpen(false)} className="shrink-0 w-8 h-8 rounded-md hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center justify-center">
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