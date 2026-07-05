/**
 * 评论内容 Zod 校验
 *
 * 与自建评论系统 Comment 模型的 content 字段对齐：
 *  - trim 去前后空白
 *  - 1 ～ 1000 字
 */
import { z } from "zod";

export const commentSchema = z.object({
  content: z
    .string({
      message: "评论内容必须是字符串",
    })
    .trim()
    .min(1, "评论内容至少 1 个字符")
    .max(1000, "评论内容最多 1000 字"),
});

type CommentSchemaInput = z.infer<typeof commentSchema>;
