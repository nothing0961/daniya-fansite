"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
}

export function ChatInput({ input, onChange, onSubmit, isLoading }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const formEl = e.currentTarget.form as HTMLFormElement | null;
      if (formEl && input.trim()) formEl.requestSubmit();
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="shrink-0 px-4 py-4 border-t border-[var(--border)] bg-[var(--card)]"
    >
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="和达妮娅说句话~（最多200字）"
            rows={1}
            maxLength={210}
            className={cn(
              "!resize-none min-h-[44px] max-h-36 !py-2.5",
              "rounded-xl border-[var(--border)]",
            )}
            disabled={isLoading}
          />
          <div className="absolute bottom-2 right-3 text-[10px] text-[var(--muted-foreground)]">
            {input.length}/200
          </div>
        </div>
        <Button
          type="submit"
          variant="default"
          size="icon"
          disabled={isLoading || !input.trim()}
          aria-label={isLoading ? "发送中" : "发送"}
          className={cn(
            "shrink-0 !w-11 !h-11",
            "bg-gradient-to-br from-pink-400 via-fuchsia-400 to-indigo-400",
            "hover:shadow-[0_4px_12px_rgba(236,72,153,0.4)]",
          )}
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
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </Button>
      </div>
      <div className="mt-2 text-[10px] text-[var(--muted-foreground)]">
        <span>Enter 发送 · Shift+Enter 换行</span>
      </div>
    </form>
  );
}