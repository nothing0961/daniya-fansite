/**
 * works-constants — 作品集常量（客户端可安全导入）
 * Tab 定义、排序选项等纯数据常量
 */

export const WORKS_TABS = [
  { key: "all", label: "全部", type: undefined as string | undefined },
  { key: "illustration", label: "插画", type: "illustration" },
  { key: "comic", label: "漫画", type: "comic" },
  { key: "video", label: "视频", type: "video" },
  { key: "article", label: "文章", type: "article" },
  { key: "cosplay", label: "COS", type: "cosplay" },
  { key: "screenshot", label: "截图", type: "screenshot" },
] as const;

export type WorksTabKey = (typeof WORKS_TABS)[number]["key"];

export const WORKS_SORTS = [
  { key: "latest", label: "最新上传" },
  { key: "popular", label: "最多点击" },
  { key: "oldest", label: "最早发布" },
] as const;

export type WorksSortKey = (typeof WORKS_SORTS)[number]["key"];

export const POST_TYPE_LABELS: Record<string, string> = {
  illustration: "插画",
  comic: "漫画",
  video: "视频",
  article: "文章",
  cosplay: "COS",
  screenshot: "截图",
  other: "其他",
};
