"use client";

import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui HoverCard — 基于 @radix-ui/react-hover-card
 * 用于音乐播放器悬停下拉面板、提示卡片等「鼠标悬停显示内容」的交互。
 * 原生支持 openDelay / closeDelay，完美处理 trigger↔content 间隙防闪断。
 * 触屏无 hover 时，会自动 fallback 为「点击一次打开/再次点击收起」。
 *
 * 用法：
 *   <HoverCard openDelay={80} closeDelay={200}>
 *     <HoverCardTrigger asChild><Button>悬停我</Button></HoverCardTrigger>
 *     <HoverCardContent>悬浮卡片内容</HoverCardContent>
 *   </HoverCard>
 */

const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "end", sideOffset = 8, ...props }, ref) => (
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-80 rounded-xl border border-[var(--border)]",
        "bg-[var(--card)]/95 backdrop-blur-md p-4",
        "shadow-xl shadow-[var(--primary)]/10",
        // 弹出/收起动画（和 PopoverContent 保持一致风格）
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
        "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
        // 避免 Outline 聚焦环（内部按钮已有 focus 样式）
        "outline-none",
        className,
      )}
      {...props}
    />
  </HoverCardPrimitive.Portal>
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };
