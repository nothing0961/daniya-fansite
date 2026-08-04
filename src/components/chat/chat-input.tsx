"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
  onStop?: () => void;
}

export function ChatInput({ input, onChange, onSubmit, isLoading, onStop }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const formEl = e.currentTarget.form as HTMLFormElement | null;
      if (formEl && input.trim()) formEl.requestSubmit();
    }
  };

  const showStop = isLoading && Boolean(onStop);

  return (
    <form onSubmit={onSubmit} className="chat-input-wrap">
      <div className="chat-input-row">
        <div className="chat-input-field">
          <textarea
            value={input}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="和达妮娅说句话~（最多200字）"
            rows={1}
            maxLength={210}
            className={cn("chat-input-textarea")}
            disabled={isLoading}
          />
          <div className="chat-input-counter">
            {input.length}/200
          </div>
        </div>

        {showStop ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="停止生成"
            className={cn("chat-send-btn chat-send-btn--stop")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label={isLoading ? "发送中" : "发送"}
            className={cn("chat-send-btn chat-send-btn--send")}
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        )}
      </div>
      <div className="chat-input-hint">
        <span>Enter 发送 · Shift+Enter 换行</span>
      </div>
    </form>
  );
}
