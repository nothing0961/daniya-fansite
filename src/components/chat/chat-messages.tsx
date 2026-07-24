"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  aiAvatar: string;
  aiAvatarAlt: string;
  userAvatar?: string;
  userName?: string;
  isLoading: boolean;
}

export function ChatMessages({ messages, aiAvatar, aiAvatarAlt, userAvatar, userName, isLoading }: ChatMessagesProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4 bg-[radial-gradient(ellipse_at_top,rgba(236,72,153,0.06),transparent_60%)]"
    >
      {messages.length === 0 && !isLoading && (
        <div className="mx-auto max-w-[300px] mt-8 mb-4 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)]/80 text-sm text-[var(--muted-foreground)] text-center">
          💬 你好呀~ 说一句话和达妮娅打个招呼吧！
          <br />
          <span className="text-xs opacity-70">（现在是体验模式，回复为预设短消息）</span>
        </div>
      )}

      {messages.map((message) => {
        const isUser = message.role === "user";
        const isAI = message.role === "assistant";
        if (!isUser && !isAI) return null;

        return (
          <div
            key={message.id}
            className={cn(
              "flex items-end gap-3",
              isUser ? "flex-row-reverse" : "flex-row",
            )}
          >
            {isAI ? (
              <div className="shrink-0">
                <Avatar className="w-10 h-10 ring-1 ring-[var(--ring)]">
                  <AvatarImage src={aiAvatar} alt={aiAvatarAlt} width={40} height={40} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-300 to-indigo-300 text-white text-sm">
                    达
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div className="shrink-0">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={userAvatar ?? undefined} alt={userName ?? "你的头像"} width={40} height={40} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-300 to-emerald-300 text-white text-sm">
                    {(userName ?? "我").slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {isAI ? (
              <div
                className={cn(
                  "max-w-[80%] break-words",
                  "px-4 py-3 rounded-2xl rounded-bl-sm",
                  "mr-auto",
                  "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]",
                  "text-sm leading-relaxed shadow-sm",
                )}
              >
                {message.content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return (
                          <code
                            className={cn(
                              "rounded px-1.5 py-0.5 text-xs font-mono",
                              "bg-[var(--muted)] text-[var(--foreground)]",
                              match ? "bg-[var(--primary)]/10" : "",
                            )}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      pre({ children }) {
                        return (
                          <pre className="rounded-lg overflow-x-auto bg-[var(--muted)]/50 p-3 my-2 text-xs font-mono">
                            {children}
                          </pre>
                        );
                      },
                      p({ children }) {
                        return <p className="mb-2 last:mb-0">{children}</p>;
                      },
                      ul({ children }) {
                        return <ul className="list-disc list-inside mb-2">{children}</ul>;
                      },
                      ol({ children }) {
                        return <ol className="list-decimal list-inside mb-2">{children}</ol>;
                      },
                      li({ children }) {
                        return <li className="mb-1">{children}</li>;
                      },
                      strong({ children }) {
                        return <strong className="font-semibold text-[var(--primary)]">{children}</strong>;
                      },
                      a({ href, children }) {
                        return (
                          <a
                            href={href}
                            className="text-[var(--primary)] hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]">
                    <span className="inline-block w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" />
                    <span className="inline-block w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce [animation-delay:120ms]" />
                    <span className="inline-block w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce [animation-delay:240ms]" />
                  </span>
                )}
              </div>
            ) : (
              <div
                className={cn(
                  "max-w-[80%] break-words whitespace-pre-wrap",
                  "px-4 py-3 rounded-2xl rounded-br-sm",
                  "ml-auto",
                  "bg-gradient-to-br from-pink-400 via-fuchsia-400 to-indigo-400 text-white",
                  "text-sm leading-relaxed shadow-sm",
                )}
              >
                {message.content}
              </div>
            )}
          </div>
        );
      })}

      {isLoading && messages.length > 0 && (
        <div className="flex items-end gap-3">
          <div className="shrink-0">
            <Avatar className="w-10 h-10 ring-1 ring-[var(--ring)]">
              <AvatarImage src={aiAvatar} alt={aiAvatarAlt} width={40} height={40} />
              <AvatarFallback className="bg-gradient-to-br from-pink-300 to-indigo-300 text-white text-sm">
                达
              </AvatarFallback>
            </Avatar>
          </div>
          <div
            className={cn(
              "px-4 py-3 rounded-2xl rounded-bl-sm",
              "bg-[var(--card)] border border-[var(--border)]",
              "text-sm shadow-sm",
            )}
          >
            <span className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]">
              <span className="inline-block w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" />
              <span className="inline-block w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce [animation-delay:120ms]" />
              <span className="inline-block w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce [animation-delay:240ms]" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}