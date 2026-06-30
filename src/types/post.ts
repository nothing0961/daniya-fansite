/**
 * 作品类型枚举
 * illustration: 插画/单图
 * comic: 漫画/多图
 * video: 视频
 * article: 文章/同人文
 * cosplay: COS 正片
 * other: 其他类型
 */
export const POST_TYPES = [
  "illustration",
  "comic",
  "video",
  "article",
  "cosplay",
  "other",
] as const;
export type PostType = (typeof POST_TYPES)[number];

/** 作品类型中文显示名 */
export const POST_TYPE_LABELS: Record<PostType, string> = {
  illustration: "插画",
  comic: "漫画",
  video: "视频",
  article: "文章",
  cosplay: "COS",
  other: "其他",
};

/**
 * 来源平台枚举
 * 标注二创作品的原发布平台
 */
export const SOURCE_PLATFORMS = [
  "weibo",
  "pixiv",
  "twitter",
  "lofter",
  "bilibili",
  "xiaohongshu",
  "other",
] as const;
export type SourcePlatform = (typeof SOURCE_PLATFORMS)[number];

/** 来源平台中文显示名 */
export const PLATFORM_LABELS: Record<SourcePlatform, string> = {
  weibo: "微博",
  pixiv: "Pixiv",
  twitter: "Twitter/X",
  lofter: "Lofter",
  bilibili: "B站",
  xiaohongshu: "小红书",
  other: "其他",
};

/** 作品元数据 — 从 MDX frontmatter 解析得到 */
export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  type: PostType;
  originalCreator: string;
  sourceUrl: string;
  sourcePlatform: SourcePlatform;
  tags: string[];
  publishedAt: string;
  updatedAt?: string;
  draft: boolean;
  /** 作品配图列表（SM.MS 图床完整 URL） */
  images: string[];
  /** B站视频 BV 号（仅 video 类型，如 BV1xx411c7X） */
  videoId?: string;
}

/** 完整作品数据 — 元数据 + MDX 编译后的源码 */
export interface Post extends PostMeta {
  /** MDX 编译后的 JSX 源码（由 @next/mdx 的 compileMdx 生成） */
  code: string;
}
