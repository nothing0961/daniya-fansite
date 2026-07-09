/**
 * Textarea — 多行输入框组件
 * 样式与 Input 保持一致（鸣潮主题配色），用于长文本（如聊天输入）。
 */
import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 3, ...props }, ref) => {
  return (
    <textarea
      rows={rows}
      className={cn(
        "flex w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm",
        "placeholder:text-[var(--muted-foreground)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-y", // 允许用户纵向拖拽调整高度
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
