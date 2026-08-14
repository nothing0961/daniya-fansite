"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onExportSession: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onOpenSettings,
  onDeleteSession,
  onRenameSession,
  onExportSession,
  open,
  onClose,
}: ChatSidebarProps) {
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  React.useEffect(() => {
    if (!menuOpenId) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpenId]);

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

  const startRename = (session: ChatSession) => {
    setRenamingId(session.id);
    setRenameValue(session.title);
    setMenuOpenId(null);
  };

  const confirmRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameSession(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const startDelete = (id: string) => {
    setConfirmDeleteId(id);
    setMenuOpenId(null);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      onDeleteSession(confirmDeleteId);
    }
    setConfirmDeleteId(null);
  };

  return (
    <aside className={cn("chat-sidebar", open && "chat-sidebar--open")}>
      {/* 头部 */}
      <div className="chat-sidebar-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h2 className="chat-sidebar-title">达妮娅聊天</h2>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <button
              type="button"
              onClick={onNewSession}
              className="chat-icon-btn"
              aria-label="新建会话"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="chat-icon-btn chat-sidebar-dismiss"
              aria-label="关闭侧边栏"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <Button
          onClick={onNewSession}
          className="w-full bg-gradient-to-r from-[var(--hp-pink)] to-[var(--hp-pink-deep)] text-[#1a0a14] hover:opacity-90"
        >
          新会话
        </Button>
      </div>

      {/* 会话列表 */}
      <div className="chat-sidebar-list">
        <ScrollArea className="h-full">
          {sessions.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "2rem 0",
                fontSize: "0.8rem",
                color: "var(--hp-ink-faint)",
              }}
            >
              暂无会话<br />点击上方开始新对话
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "chat-session-item-wrapper",
                    activeSessionId === session.id && "chat-session-item--active"
                  )}
                  style={{ position: "relative" }}
                >
                  {/* 重命名模式 */}
                  {renamingId === session.id ? (
                    <div style={{ padding: "0.75rem 0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmRename();
                          if (e.key === "Escape") cancelRename();
                        }}
                        autoFocus
                        className="chat-rename-input"
                        placeholder="输入新名称"
                      />
                      <div style={{ display: "flex", gap: "0.375rem" }}>
                        <button
                          type="button"
                          onClick={confirmRename}
                          className="chat-action-btn chat-action-btn--primary"
                        >
                          确认
                        </button>
                        <button
                          type="button"
                          onClick={cancelRename}
                          className="chat-action-btn"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onSelectSession(session.id)}
                        className="chat-session-item-inner"
                      >
                        <div className="chat-session-title">{session.title}</div>
                        <div className="chat-session-preview">{session.lastMessage || "暂无消息"}</div>
                        <div className="chat-session-time">{formatTime(session.timestamp)}</div>
                      </button>

                      {/* 操作菜单按钮（三点） */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === session.id ? null : session.id);
                        }}
                        className="chat-session-menu-btn"
                        aria-label="会话操作"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>

                      {/* 下拉操作菜单 */}
                      {menuOpenId === session.id && (
                        <div ref={menuRef} className="chat-session-menu">
                          <button
                            type="button"
                            onClick={() => startRename(session)}
                            className="chat-menu-item"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <span>重命名</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onExportSession(session.id);
                              setMenuOpenId(null);
                            }}
                            className="chat-menu-item"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>导出</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => startDelete(session.id)}
                            className="chat-menu-item chat-menu-item--danger"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            <span>删除</span>
                          </button>
                        </div>
                      )}

                      {/* 删除确认弹窗 */}
                      {confirmDeleteId === session.id && (
                        <div className="chat-confirm-overlay" onClick={() => setConfirmDeleteId(null)}>
                          <div className="chat-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                            <p className="chat-confirm-text">确定删除会话「{session.title}」吗？</p>
                            <p className="chat-confirm-subtext">删除后无法恢复</p>
                            <div className="chat-confirm-actions">
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="chat-action-btn"
                              >
                                取消
                              </button>
                              <button
                                type="button"
                                onClick={confirmDelete}
                                className="chat-action-btn chat-action-btn--danger"
                              >
                                确认删除
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* 底部状态 */}
      <div className="chat-sidebar-footer">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.75rem",
            fontFamily: '"Noto Serif SC", serif',
            color: "var(--hp-ink-soft)",
          }}
        >
          <span
            style={{
              width: "0.5rem",
              height: "0.5rem",
              borderRadius: "50%",
              background: "#8ac890",
              display: "inline-block",
            }}
          />
          <span>达妮娅在线</span>
        </div>
      </div>
    </aside>
  );
}
