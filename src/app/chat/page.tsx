"use client";
import * as React from "react";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatSettingsPanel } from "@/components/chat/chat-settings-panel";
import { loadCustomAiConfig } from "@/lib/custom-ai-config";

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
}

const DANIYA_AVATAR_SRC = "/A722CEB5396985A57C541E3CEF95F101.jpg";
const DANIYA_AVATAR_ALT = "达妮娅头像";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const isLoggedIn = Boolean(session?.user);

  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

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
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessages([]);
    setInput("");
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    const session = sessions.find(s => s.id === id);
    if (session) {
      setMessages([]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      role: "user",
      content: text,
    };
    const assistantId = `a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const assistantSeed: ChatMessage = { id: assistantId, role: "assistant", content: "" };

    const nextList = [...messages, userMsg, assistantSeed];
    setMessages(nextList);
    setInput("");
    setIsLoading(true);

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
      });
      if (!resp.ok) {
        let errText = "";
        try { errText = (await resp.json()).error ?? ""; } catch { /* noop */ }
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
            } else if (/^0:/.test(trimmed)) {
              const raw = trimmed.slice(2).trim();
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
      if (buffer.trim()) {
        const line = buffer.trim();
        if (line.startsWith("data:")) {
          const raw = line.slice(5).trim();
          if (raw && raw !== "[DONE]") {
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

      if (activeSessionId && acc) {
        setSessions(prev => prev.map(s =>
          s.id === activeSessionId
            ? { ...s, lastMessage: text, timestamp: new Date(), title: text.slice(0, 20) || "新会话" }
            : s
        ));
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m, i, arr) =>
          i === arr.length - 1 ? { ...m, content: `😢 出错啦：${err?.message ?? String(err)}` } : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen w-full">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
          <div className="relative">
            <img
              src={DANIYA_AVATAR_SRC}
              alt={DANIYA_AVATAR_ALT}
              className="w-10 h-10 rounded-full ring-2 ring-[var(--ring)] object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--card)] bg-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-[var(--foreground)]">达妮娅</h1>
            <p className="text-xs text-[var(--muted-foreground)]">在线 · 体验模式</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            aria-label="设置"
            className="shrink-0 w-8 h-8 rounded-md hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
        />

        <ChatInput
          input={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>

      {showSettings && (
        <ChatSettingsPanel
          onClose={() => setShowSettings(false)}
          sessionToken={getSessionToken()}
        />
      )}
    </div>
  );
}