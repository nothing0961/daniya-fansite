/**
 * 作品类型枚举
 * illustration: 插画/单图
 * screenshot: 截屏/游戏/课堂截图
 * comic: 漫画/多图
 * video: 视频
 * article: 文章/同人文
 * cosplay: COS 正片
 * other: 其他类型
 */
const POST_TYPES = [
  "illustration",
  "screenshot",
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
  screenshot: "截屏",
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
const SOURCE_PLATFORMS = [
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

/**
 * 关联角色枚举（方案 A）
 *  - 与 prisma/schema.prisma enum Character 保持一致
 *  - 目前只有达妮娅，未来扩角色同步在 schema、这里和 Zod 里三处各加一个值
 */
export const CHARACTERS = ["DANIYA"] as const;
export type Character = (typeof CHARACTERS)[number];

/** 关联角色中文显示名（用于下拉 / 标签） */
export const CHARACTER_LABELS: Record<Character, string> = {
  DANIYA: "达妮娅",
};
