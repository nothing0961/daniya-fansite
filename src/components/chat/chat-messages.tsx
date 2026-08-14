"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 将时间格式化为 HH:MM
function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  /** 消息时间戳，可选；存在时在消息底部显示 HH:MM */
  timestamp?: Date;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  aiAvatar: string;
  aiAvatarAlt: string;
  userAvatar?: string;
  userName?: string;
  isLoading: boolean;
  onRegenerate?: () => void;
}

export function ChatMessages({
  messages,
  aiAvatar,
  aiAvatarAlt,
  userAvatar,
  userName,
  isLoading,
  onRegenerate,
}: ChatMessagesProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  // 记录当前"已复制"的消息 id，用于按钮文字临时切换为"已复制"
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // 查找最后一条 AI 消息的 id，用于在其底部显示"重新生成"按钮
  let lastAssistantId: string | undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      lastAssistantId = messages[i].id;
      break;
    }
  }

  // 复制消息内容到剪贴板，并在 2 秒内将按钮文字切换为"已复制"
  const handleCopy = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((cur) => (cur === id ? null : cur));
      }, 2000);
    } catch {
      // 剪贴板不可用时静默失败
    }
  };

  // 三点加载动画
  const renderTyping = () => (
    <span className="chat-typing">
      <span className="chat-typing-dot" />
      <span className="chat-typing-dot" />
      <span className="chat-typing-dot" />
    </span>
  );

  // 用户头像：有图片时显示图片，否则回退为首字母
  const renderUserAvatar = () => {
    if (userAvatar) {
      return (
        <div className="chat-avatar">
          <img src={userAvatar} alt={userName ?? "你的头像"} />
        </div>
      );
    }
    return (
      <div
        className="chat-avatar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(231,155,190,0.15)",
          color: "var(--hp-pink)",
        }}
      >
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "0.9rem" }}>
          {(userName ?? "我").slice(0, 1)}
        </span>
      </div>
    );
  };

  return (
    <div ref={scrollRef} className="chat-messages">
      {/* 消息列表 */}
      {messages.map((message) => {
        const isUser = message.role === "user";
        const isAI = message.role === "assistant";
        if (!isUser && !isAI) return null;

        const hasContent = Boolean(message.content);
        const isLastAssistant = isAI && message.id === lastAssistantId;

        return (
          <div
            key={message.id}
            className={cn("chat-message-row", isUser && "chat-message-row--user")}
          >
            {/* 头像 */}
            {isAI ? (
              <div className="chat-avatar chat-avatar--ai">
                <img src={aiAvatar} alt={aiAvatarAlt} />
              </div>
            ) : (
              renderUserAvatar()
            )}

            {/* 气泡 */}
            {isAI ? (
              <div className="chat-bubble-ai">
                {hasContent ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, children, ...props }) {
                        return (
                          <code
                            {...props}
                            className="rounded px-1.5 py-0.5 text-xs font-mono bg-[rgba(231,155,190,0.1)] text-[var(--hp-pink)]"
                          >
                            {children}
                          </code>
                        );
                      },
                      pre({ children }) {
                        return (
                          <pre className="rounded-lg overflow-x-auto bg-[rgba(15,6,16,0.6)] p-3 my-2 text-xs font-mono border border-[rgba(231,155,190,0.1)]">
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
                        return <strong className="font-semibold text-[var(--hp-pink)]">{children}</strong>;
                      },
                      a({ href, children }) {
                        return (
                          <a
                            href={href}
                            className="text-[var(--hp-pink)] hover:underline"
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
                  renderTyping()
                )}

                {/* AI 消息底部操作栏：时间 + 复制 + 重新生成（hover 显示） */}
                {hasContent && (
                  <div className="chat-message-footer">
                    {message.timestamp && (
                      <span className="chat-message-time">{formatTime(message.timestamp)}</span>
                    )}
                    <button
                      type="button"
                      className="chat-message-action"
                      onClick={() => handleCopy(message.id, message.content)}
                    >
                      {copiedId === message.id ? "已复制" : "复制"}
                    </button>
                    {isLastAssistant && !isLoading && onRegenerate && (
                      <button type="button" className="chat-message-action" onClick={onRegenerate}>
                        重新生成
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="chat-bubble-user">
                {message.content}
                {/* 用户消息底部：时间（hover 显示） */}
                {hasContent && message.timestamp && (
                  <div className="chat-message-footer">
                    <span className="chat-message-time">{formatTime(message.timestamp)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* 加载指示器：已有消息时显示三点动画 */}
      {isLoading && messages.length > 0 && (
        <div className="chat-message-row">
          <div className="chat-avatar chat-avatar--ai">
            <img src={aiAvatar} alt={aiAvatarAlt} />
          </div>
          <div className="chat-bubble-ai">{renderTyping()}</div>
        </div>
      )}
    </div>
  );
}
