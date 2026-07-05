"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui Popover — 基于 @radix-ui/react-popover
 * 用于音乐播放器迷你面板、用户自定义弹窗等气泡式交互。
 *
 * 用法：
 *   <Popover>
 *     <PopoverTrigger asChild><Button>点我</Button></PopoverTrigger>
 *     <PopoverContent>气泡内容</PopoverContent>
 *   </Popover>
 */

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "end", sideOffset = 8, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-80 rounded-xl border border-[var(--border)]",
        "bg-[var(--card)]/95 backdrop-blur-md p-4",
        "shadow-xl shadow-[var(--primary)]/10",
        // 弹出动画
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
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
