"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useChatDrawer } from "./chat-drawer-context";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { ChatSettingsPanel } from "./chat-settings-panel";
import { loadCustomAiConfig } from "@/lib/custom-ai-config";
import { loadKnowledgeDocs, buildKnowledgeContext } from "@/lib/knowledge-base";
import { planSessionImport, remapImported } from "@/lib/chat-session-sync";
import "@/app/chat/chat.css";

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  /** 滑窗摘要：窗口外早期对话的压缩内容（客户端持有，随请求注入） */
  summary?: string;
  /** 已纳入摘要的消息条数（用于增量摘要，避免重复压缩） */
  summaryCount?: number;
  /** 已导入 DB 的会话携带 dbId（登录合并后的导入标记） */
  dbId?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp?: Date;
}

const DANIYA_AVATAR_SRC = "/A722CEB5396985A57C541E3CEF95F101.jpg";
const DANIYA_AVATAR_ALT = "达妮娅头像";

/* 工具层导航：SSE tool_action 事件 → 站内页面 */
const CHAT_NAV_PATHS: Record<string, string> = {
  home: "/",
  works: "/works",
  character: "/character",
  search: "/search",
  submit: "/submit",
  favorites: "/dashboard/bookmarks",
  submissions: "/dashboard/submissions",
};

/* ==== 会话持久化（localStorage） ==== */
const SESSIONS_KEY = "daniya-chat-sessions";
const LAST_SESSION_KEY = "daniya-chat-last-session";
const messageKey = (id: string) => `daniya-chat-messages-${id}`;
const MAX_MESSAGES = 200;
/** 滑窗大小：只把最近 N 条消息发给模型，更早的由摘要覆盖 */
const WINDOW_SIZE = 30;

function parseSessions(raw: string | null): ChatSession[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<{
      id: string;
      title: string;
      lastMessage: string;
      timestamp: string;
    }>;
    return parsed
      .map((s) => ({ ...s, timestamp: new Date(s.timestamp) }))
      .filter((s) => !Number.isNaN(s.timestamp.getTime()));
  } catch {
    return [];
  }
}

function parseMessages(raw: string | null): ChatMessage[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed.map((m) =>
      m.timestamp ? { ...m, timestamp: new Date(m.timestamp) } : m,
    );
  } catch {
    return [];
  }
}

/* ==== 会话同步 API（登录用户 DB 持久化） ==== */

async function apiListSessions(): Promise<
  { id: string; title: string; summary?: string | null; summaryCount?: number; updatedAt: string }[]
> {
  const res = await fetch("/api/chat-sessions");
  if (!res.ok) throw new Error("list failed");
  const data = (await res.json()) as { sessions?: unknown };
  return Array.isArray(data?.sessions) ? (data.sessions as never[]) : [];
}

async function apiCreateSession(opts: {
  title?: string;
  summary?: string;
  summaryCount?: number;
}): Promise<string> {
  const res = await fetch("/api/chat-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: opts.title ?? "新会话",
      summary: opts.summary,
      summaryCount: opts.summaryCount,
    }),
  });
  if (!res.ok) throw new Error("create failed");
  const data = (await res.json()) as { session?: { id?: string } };
  const id = data?.session?.id;
  if (!id) throw new Error("create failed: no id");
  return id;
}

async function apiFetchMessages(id: string): Promise<ChatMessage[]> {
  const res = await fetch(`/api/chat-sessions/${id}`);
  if (!res.ok) throw new Error("fetch messages failed");
  const data = (await res.json()) as { messages?: unknown };
  if (!Array.isArray(data?.messages)) return [];
  return (data.messages as { id: string; role: ChatMessage["role"]; content: string; timestamp?: string }[])
    .map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
    }));
}

async function apiReplaceMessages(id: string, msgs: ChatMessage[]) {
  const res = await fetch(`/api/chat-sessions/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: msgs.map((m) => ({ id: m.id, role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error("replace messages failed");
}

async function apiPatchSession(
  id: string,
  patch: { title?: string; summary?: string; summaryCount?: number },
) {
  const res = await fetch(`/api/chat-sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("patch failed");
}

async function apiDeleteSession(id: string) {
  const res = await fetch(`/api/chat-sessions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("delete failed");
}

export function GlobalChatDrawer() {
  const { open, closeDrawer } = useChatDrawer();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  /** 工具层状态提示：模型调用站内工具时显示（如"正在调用站内工具…"） */
  const [toolStatus, setToolStatus] = React.useState<string | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showSidebar, setShowSidebar] = React.useState(false);
  const [showChat, setShowChat] = React.useState(false);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const messagesRef = React.useRef<ChatMessage[]>([]);
  React.useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const activeIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    activeIdRef.current = activeSessionId;
  }, [activeSessionId]);

  /* sessionToken 仅在客户端读取 cookie，挂载后再计算，避免 SSR 访问 document */
  const [sessionToken, setSessionToken] = React.useState("dev-token");
  React.useEffect(() => {
    setSessionToken(getSessionToken());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  /* 打开飞讯时恢复会话：
   * - 游客：纯 localStorage（现状）
   * - 登录：本地会话导入 DB（本地副本保留 + dbId 导入标记），此后 DB 为唯一事实来源
   */
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const restoreLocal = () => {
      const restored = parseSessions(localStorage.getItem(SESSIONS_KEY));
      setSessions(restored);
      const lastId = localStorage.getItem(LAST_SESSION_KEY);
      const targetId =
        lastId && restored.some((s) => s.id === lastId)
          ? lastId
          : (restored[0]?.id ?? null);
      setActiveSessionId(targetId);
      setMessages(targetId ? parseMessages(localStorage.getItem(messageKey(targetId))) : []);
      setShowChat(true);
    };
    if (status !== "authenticated") {
      restoreLocal();
      return;
    }

    setShowChat(true);
    (async () => {
      try {
        const local = parseSessions(localStorage.getItem(SESSIONS_KEY));
        const db = await apiListSessions();
        const { toImport } = planSessionImport(local, db);
        // 导入本地会话：逐个建 DB 会话 + 整表落消息 + 迁移缓存键
        const idMap: Record<string, string> = {};
        for (const ls of toImport) {
          try {
            const dbId = await apiCreateSession({
              title: ls.title,
              summary: ls.summary,
              summaryCount: ls.summaryCount,
            });
            idMap[ls.id] = dbId;
            const msgs = parseMessages(localStorage.getItem(messageKey(ls.id)));
            await apiReplaceMessages(dbId, msgs);
            try {
              localStorage.setItem(
                messageKey(dbId),
                JSON.stringify(
                  msgs.map((m) =>
                    m.timestamp ? { ...m, timestamp: m.timestamp.toISOString() } : m,
                  ),
                ),
              );
              localStorage.removeItem(messageKey(ls.id));
            } catch { /* noop */ }
          } catch { /* 单个导入失败：保留本地副本，下次打开重试 */ }
        }
        const { list: marked } = remapImported(local, idMap);
        persistSessions(marked);
        const lastRaw = localStorage.getItem(LAST_SESSION_KEY);
        if (lastRaw && idMap[lastRaw]) persistLastSession(idMap[lastRaw]);
        const finalDb = await apiListSessions();
        const { merged } = planSessionImport(marked, finalDb);
        if (cancelled) return;
        setSessions(merged as ChatSession[]);
        const lastId = localStorage.getItem(LAST_SESSION_KEY);
        const targetId =
          lastId && merged.some((s) => s.id === lastId)
            ? lastId
            : (merged[0]?.id ?? null);
        setActiveSessionId(targetId);
        let msgs: ChatMessage[] = [];
        try {
          msgs = targetId ? await apiFetchMessages(targetId) : [];
        } catch { /* API 失败走缓存 */ }
        if (!cancelled) {
          setMessages(
            msgs.length > 0 || !targetId
              ? msgs
              : parseMessages(localStorage.getItem(messageKey(targetId))),
          );
        }
      } catch {
        if (!cancelled) restoreLocal(); // API 整体失败 → 回退本地缓存
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, status]);

  const persistSessions = React.useCallback((list: ChatSession[]) => {
    try {
      localStorage.setItem(
        SESSIONS_KEY,
        JSON.stringify(list.map((s) => ({ ...s, timestamp: s.timestamp.toISOString() }))),
      );
    } catch { /* localStorage 不可用或超限时静默 */ }
  }, []);

  const persistMessages = React.useCallback((id: string, list: ChatMessage[]) => {
    try {
      localStorage.setItem(
        messageKey(id),
        JSON.stringify(
          list
            .slice(-MAX_MESSAGES)
            .map((m) => (m.timestamp ? { ...m, timestamp: m.timestamp.toISOString() } : m)),
        ),
      );
    } catch { /* noop */ }
  }, []);

  const persistLastSession = React.useCallback((id: string | null) => {
    try {
      if (id) localStorage.setItem(LAST_SESSION_KEY, id);
      else localStorage.removeItem(LAST_SESSION_KEY);
    } catch { /* noop */ }
  }, []);

  /** 切走当前会话前，把内存中的消息先落盘 */
  const flushCurrentMessages = React.useCallback(() => {
    if (activeSessionId) persistMessages(activeSessionId, messagesRef.current);
  }, [activeSessionId, persistMessages]);

  const getSessionToken = () =>
    (document.cookie.match(/authjs\.session-token=([^;]+)/)?.[1]) ??
    session?.user?.id ??
    "dev-token";

  const handleNewSession = async () => {
    flushCurrentMessages();
    let newId = `session_${Date.now()}`;
    if (status === "authenticated") {
      try {
        newId = await apiCreateSession({ title: "新会话" });
      } catch { /* 建 DB 失败 → 仍走本地（下次打开会再导入） */ }
    }
    const newSession: ChatSession = {
      id: newId,
      title: "新会话",
      lastMessage: "",
      timestamp: new Date(),
      dbId: status === "authenticated" ? newId : undefined,
    };
    const next = [newSession, ...sessions];
    setSessions(next);
    persistSessions(next);
    setActiveSessionId(newId);
    setMessages([]);
    setInput("");
    persistLastSession(newId);
    setShowSidebar(false);
    setShowChat(true);
  };

  const handleSelectSession = (id: string) => {
    flushCurrentMessages();
    setActiveSessionId(id);
    // 先用本地缓存立即展示，登录态再以 DB 为准刷新
    setMessages(parseMessages(localStorage.getItem(messageKey(id))));
    persistLastSession(id);
    setShowSidebar(false);
    setShowChat(true);
    if (status === "authenticated") {
      apiFetchMessages(id)
        .then((dbMsgs) => {
          if (activeIdRef.current === id && dbMsgs.length > 0) setMessages(dbMsgs);
        })
        .catch(() => { /* 网络失败保持缓存 */ });
    }
  };

  const handleDeleteSession = (id: string) => {
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    persistSessions(next);
    try {
      localStorage.removeItem(messageKey(id));
    } catch { /* noop */ }
    if (status === "authenticated") {
      void apiDeleteSession(id).catch(() => { /* 404/网络失败：本地已删，DB 清理下轮重试 */ });
    }
    if (activeSessionId === id) {
      const nextActive = next[0]?.id ?? null;
      setActiveSessionId(nextActive);
      setMessages(nextActive ? parseMessages(localStorage.getItem(messageKey(nextActive))) : []);
      persistLastSession(nextActive);
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    const next = sessions.map((s) =>
      s.id === id ? { ...s, title: newTitle } : s,
    );
    setSessions(next);
    persistSessions(next);
    if (status === "authenticated") {
      void apiPatchSession(id, { title: newTitle }).catch(() => {});
    }
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

  /** 消息超窗后异步触发摘要压缩：已有摘要 + 新溢出消息 → 新摘要（失败静默，下轮重试） */
  const triggerSummarize = React.useCallback(
    async (list: ChatMessage[]) => {
      if (!activeSessionId || list.length <= WINDOW_SIZE) return;
      const overflowEnd = list.length - WINDOW_SIZE;
      const cur = sessions.find((s) => s.id === activeSessionId);
      const summaryCount = cur?.summaryCount ?? 0;
      if (overflowEnd <= summaryCount) return;
      const overflow = list.slice(summaryCount, overflowEnd);
      if (overflow.length === 0) return;
      try {
        const sessionToken = getSessionToken();
        const customCfg = await loadCustomAiConfig(sessionToken);
        const resp = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "summarize",
            messages: overflow,
            summary: cur?.summary ?? undefined,
            customAiConfig: customCfg ?? undefined,
          }),
        });
        if (!resp.ok) return;
        const data = (await resp.json()) as { summary?: string };
        if (typeof data?.summary === "string" && data.summary) {
          const next = sessions.map((s) =>
            s.id === activeSessionId
              ? { ...s, summary: data.summary, summaryCount: overflowEnd }
              : s,
          );
          setSessions(next);
          persistSessions(next);
          if (status === "authenticated" && activeSessionId) {
            void apiPatchSession(activeSessionId, {
              summary: data.summary,
              summaryCount: overflowEnd,
            }).catch(() => {});
          }
        }
      } catch {
        /* 摘要失败静默：保留消息与计数，下次溢出再试 */
      }
    },
    [activeSessionId, sessions, status, persistSessions],
  );

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
    messagesRef.current = nextList;
    setInput("");
    setToolStatus(null);
    setIsLoading(true);
    if (activeSessionId) persistMessages(activeSessionId, nextList);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const sessionToken = getSessionToken();
      const customCfg = await loadCustomAiConfig(sessionToken);
      // 知识库检索（同步、毫秒级）：总开关开启时自动带相关片段
      const knowledgeContext = buildKnowledgeContext(text, loadKnowledgeDocs());
      // 滑窗摘要：窗口外早期对话的压缩内容，作为背景注入
      const activeSummary = sessions.find((s) => s.id === activeSessionId)?.summary;
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextList.slice(0, -1).slice(-WINDOW_SIZE),
          customAiConfig: customCfg ?? undefined,
          knowledgeContext: knowledgeContext ?? undefined,
          summary: activeSummary ?? undefined,
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
        setMessages((prev) => {
          const next = prev.map((m, i, arr) =>
            i === arr.length - 1 ? { ...m, content: acc } : m,
          );
          messagesRef.current = next;
          return next;
        });
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
              const p = piece as any;
              // 工具层事件：tool_action 导航（router.push）/ tool_status 状态提示
              if (p?.tool_action?.action === "navigate" && typeof p.tool_action.page === "string") {
                const path = CHAT_NAV_PATHS[p.tool_action.page];
                if (path) router.push(path);
                continue;
              }
              if (typeof p?.tool_status === "string") {
                setToolStatus(p.tool_status);
                continue;
              }
              if (typeof piece === "string") flushAppend(piece);
              else if (piece && typeof (piece as any).content === "string") flushAppend((piece as any).content);
              else if (piece && Array.isArray((piece as any).choices) && (piece as any).choices[0]?.delta?.content) {
                flushAppend((piece as any).choices[0].delta.content);
              }
            }
          }
        }
      }

      let syncTitle: string | undefined;
      if (activeSessionId && acc) {
        const next = sessions.map((s) =>
          s.id === activeSessionId
            ? { ...s, lastMessage: text, timestamp: new Date(), title: text.slice(0, 20) || "新会话" }
            : s,
        );
        setSessions(next);
        persistSessions(next);
        syncTitle = next.find((s) => s.id === activeSessionId)?.title;
      }
      if (activeSessionId) persistMessages(activeSessionId, messagesRef.current);
      // 登录态：整表同步消息到 DB（失败静默，下次切换/下条消息再同步）
      if (status === "authenticated" && activeSessionId) {
        const syncId = activeSessionId;
        void (async () => {
          try {
            await apiReplaceMessages(syncId, messagesRef.current);
            if (syncTitle) await apiPatchSession(syncId, { title: syncTitle });
          } catch { /* noop */ }
        })();
      }
      // 回复完成后检查是否超窗 → 异步触发摘要压缩（不阻塞 UI）
      void triggerSummarize(messagesRef.current);
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
      setToolStatus(null);
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

  return (
    <div className="chat-root fixed inset-0 z-[60]">
      {/* 遮罩层 + 模糊效果 — 仅在终端打开时渲染，否则会吞掉页面所有点击 */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-drawer-overlay"
            onClick={handleOverlayClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-terminal"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.99 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            {/* 终端状态栏：✦ 飞讯 · 在线（呼吸点） + 设置 + 关闭 */}
            <div className="chat-terminal-statusbar">
              <span className="chat-terminal-brand" aria-hidden="true">
                ✦
              </span>
              <span className="chat-terminal-title">飞讯</span>
              <span className="chat-terminal-signal" aria-hidden="true" />
              <span className="chat-terminal-online">在线</span>
              <div className="ml-auto flex items-center gap-0.5">
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
                  aria-label="关闭飞讯"
                  className="chat-icon-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 终端主体：左会话列表 + 右聊天区 */}
            <div className="chat-terminal-body">
              {/* 左侧：会话列表（桌面常驻，窄屏推入） */}
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

              {/* 右侧：聊天区（窄屏为推入页面） */}
              <div
                className={cn("chat-main-drawer", showChat && "chat-main-drawer--open")}
              >
                <div className="chat-topbar">
                  <button
                    onClick={() => setShowSidebar(true)}
                    aria-label="打开会话列表"
                    className="chat-icon-btn chat-topbar-menu"
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
                      className="shadow-[0_0_0_2px_rgba(231,155,190,0.4)]"
                    />
                    <span className="chat-topbar-status" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="chat-topbar-name">达妮娅</h1>
                    <p className="chat-topbar-sub">在线</p>
                  </div>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeSessionId ?? "empty"}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="flex-1 min-h-0 flex flex-col"
                  >
                    <ChatMessages
                      messages={messages}
                      aiAvatar={DANIYA_AVATAR_SRC}
                      aiAvatarAlt={DANIYA_AVATAR_ALT}
                      userAvatar={session?.user?.image ?? undefined}
                      userName={session?.user?.name ?? undefined}
                      isLoading={isLoading}
                    />
                  </motion.div>
                </AnimatePresence>

                {toolStatus && (
                  <div className="px-3 pb-1 text-[11px] text-[var(--hp-pink)] opacity-80">
                    ✦ {toolStatus}
                  </div>
                )}
                <ChatInput
                  input={input}
                  onChange={(e) => setInput(e.target.value)}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  onStop={handleStop}
                />
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* 设置面板（终端之上） */}
      <ChatSettingsPanel
        onClose={() => setShowSettings(false)}
        sessionToken={sessionToken}
        open={showSettings}
      />
    </div>
  );
}
