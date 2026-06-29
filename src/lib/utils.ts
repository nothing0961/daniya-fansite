import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn() — 合并 className 字符串，自动处理 Tailwind 类名冲突
 * shadcn/ui 标准工具函数，用于组件中动态拼接样式
 * 用法: cn("px-4", isActive && "bg-primary", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
