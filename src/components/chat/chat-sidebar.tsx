"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onOpenSettings: () => void;
}

export function ChatSidebar({ sessions, activeSessionId, onSelectSession, onNewSession, onOpenSettings }: ChatSidebarProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  return (
    <aside className="w-72 shrink-0 border-r border-[var(--border)] bg-[var(--background)] flex flex-col">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[var(--foreground)]">达妮娅聊天</h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewSession}
              className="h-8 w-8"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              className="h-8 w-8"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Button>
          </div>
        </div>
        <Button onClick={onNewSession} className="w-full">
          新会话
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">
              暂无会话<br />点击上方开始新对话
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    activeSessionId === session.id
                      ? "bg-[var(--primary)]/20 text-[var(--foreground)] border border-[var(--primary)]/30"
                      : "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
                  )}
                >
                  <div className="font-medium text-sm truncate mb-1">{session.title}</div>
                  <div className="text-xs truncate mb-1 opacity-70">{session.lastMessage}</div>
                  <div className="text-xs opacity-50">{formatTime(session.timestamp)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>达妮娅在线 · 体验模式</span>
        </div>
      </div>
    </aside>
  );
}