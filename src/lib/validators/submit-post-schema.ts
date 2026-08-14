/**
 * 用户投稿提交校验 Schema
 *  - 字段限制与站长 postMetaSchema **对齐**（否则审核时会被 postMetaSchema 打回）：
 *    · title 1-120 字 / description 1-300 字 / tags 最多 8 个
 *  - 放宽项（审核时站长补全）：
 *    · originalCreator / sourcePlatform / sourceUrl 均 optional
 *  - 独有项：
 *    · 必须至少 1 张图片（slug 由服务端自动生成）
 *  - 注意：body (MDX 正文) 不在 schema 中，由 API 路由从 rawBody 手动取出
 */
import { z } from "zod";

export const submitPostSchema = z
  .object({
    // —— 以下限制与 postMetaSchema 完全一致，确保审核通过不反悔 ——
    title: z.string().min(1, "标题不能为空").max(120, "标题不超过 120 字"),
    description: z
      .string()
      .min(1, "简介不能为空")
      .max(300, "简介不超过 300 字"),
    type: z.enum(["illustration", "screenshot"]),
    /** 关联角色（方案 A：可选；前端默认 DANIYA），目前枚举同 prisma Character */
    character: z.enum(["DANIYA"]).optional(),
    tags: z
      .array(z.string().min(1).max(20))
      .max(8, "标签最多 8 个")
      .default([]),
    images: z.array(z.string().url("images 中每项必须是合法 URL")).max(20, "图片最多 20 张").default([]),

    // —— 投稿时可空缺，审核时站长补全（postMetaSchema 要求这些字段必填）——
    originalCreator: z.string().min(1, "作者昵称至少 1 个字符").max(60).optional(),
    sourcePlatform: z.string().min(1).max(60).optional(),
    sourceUrl: z.string().url("来源链接必须是合法 URL").optional(),
  })
  .superRefine((val, ctx) => {
    // 所有类型都必须至少 1 张图片
    if (val.images.length === 0) {
      const typeLabel = val.type === "illustration" ? "插画" : "截图";
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${typeLabel} 类型至少上传 1 张图片`,
        path: ["images"],
      });
    }
  });

export type SubmitPostInput = z.infer<typeof submitPostSchema>;
