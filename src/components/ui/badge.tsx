/**
 * Badge — 标签/徽章组件
 * variant: default / secondary / outline / credit(出处标注专用暖金色)
 *
 * 修改方式：在 badgeVariants 中添加新的 variant 样式
 */
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants: Record<string, string> = {
  default: "bg-[var(--primary)] text-[var(--primary-foreground)]",
  secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
  outline: "border border-[var(--border)] text-[var(--foreground)]",
  // 出处标注专用 — 暖金色，突出原作者信息
  credit: "bg-[var(--credit)] text-[var(--credit-foreground)]",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
