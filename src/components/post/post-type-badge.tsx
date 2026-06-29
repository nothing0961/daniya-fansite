/**
 * PostTypeBadge — 作品类型徽章
 * 不同作品类型显示不同颜色和图标
 *
 * 修改方式：修改 typeConfig 可改变每种类型的颜色/图标/文字
 */
import { Badge } from "@/components/ui/badge";

/** 类型配置 — 每种类型的颜色、显示名 */
const typeConfig: Record<string, { label: string; variant: "default" | "secondary" | "credit" | "outline" }> = {
  illustration: { label: "插画", variant: "default" },
  comic: { label: "漫画", variant: "secondary" },
  video: { label: "视频", variant: "default" },
  article: { label: "文章", variant: "outline" },
  cosplay: { label: "COS", variant: "credit" },
  other: { label: "其他", variant: "outline" },
};

interface PostTypeBadgeProps {
  type: string;
}

export function PostTypeBadge({ type }: PostTypeBadgeProps) {
  const config = typeConfig[type] || typeConfig.other;

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
