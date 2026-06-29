/**
 * PostCredit — 原作者出处标注组件
 * 本站最关键的组件之一：所有内容均为搬运，必须清晰标注原作者和来源
 *
 * variant="compact" — 卡片上的精简版（只显示作者和平台）
 * variant="full" — 详情页完整版（含原帖外链按钮）
 *
 * 修改方式：修改 PLATFORM_LABELS 映射或图标即可增删平台支持
 */
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

/** 来源平台中文显示名 */
const PLATFORM_LABELS: Record<string, string> = {
  weibo: "微博",
  pixiv: "Pixiv",
  twitter: "Twitter/X",
  lofter: "Lofter",
  bilibili: "B站",
  xiaohongshu: "小红书",
  other: "其他平台",
};

export interface PostCreditProps {
  creator: string;
  platform: string;
  url: string;
  variant?: "compact" | "full";
}

export function PostCredit({
  creator,
  platform,
  url,
  variant = "compact",
}: PostCreditProps) {
  const platformLabel = PLATFORM_LABELS[platform] || platform;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[var(--credit)]">
        {/* 链接图标 */}
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
          />
        </svg>
        <span>@{creator}</span>
        <span>·</span>
        <span>{platformLabel}</span>
      </div>
    );
  }

  // full 版本 — 详情页
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[var(--muted-foreground)]">原作者：</span>
        <Badge variant="credit">@{creator}</Badge>
        <span className="text-[var(--muted-foreground)]">·</span>
        <span className="text-[var(--foreground)]">{platformLabel}</span>
      </div>
      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-[var(--primary)] hover:underline sm:ml-auto inline-flex items-center gap-1"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
          />
        </svg>
        查看原帖
      </Link>
    </div>
  );
}
