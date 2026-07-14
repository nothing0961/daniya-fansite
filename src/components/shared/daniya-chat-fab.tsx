"use client";
import * as React from "react";
import * as AIModule from "ai";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  saveCustomAiConfig,
  loadCustomAiConfig,
  deleteCustomAiConfig,
} from "@/lib/custom-ai-config";

type ChatMessage = { id: string; role: "user" | "assistant" | "system" | "tool"; content: string };
function useChatLocal(options: { api: string; initialMessages?: ChatMessage[] }) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(options.initialMessages ?? []);
  const [input, setInput] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setInput(e.target.value);
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
      const sessionToken =
        (document.cookie.match(/authjs\.session-token=([^;]+)/)?.[1]) ??
        (options as any).session?.user?.id ??
        "dev-token";
      const customCfg = await loadCustomAiConfig(sessionToken);
      const resp = await fetch(options.api, {
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
            } else if (/^0:/.test(trimmed)) {
              const raw = trimmed.slice(2).trim();
              let piece: unknown = raw;
              try { piece = JSON.parse(raw); } catch { /* noop */ }
              if (typeof piece === "string") flushAppend(piece);
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
          }
        }
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

  return { messages, input, setInput, handleInputChange, handleSubmit, isLoading };
}

const useChat: <T = any>(opts: T) => any =
  typeof (AIModule as any).useChat === "function"
    ? (AIModule as any).useChat
    : (useChatLocal as any);

const DANIYA_AVATAR_SRC = "/A722CEB5396985A57C541E3CEF95F101.jpg";
const DANIYA_AVATAR_ALT = "达妮娅头像";

let _cacheBaseURL = "";
let _cacheModel = "";
let _cacheApiKey = "";

export default function DaniyaChatFAB() {
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsErrorMsg, setSettingsErrorMsg] = React.useState("");
  const [baseURL, setBaseURL] = React.useState("");
  const [displayKey, setDisplayKey] = React.useState("");
  const [realApiKey, setRealApiKey] = React.useState("");
  const realKeyRef = React.useRef("");
  const [model, setModel] = React.useState("");
  const [apiKeyPlaceholder, setApiKeyPlaceholder] = React.useState("sk-...");

  const baseUrlValueRef = React.useRef("");
  const modelValueRef = React.useRef("");
  const settingsOpenSeqRef = React.useRef(0);
  const userEditedRef = React.useRef(false);
  const settingsManualCloseRef = React.useRef(false);

  const baseUrlRef = React.useRef<HTMLInputElement>(null);
  const apiKeyElRef = React.useRef<HTMLInputElement>(null);
  const modelElRef = React.useRef<HTMLInputElement>(null);
  const [clearTick, setClearTick] = React.useState(0);

  const syncRealKey = (v: string) => {
    realKeyRef.current = v;
    setRealApiKey(v);
  };

  const [connectionOk, setConnectionOk] = React.useState(false);
  const [protocolHintOpen, setProtocolHintOpen] = React.useState(false);
  const [protocolHint, setProtocolHint] = React.useState<{
    protocol: string;
    hint?: string;
    docs?: string;
  }>({ protocol: "" });

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading: chatLoading,
    setInput,
  } = useChat({
    api: "/api/chat",
    session,
  });

  const isLoggedIn = Boolean(session?.user);

  const getSessionToken = () =>
    (document.cookie.match(/authjs\.session-token=([^;]+)/)?.[1]) ??
    session?.user?.id ??
    "dev-token";

  const sessionUserId = session?.user?.id;

  React.useEffect(() => {
    (async () => {
      if (!settingsOpen) return;
      const mySeq = ++settingsOpenSeqRef.current;
      userEditedRef.current = false;
      setConnectionOk(prev => prev ? false : prev);
      setProtocolHintOpen(prev => prev ? false : prev);
      setProtocolHint(prev => (prev.protocol === "" && !prev.hint && !prev.docs) ? prev : { protocol: "" });
      try {
        const cfg = await loadCustomAiConfig(getSessionToken());
        if (settingsOpenSeqRef.current !== mySeq) return;
        if (userEditedRef.current) return;
        if (cfg) {
          setBaseURL(prev => prev === cfg.baseURL ? prev : cfg.baseURL);
          baseUrlValueRef.current = cfg.baseURL;
          syncRealKey(cfg.apiKey);
          let newDisplay: string;
          if (cfg.apiKey.length >= 8) {
            const s = cfg.apiKey;
            newDisplay = s.slice(0, 3) + "*".repeat(Math.max(0, s.length - 8)) + s.slice(-3);
          } else {
            newDisplay = cfg.apiKey;
          }
          setDisplayKey(prev => prev === newDisplay ? prev : newDisplay);
          setModel(prev => prev === cfg.model ? prev : cfg.model);
          modelValueRef.current = cfg.model;
        } else {
          setBaseURL(prev => prev === "" ? prev : "");
          baseUrlValueRef.current = "";
          setDisplayKey(prev => prev === "" ? prev : "");
          syncRealKey("");
          setModel(prev => prev === "" ? prev : "");
          modelValueRef.current = "";
        }
      } catch { /* noop */ }
    })();
  }, [settingsOpen, sessionUserId]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    userEditedRef.current = true;
    _cacheApiKey = e.target.value;
    syncRealKey(e.target.value);
    setDisplayKey(e.target.value);
  };

  const handleApiKeyBlur = () => {
    const s = realKeyRef.current;
    if (s.length >= 8) {
      setDisplayKey(s.slice(0, 3) + "*".repeat(Math.max(0, s.length - 8)) + s.slice(-3));
    } else {
      setDisplayKey(s);
    }
    setApiKeyPlaceholder("sk-...");
  };

  const handleApiKeyFocus = () => {
    userEditedRef.current = true;
    setDisplayKey("");
    setApiKeyPlaceholder("如需修改请重新输入完整 Key");
  };

  const handleClearConfig = () => {
    try {
      deleteCustomAiConfig();
    } catch { /* noop */ }
    syncRealKey("");
    _cacheApiKey = "";
    _cacheBaseURL = "";
    _cacheModel = "";
    baseUrlValueRef.current = "";
    modelValueRef.current = "";
    userEditedRef.current = false;
    setConnectionOk(false);
    setProtocolHintOpen(false);
    setProtocolHint({ protocol: "" });
    if (baseUrlRef.current) baseUrlRef.current.value = "";
    if (apiKeyElRef.current) apiKeyElRef.current.value = "";
    if (modelElRef.current) modelElRef.current.value = "";
    setClearTick((t) => t + 1);
    setBaseURL("");
    setDisplayKey("");
    setModel("");
  };

  const handleTestConnection = async () => {
    if (baseUrlRef.current?.value) { baseUrlValueRef.current = baseUrlRef.current.value; _cacheBaseURL = baseUrlRef.current.value; }
    if (modelElRef.current?.value) { modelValueRef.current = modelElRef.current.value; _cacheModel = modelElRef.current.value; }
    if (apiKeyElRef.current?.value && !apiKeyElRef.current.value.includes("*")) {
      _cacheApiKey = apiKeyElRef.current.value;
      syncRealKey(apiKeyElRef.current.value);
    }
    settingsManualCloseRef.current = false;
    const effectiveBaseURL = baseUrlValueRef.current || baseURL || _cacheBaseURL;
    const effectiveModel = modelValueRef.current || model || _cacheModel;
    const apiKeyToUse = realKeyRef.current || realApiKey || _cacheApiKey;
    setConnectionOk(false);
    setProtocolHintOpen(false);
    setProtocolHint({ protocol: "", hint: undefined, docs: undefined });
    try {
      const testUrl = effectiveBaseURL || "https://api.example.com/v1/chat/completions";
      const fullUrl = testUrl.endsWith("/chat/completions") ? testUrl : testUrl.replace(/\/?$/, "/chat/completions");
      const resp = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKeyToUse ? `Bearer ${apiKeyToUse}` : "",
        },
        body: JSON.stringify({
          model: effectiveModel || "test-model",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
        }),
      });
      let data: any = null;
      try { data = await resp.json(); } catch { /* noop */ }

      if (resp.ok && data && data.object === "chat.completion" && Array.isArray(data.choices)) {
        setConnectionOk(true);
        setProtocolHintOpen(false);
        return;
      }

      let proto = "";
      let hintText = "";
      let docsText: string | undefined;

      if (!resp.ok) {
        const status = resp.status;
        const errMsg = data?.error?.message ?? "";
        if (status === 401 || /invalid.*key|api.*key.*invalid|unauthorized/i.test(errMsg)) {
          proto = "invalid_key";
          hintText = "你的 API Key 无效，请检查后重试。";
        }
      }

      if (!proto && data) {
        if (typeof data.type === "string" && Array.isArray(data.content)) {
          proto = "claude";
          hintText = "Claude 官方地址不是 OpenAI 兼容格式，请更换兼容地址。";
          docsText = "使用 OpenRouter / 硅基流动 等兼容代理（查看 anthropic.com 官方文档）";
        } else if (Array.isArray(data.candidates)) {
          proto = "gemini";
          hintText = "Gemini API 不是 OpenAI 兼容协议，请使用兼容代理。";
        }
      }

      if (!proto && !resp.ok) {
        hintText = hintText || `连接失败：HTTP ${resp.status}`;
      }

      const finalProto = proto || (effectiveBaseURL.includes("anthropic") ? "claude" : effectiveBaseURL.includes("generativelanguage") ? "gemini" : "unknown");
      setProtocolHint({ protocol: finalProto, hint: hintText, docs: docsText });
      setProtocolHintOpen(true);
    } catch (err) {
      const isLocal = /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(effectiveBaseURL);
      if (isLocal) {
        setProtocolHint({
          protocol: "ollama-local",
          hint: "Vercel 连不上本地 Ollama，建议使用 cloudflared / 内网穿透 / frp / ngrok 隧道穿透暴露本地服务。",
        });
      } else {
        setProtocolHint({
          protocol: "network",
          hint: "网络连接失败，请检查地址或稍后重试。",
        });
      }
      setProtocolHintOpen(true);
    }
  };

  const handleSaveConfig = async () => {
    try {
      if (baseUrlRef.current?.value) { baseUrlValueRef.current = baseUrlRef.current.value; _cacheBaseURL = baseUrlRef.current.value; }
      if (modelElRef.current?.value) { modelValueRef.current = modelElRef.current.value; _cacheModel = modelElRef.current.value; }
      if (apiKeyElRef.current?.value && !apiKeyElRef.current.value.includes("*")) {
        _cacheApiKey = apiKeyElRef.current.value;
        syncRealKey(apiKeyElRef.current.value);
      }
      const baseURLFinal = (baseUrlValueRef.current || baseURL || (baseUrlRef.current?.value ?? "") || _cacheBaseURL).trim();
      const apiKeyFinal = (realKeyRef.current || realApiKey || (apiKeyElRef.current?.value?.includes("*") ? "" : (apiKeyElRef.current?.value ?? "")) || _cacheApiKey).trim();
      const modelFinal = (modelValueRef.current || model || (modelElRef.current?.value ?? "") || _cacheModel).trim();

      // 前置校验：三字段必填 + baseURL 必须 http(s):// 开头
      if (!baseURLFinal || !apiKeyFinal || !modelFinal) {
        setSettingsErrorMsg("必填项不完整：请填写 API 地址、API Key、模型名（三字段均为必填）");
        return;
      }
      if (!/^https?:\/\//i.test(baseURLFinal)) {
        setSettingsErrorMsg("API 地址格式错误：baseURL 必须以 http:// 或 https:// 开头");
        return;
      }

      setSettingsErrorMsg("");
      const cfg = { baseURL: baseURLFinal, apiKey: apiKeyFinal, model: modelFinal };
      settingsManualCloseRef.current = true;
      await saveCustomAiConfig(getSessionToken(), cfg);
      setConnectionOk(false);
      setProtocolHintOpen(false);
      setProtocolHint({ protocol: "" });
      setSettingsOpen(false);
    } catch { /* noop */ }
  };

  React.useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const onTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const formEl = (e.currentTarget.form as HTMLFormElement | null);
      if (formEl && input.trim()) formEl.requestSubmit();
    }
  };

  const handleFabClick = () => {
    if (status === "loading") return;
    setOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <div
          data-testid="chat-fab-button"
          role="button"
          tabIndex={0}
          aria-label="打开达妮娅聊天"
          className={cn(
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
          )}
          onClick={handleFabClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleFabClick();
          }}
        >
          <span
            aria-hidden="true"
            className="text-2xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] group-hover:scale-110 transition-transform"
          >
            💬
          </span>
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
              isLoggedIn ? "bg-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.35)]" : "bg-slate-400",
            )}
            aria-hidden="true"
          />
        </div>

        <DialogContent
          data-testid="chat-dialog"
          className={cn(
            "!max-w-[92vw] sm:!max-w-[520px]",
            "!p-0 overflow-hidden flex flex-col",
            "max-h-[85vh]",
          )}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
            <div data-testid="ai-avatar-header" className="relative shrink-0">
              <Avatar className="w-10 h-10 ring-2 ring-[var(--ring)]">
                <AvatarImage
                  src={DANIYA_AVATAR_SRC}
                  alt={DANIYA_AVATAR_ALT}
                  width={40}
                  height={40}
                />
                <AvatarFallback className="bg-gradient-to-br from-pink-300 to-indigo-300 text-white text-xs">
                  达
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--card)]",
                  isLoggedIn ? "bg-emerald-400" : "bg-slate-400",
                )}
                aria-hidden="true"
              />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="!mb-0 !text-base flex items-center gap-1.5">
                <span>达妮娅</span>
                {!isLoggedIn ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 font-normal">
                    未登录不可用
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-normal">
                    🟢 在线 · 体验模式
                  </span>
                )}
              </DialogTitle>
              <p className="text-xs text-[var(--muted-foreground)] truncate">
                {isLoggedIn
                  ? "一句话说明白，越短越好~ 🫧"
                  : "请先登录后再和达妮娅聊天（点顶部头像注册/登录）"}
              </p>
            </div>
            {isLoggedIn && (
              <button
                type="button"
                aria-label="聊天设置"
                data-testid="chat-settings-gear"
                onClick={() => {
                  settingsManualCloseRef.current = false;
                  setSettingsOpen(true);
                }}
                className="shrink-0 w-8 h-8 rounded-md hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center justify-center"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              aria-label="关闭对话"
              onClick={() => setOpen(false)}
              className="shrink-0 w-8 h-8 rounded-md hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center justify-center"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {!isLoggedIn ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center gap-3 bg-[var(--card)]">
              <div className="text-5xl drop-shadow-sm" aria-hidden="true">
                🔒
              </div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                需要先登录才能和达妮娅聊天哦
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
                粉丝站聊天功能仅供注册用户使用。
                <br />
                点右上角「登录/注册」胶囊，3 秒就能搞定 🫧
              </p>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-[radial-gradient(ellipse_at_top,rgba(236,72,153,0.06),transparent_60%)]"
            >
              {messages.length === 0 && (
                <div
                  className="mx-auto max-w-[260px] mt-4 mb-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]/80 text-xs text-[var(--muted-foreground)] text-center"
                  role="status"
                  aria-label="聊天引导"
                >
                  💬 你好呀~ 说一句话和达妮娅打个招呼吧！
                  <br />
                  （现在是体验模式，回复为预设短消息）
                </div>
              )}
              {messages.map((m: { id: string; role: string; content: string }) => {
                const isUser = m.role === "user";
                const isAI = m.role === "assistant";
                if (!isUser && !isAI) return null;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex items-end gap-2",
                      isUser ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    {isAI ? (
                      <div data-testid="ai-avatar" className="shrink-0">
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={DANIYA_AVATAR_SRC}
                            alt={DANIYA_AVATAR_ALT}
                            width={32}
                            height={32}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-pink-300 to-indigo-300 text-white text-[11px]">
                            达
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ) : (
                      <div data-testid="user-avatar" className="shrink-0">
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={session?.user?.image ?? undefined}
                            alt={session?.user?.name ?? "你的头像"}
                            width={32}
                            height={32}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-300 to-emerald-300 text-white text-[11px]">
                            {(session?.user?.name ?? "我").slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    {isAI ? (
                      <div
                        data-testid="chat-bubble-ai"
                        className={cn(
                          "max-w-[78%] break-words whitespace-pre-wrap",
                          "px-3.5 py-2 rounded-2xl rounded-bl-sm",
                          "mr-auto",
                          "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]",
                          "text-sm leading-relaxed shadow-sm",
                        )}
                      >
                        {m.content || (
                          <span className="inline-flex items-center gap-1 text-[var(--muted-foreground)]">
                            <span className="inline-block w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full animate-bounce" />
                            <span className="inline-block w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full animate-bounce [animation-delay:120ms]" />
                            <span className="inline-block w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full animate-bounce [animation-delay:240ms]" />
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        data-testid="chat-bubble-user"
                        className={cn(
                          "max-w-[78%] break-words whitespace-pre-wrap",
                          "px-3.5 py-2 rounded-2xl rounded-br-sm",
                          "ml-auto",
                          "bg-gradient-to-br from-pink-400 via-fuchsia-400 to-indigo-400 text-white",
                          "text-sm leading-relaxed shadow-sm",
                        )}
                      >
                        {m.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isLoggedIn && (
            <form
              onSubmit={originalHandleSubmit}
              className="shrink-0 px-3 py-3 border-t border-[var(--border)] bg-[var(--card)]"
            >
              <div className="flex items-end gap-2">
                <Textarea
                  data-testid="chat-input"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={onTextareaKeyDown}
                  placeholder="和达妮娅说句话~（最多200字）"
                  rows={1}
                  maxLength={210}
                  className="!resize-none min-h-[40px] max-h-32 !py-2"
                  disabled={chatLoading}
                />
                <Button
                  type="submit"
                  data-testid="chat-send-btn"
                  variant="default"
                  size="icon"
                  disabled={chatLoading || !input.trim()}
                  aria-label={chatLoading ? "发送中" : "发送"}
                  className="shrink-0 !w-10 !h-10"
                >
                  {chatLoading ? (
                    <span
                      className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </Button>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--muted-foreground)] px-1">
                <span>Enter 发送 · Shift+Enter 换行</span>
                <span>
                  {input.length}
                  <span className="opacity-60">/200</span>
                </span>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {settingsOpen && (
        <div
          data-testid="ai-settings-dialog"
          role="dialog"
          className="fixed inset-0 z-[110] flex items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSettingsOpen(false)}
          />
          <div
            className="relative z-10 w-[92vw] sm:w-[520px] max-h-[85vh] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold">自定义模型设置</h2>
            <p className="sr-only">配置自定义 AI 模型的 API 地址、API Key 和模型名</p>
            {settingsErrorMsg && (
              <div
                data-testid="ai-settings-error"
                role="alert"
                className="mt-2 px-3 py-2 text-sm rounded border bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60"
              >
                {settingsErrorMsg}
              </div>
            )}

            <div className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="ai-base-url-input" className="text-sm font-medium text-[var(--foreground)]">
                  API 地址
                </label>
                <Input
                  id="ai-base-url-input"
                  data-testid="ai-base-url-input"
                  placeholder="https://api.deepseek.com/v1"
                  value={baseURL}
                  key={`base-${clearTick}`}
                  ref={baseUrlRef}
                  onChange={(e) => {
                    userEditedRef.current = true;
                    _cacheBaseURL = e.target.value;
                    baseUrlValueRef.current = e.target.value;
                    setBaseURL(e.target.value);
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="ai-api-key-input" className="text-sm font-medium text-[var(--foreground)]">
                  API Key
                </label>
                <Input
                  id="ai-api-key-input"
                  data-testid="ai-api-key-input"
                  type="text"
                  placeholder={apiKeyPlaceholder}
                  value={displayKey}
                  key={`key-${clearTick}`}
                  ref={apiKeyElRef}
                  onChange={handleApiKeyChange}
                  onBlur={handleApiKeyBlur}
                  onFocus={handleApiKeyFocus}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="ai-model-input" className="text-sm font-medium text-[var(--foreground)]">
                  模型名
                </label>
                <Input
                  id="ai-model-input"
                  data-testid="ai-model-input"
                  placeholder="deepseek-v4-flash / glm-4.7-flash / ..."
                  value={model}
                  key={`model-${clearTick}`}
                  ref={modelElRef}
                  onChange={(e) => {
                    userEditedRef.current = true;
                    _cacheModel = e.target.value;
                    modelValueRef.current = e.target.value;
                    setModel(e.target.value);
                  }}
                />
              </div>

              {connectionOk && (
                <div
                  data-testid="ai-connection-ok"
                  className="px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm"
                >
                  ✅ 连接测试成功！模型兼容 OpenAI 协议。
                </div>
              )}

              {protocolHintOpen && (
                <div
                  data-testid="ai-protocol-hint-dialog"
                  className="px-3 py-3 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 text-sm space-y-2"
                >
                  <div className="font-semibold mb-1">⚠️ 连接提示</div>
                  {protocolHint.hint && <div>{protocolHint.hint}</div>}
                  {protocolHint.docs && (
                    <div>
                      {protocolHint.docs.includes("http") ? (
                        <a
                          href={protocolHint.docs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-600 dark:text-blue-400"
                        >
                          {protocolHint.docs}
                        </a>
                      ) : (
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {protocolHint.docs}
                          {protocolHint.protocol === "claude" && (
                            <>
                              {" "}参考：
                              <a
                                href="https://anthropic.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                anthropic.com
                              </a>
                              {" · OpenRouter · 硅基流动"}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {protocolHint.protocol === "claude" && !protocolHint.docs && (
                    <div className="text-xs text-[var(--muted-foreground)]">
                      参考：
                      <a
                        href="https://anthropic.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        anthropic.com
                      </a>
                      {" · OpenRouter · 硅基流动"}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                data-testid="ai-clear-config-btn"
                variant="destructive"
                onClick={handleClearConfig}
              >
                删除配置
              </Button>
              <Button
                type="button"
                data-testid="ai-test-connection-btn"
                variant="secondary"
                onClick={handleTestConnection}
              >
                连接测试
              </Button>
              <Button
                type="button"
                data-testid="ai-save-config-btn"
                variant="default"
                onClick={handleSaveConfig}
              >
                保存并启用
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
