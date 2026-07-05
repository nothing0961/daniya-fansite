/**
 * 用户投稿提交校验 Schema
 *  - 字段限制与站长 postMetaSchema **对齐**（否则审核时会被 postMetaSchema 打回）：
 *    · title 1-120 字 / description 1-300 字 / tags 最多 8 个
 *  - 放宽项（审核时站长补全）：
 *    · originalCreator / sourcePlatform / sourceUrl 均 optional
 *  - 独有项：
 *    · slug 可选（自动生成）
 *    · videoId 仅 video 类型强制，且非 video 类型必须至少 1 张图
 *  - 注意：body (MDX 正文) 不在 schema 中，由 API 路由从 rawBody 手动取出
 */
import { z } from "zod";

const BV_REGEX = /^BV[a-zA-Z0-9]{10}$/;
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/; // 3-60 kebab-case 首尾非连字符

export const submitPostSchema = z
  .object({
    // —— 以下限制与 postMetaSchema 完全一致，确保审核通过不反悔 ——
    title: z.string().min(1, "标题不能为空").max(120, "标题不超过 120 字"),
    description: z
      .string()
      .min(1, "简介不能为空")
      .max(300, "简介不超过 300 字"),
    type: z.enum(["illustration", "screenshot", "video"]),
    /** 关联角色（方案 A：可选；前端默认 DANIYA），目前枚举同 prisma Character */
    character: z.enum(["DANIYA"]).optional(),
    tags: z
      .array(z.string().min(1).max(20))
      .max(8, "标签最多 8 个")
      .default([]),
    images: z.array(z.string().url("images 中每项必须是合法 URL")).max(20, "图片最多 20 张"),
    videoId: z
      .string()
      .regex(BV_REGEX, "BV 号格式不正确（必须以 BV 开头 + 10 位字母数字）")
      .optional(),

    // —— 投稿时可空缺，审核时站长补全（postMetaSchema 要求这些字段必填）——
    originalCreator: z.string().min(1, "作者昵称至少 1 个字符").max(60).optional(),
    sourcePlatform: z.string().min(1).max(60).optional(),
    sourceUrl: z.string().url("来源链接必须是合法 URL").optional(),

    // —— 自定义 slug（可选）——
    slug: z
      .string()
      .regex(SLUG_REGEX, "slug 只能包含小写字母、数字和连接符（3-60 字符，首尾不能是 -）")
      .optional(),
  })
  .superRefine((val, ctx) => {
    // video 类型必须带 videoId
    if (val.type === "video" && !val.videoId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "视频类型作品必须填写 BV 号",
        path: ["videoId"],
      });
    }
    // 非 video 类型：至少 1 张图片
    if (val.type !== "video" && val.images.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${
          val.type === "illustration" ? "插画" : val.type === "screenshot" ? "截图" : ""
        } 类型至少上传 1 张图片`,
        path: ["images"],
      });
    }
  });

export type SubmitPostInput = z.infer<typeof submitPostSchema>;
