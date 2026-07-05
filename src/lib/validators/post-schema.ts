/**
 * MDX Frontmatter 校验 Schema
 * 使用 Zod 定义作品元数据结构和验证规则
 *
 * 修改方式：
 * - 新增字段：在 schema 中添加新的 z.xxx() 定义
 * - 修改验证规则：调整 .min() / .max() / .optional() 等
 */
import { z } from "zod";

/** 作品类型枚举 */
const postTypeEnum = z.enum([
  "illustration",
  "screenshot",
  "comic",
  "video",
  "article",
  "cosplay",
  "other",
]);

/** 来源平台枚举 */
const sourcePlatformEnum = z.enum([
  "weibo",
  "pixiv",
  "twitter",
  "lofter",
  "bilibili",
  "xiaohongshu",
  "other",
]);

/** 关联角色枚举（MDX frontmatter / PendingPost.character 共用） */
const characterEnum = z.enum(["DANIYA"]);

/** MDX Frontmatter 校验规则 */
export const postMetaSchema = z.object({
  /** 作品标题 — 必填，1-120 字 */
  title: z.string().min(1, "标题不能为空").max(120, "标题不超过120字"),

  /** 作品简介 — 必填，1-300 字，在信息流卡片和 SEO 描述中使用 */
  description: z
    .string()
    .min(1, "简介不能为空")
    .max(300, "简介不超过300字"),

  /** 作品类型 */
  type: postTypeEnum,

  /** 关联角色（方案 A：可选；投稿默认 DANIYA），MDX frontmatter 中也允许填 character: DANIYA */
  character: characterEnum.optional(),

  /** 原作者昵称 — 必填，搬运作品必须标注原作者 */
  originalCreator: z.string().min(1, "必须标注原作者"),

  /** 原帖链接 — 必填 */
  sourceUrl: z.string().url("原帖链接格式不正确"),

  /** 来源平台 */
  sourcePlatform: sourcePlatformEnum,

  /** 标签 — 可选，最多 8 个 */
  tags: z.array(z.string().min(1)).max(8).optional().default([]),

  /** 发布日期 — ISO 日期字符串 */
  publishedAt: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "日期格式不正确，请使用 YYYY-MM-DD",
  }),

  /** 更新日期 — 可选 */
  updatedAt: z.string().optional(),

  /** 是否为草稿 — 草稿在生产环境不显示 */
  draft: z.boolean().optional().default(false),

  /** 配图列表 — SM.MS 图床完整 URL */
  images: z.array(z.string().url()).optional().default([]),

  /** B站视频 BV 号 — 仅 video 类型 */
  videoId: z.string().min(1).optional(),
});

/** 从 Frontmatter 解析出的元数据类型 */
export type PostMetaInput = z.infer<typeof postMetaSchema>;
