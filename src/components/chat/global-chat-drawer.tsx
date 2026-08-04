"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useChatDrawer } from "./chat-drawer-context";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { ChatSettingsPanel } from "./chat-settings-panel";
import { loadCustomAiConfig } from "@/lib/custom-ai-config";
import "@/app/chat/chat.css";

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp?: Date;
}

const DANIYA_AVATAR_SRC = "/A722CEB5396985A57C541E3CEF95F101.jpg";
const DANIYA_AVATAR_ALT = "达妮娅头像";

export function GlobalChatDrawer() {
  const { open, closeDrawer } = useChatDrawer();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showSidebar, setShowSidebar] = React.useState(false);
  const [showChat, setShowChat] = React.useState(false);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    if (open && status === "authenticated") {
      setShowChat(true);
    }
  }, [open, status]);

  const getSessionToken = () =>
    (document.cookie.match(/authjs\.session-token=([^;]+)/)?.[1]) ??
    session?.user?.id ??
    "dev-token";

  const handleNewSession = () => {
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "新会话",
      lastMessage: "",
      timestamp: new Date(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessages([]);
    setInput("");
    setShowSidebar(false);
    setShowChat(true);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    const found = sessions.find((s) => s.id === id);
    if (found) {
      setMessages([]);
    }
    setShowSidebar(false);
    setShowChat(true);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s)),
    );
  };

  const handleExportSession = (id: string) => {
    const found = sessions.find((s) => s.id === id);
    if (!found) return;

    const now = new Date();
    const lines: string[] = [
      "================================",
      "  达妮娅聊天 · 会话导出",
      "================================",
      "",
      `会话名称：${found.title}`,
      `导出时间：${now.toLocaleString("zh-CN")}`,
      `消息数量：${messages.length}`,
      "",
      "--------------------------------",
      "",
    ];

    for (const msg of messages) {
      const roleLabel = msg.role === "user" ? "我" : msg.role === "assistant" ? "达妮娅" : msg.role;
      const time = msg.timestamp ? msg.timestamp.toLocaleString("zh-CN") : "未知时间";
      lines.push(`【${roleLabel}】 ${time}`);
      lines.push(msg.content || "(空消息)");
      lines.push("");
    }

    lines.push("================================");
    lines.push("  — 导出结束 —");
    lines.push("================================");

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `达妮娅聊天_${found.title}_${now.toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    const assistantId = `a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const assistantSeed: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    const nextList = [...messages, userMsg, assistantSeed];
    setMessages(nextList);
    setInput("");
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const sessionToken = getSessionToken();
      const customCfg = await loadCustomAiConfig(sessionToken);
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextList.slice(0, -1),
          customAiConfig: customCfg ?? undefined,
        }),
        signal: controller.signal,
      });
      if (!resp.ok) {
        let errText = "";
        try {
          errText = (await resp.json()).error ?? "";
        } catch { /* noop */ }
        throw new Error(errText || `请求失败：${resp.status}`);
      }
      if (!resp.body) throw new Error("流式响应缺失 body");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let acc = "";
      const flushAppend = (delta: string) => {
        if (!delta) return;
        acc += delta;
        setMessages((prev) =>
          prev.map((m, i, arr) => (i === arr.length - 1 ? { ...m, content: acc } : m)),
        );
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          for (const line of frame.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed.startsWith("data:")) {
              const raw = trimmed.slice(5).trim();
              if (!raw || raw === "[DONE]") continue;
              let piece: unknown = raw;
              try { piece = JSON.parse(raw); } catch { /* noop */ }
              if (typeof piece === "string") flushAppend(piece);
              else if (piece && typeof (piece as any).content === "string") flushAppend((piece as any).content);
              else if (piece && Array.isArray((piece as any).choices) && (piece as any).choices[0]?.delta?.content) {
                flushAppend((piece as any).choices[0].delta.content);
              }
            }
          }
        }
      }

      if (activeSessionId && acc) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, lastMessage: text, timestamp: new Date(), title: text.slice(0, 20) || "新会话" }
              : s,
          ),
        );
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last.role === "assistant" && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } else {
        setMessages((prev) =>
          prev.map((m, i, arr) =>
            i === arr.length - 1 ? { ...m, content: `😢 出错啦：${err?.message ?? String(err)}` } : m,
          ),
        );
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleOverlayClick = () => {
    setShowSidebar(false);
    setShowSettings(false);
    setShowChat(false);
    closeDrawer();
  };

  // 未登录时跳转登录页
  if (open && status === "authenticated" && !session?.user) {
    router.push("/login");
    return null;
  }

  if (!open) return null;

  return (
    <div className="chat-root fixed inset-0 z-[60]">
      {/* 遮罩层 + 模糊效果 */}
      <div
        className="chat-drawer-overlay"
        onClick={handleOverlayClick}
      />

      {/* 左侧抽屉：会话列表 */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onOpenSettings={() => {
          setShowSettings(true);
          setShowSidebar(false);
        }}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onExportSession={handleExportSession}
        open={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      {/* 右侧抽屉：主聊天区 */}
      <div className={cn("chat-main-drawer", showChat && "chat-main-drawer--open")}>
        <div className="chat-topbar">
          <button
            onClick={() => setShowSidebar(true)}
            aria-label="打开会话列表"
            className="chat-icon-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="chat-topbar-avatar">
            <img
              src={DANIYA_AVATAR_SRC}
              alt={DANIYA_AVATAR_ALT}
              className="shadow-[0_0_0_2px_rgba(201,169,110,0.4)]"
            />
            <span className="chat-topbar-status" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="chat-topbar-name">达妮娅</h1>
            <p className="chat-topbar-sub">在线</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            aria-label="设置"
            className="chat-icon-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            onClick={handleOverlayClick}
            aria-label="关闭聊天"
            className="chat-icon-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <ChatMessages
          messages={messages}
          aiAvatar={DANIYA_AVATAR_SRC}
          aiAvatarAlt={DANIYA_AVATAR_ALT}
          userAvatar={session?.user?.image ?? undefined}
          userName={session?.user?.name ?? undefined}
          isLoading={isLoading}
          onSuggestion={(text) => {
            setInput(text);
            setTimeout(() => handleSubmit(), 0);
          }}
        />

        <ChatInput
          input={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onStop={handleStop}
        />
      </div>

      {/* 设置面板 */}
      <ChatSettingsPanel
        onClose={() => setShowSettings(false)}
        sessionToken={getSessionToken()}
        open={showSettings}
      />
    </div>
  );
}
