/**
 * Sonner — Toast 通知组件
 * 用于显示操作成功/失败/警告等临时通知
 *
 * 用法：
 * 1. 在 layout.tsx 中挂载 <Toaster />
 * 2. 在任意组件中调用 toast.success("保存成功") / toast.error("保存失败")
 */
"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[var(--popover)] group-[.toaster]:text-[var(--popover-foreground)] group-[.toaster]:border-[var(--border)] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[var(--muted-foreground)]",
          actionButton:
            "group-[.toast]:bg-[var(--primary)] group-[.toast]:text-[var(--primary-foreground)]",
          cancelButton:
            "group-[.toast]:bg-[var(--muted)] group-[.toast]:text-[var(--muted-foreground)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
