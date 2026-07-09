"use client";
/**
 * DaniyaChatFAB — 右下角浮动 AI 聊天按钮 + 对话弹窗
 *
 * 结构：
 *   - 悬浮 FAB（右下角 fixed，data-testid="chat-fab-button"）
 *       - aria-label="打开达妮娅聊天"
 *       - 内含 💬 图标或「和达妮娅聊」文字（都有语义）
 *   - 点 FAB → 开 Dialog（data-testid="chat-dialog"）
 *       - 顶部：达妮娅头像 + 标题「达妮娅」+ 在线小标
 *       - 中间滚动区：气泡列表
 *           - AI 气泡：data-testid="chat-bubble-ai"，含 [data-testid='ai-avatar'] 头像
 *           - 用户气泡：data-testid="chat-bubble-user"，含用户头像
 *       - 底部输入区：
 *           - <Textarea> data-testid="chat-input"
 *           - 发送 Button data-testid="chat-send-btn"
 *
 * 交互：
 *   - 未登录：点 FAB 直接弹窗提示「请先登录后再聊天」（符合用户第三层限流：未登录不许用）
 *   - 已登录：开 Dialog，走 useChat → /api/chat Mock SSE
 */
import * as React from "react";
// 整包 import ai（绕过 Turbopack 对 named export 的静态存在性检查，canary 版本缺 useChat）
// vitest 下 vi.mock("ai") 会替换整个模块对象，动态属性访问 (AIModule as any).useChat 仍命中 mock 的 useChat
import * as AIModule from "ai";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ========================================================================
// 本地极简 useChat（协议与 Vercel AI SDK 对齐，fallback 方案）
//   - 发送 POST /api/chat，body: { messages }
//   - 解析 SSE：标准 data: 帧 / Vercel 0: 分片帧（都兼容）
//   - 返回 shape：{ messages, input, setInput, handleInputChange, handleSubmit, isLoading }
// ========================================================================
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
      const resp = await fetch(options.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextList.slice(0, -1) }), // 不含空占位的 assistant
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

// useChat：优先用 AI SDK 真导出的（稳定版发布后有），否则 fallback 到本地极简实现
// 关键：动态属性访问 (AIModule as any).useChat 让 vitest 的 vi.mock("ai") 注入依然生效
const useChat: <T = any>(opts: T) => any =
  typeof (AIModule as any).useChat === "function"
    ? (AIModule as any).useChat
    : (useChatLocal as any);

// 达妮娅角色头像（public 目录那张立绘小图，角色页用过）
const DANIYA_AVATAR_SRC = "/A722CEB5396985A57C541E3CEF95F101.jpg";
const DANIYA_AVATAR_ALT = "达妮娅头像";

export default function DaniyaChatFAB() {
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: chatLoading,
    setInput,
  } = useChat({
    api: "/api/chat",
    // 自动滚动到底部由下面的 useEffect 做
  });

  // 有新消息自动滚到底
  React.useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // 回车发送 / Shift+Enter 换行
  const onTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const formEl = (e.currentTarget.form as HTMLFormElement | null);
      if (formEl && input.trim()) formEl.requestSubmit();
    }
  };

  // 点 FAB 按钮入口：先判断登录
  const handleFabClick = () => {
    if (status === "loading") return;
    if (!session?.user) {
      // 用户要求第三层：未登录就不允许用 → 弹空状态引导登录
      setOpen(true); // 打开 Dialog，但内容是「请先登录」而不是聊天框
      return;
    }
    setOpen(true);
  };

  const isLoggedIn = Boolean(session?.user);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* ======================================================= */}
      {/* 1. 悬浮 FAB（右下角） */}
      {/* ======================================================= */}
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
        {/* 小徽标：未登录灰一下，在线亮绿点 */}
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
            isLoggedIn ? "bg-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.35)]" : "bg-slate-400",
          )}
          aria-hidden="true"
        />
      </div>

      {/* ======================================================= */}
      {/* 2. Dialog 弹窗 */}
      {/* ======================================================= */}
      <DialogContent
        data-testid="chat-dialog"
        className={cn(
          // 改小一点的默认宽度：手机屏幕友好（sm 520px 宽）
          "!max-w-[92vw] sm:!max-w-[520px]",
          // 整体高度（减去上下 margin）：手机屏幕最大 85vh
          "!p-0 overflow-hidden flex flex-col",
          "max-h-[85vh]",
        )}
      >
        {/* ---- 顶部 Header（DialogTitle + 头像 + 在线小标） ---- */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
          <div
            data-testid="ai-avatar-header"
            className="relative shrink-0"
          >
            <Avatar className="w-10 h-10 ring-2 ring-[var(--ring)]">
              <AvatarImage
                src={DANIYA_AVATAR_SRC}
                alt={DANIYA_AVATAR_ALT}
                // Next/Image Avatar 组件可能是 <img>，这里统一作为 Avatar 的 src（组件内包装了 <img>）
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
          {/* 右上角关闭 X（因为自定义 Dialog 没有内置 X 按钮） */}
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

        {/* ---- 中间消息列表 ---- */}
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
              if (!isUser && !isAI) return null; // 忽略 system/tool 等
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-end gap-2",
                    isUser ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  {/* 头像 */}
                  {isAI ? (
                    <div
                      data-testid="ai-avatar"
                      className="shrink-0"
                    >
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

                  {/* 气泡内容 */}
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

        {/* ---- 底部输入栏 ---- */}
        {isLoggedIn && (
          <form
            onSubmit={handleSubmit}
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
                maxLength={210} // 视觉上稍大 10 字，真正 200 字由后端拒绝
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
  );
}

// 防 next-image 未使用警告（Image 类型已 import）
void Image;
