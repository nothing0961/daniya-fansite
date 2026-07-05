import { describe, it, expect } from "vitest";
import { commentSchema } from "../src/lib/validators/comment-schema";

/**
 * 自建评论系统 — Zod 校验需求：
 *  - content: 非空字符串（trim 后至少 1 字），最长 1000 字
 *      · trim：用户只打空格 / 换行应判为空
 *      · 边界：1 字通过，1000 字通过，1001 字失败
 */

describe("自建评论 commentSchema", () => {
  it("正常中文评论 1-1000 字应通过", () => {
    expect(commentSchema.safeParse({ content: "好可爱！" }).success).toBe(true);
    expect(commentSchema.safeParse({ content: "X" }).success).toBe(true); // 1 字
    expect(commentSchema.safeParse({ content: "你".repeat(1000) }).success).toBe(true); // 1000 字边界
  });

  it("空内容、纯空白、超长 1001 字应失败", () => {
    // 空串
    expect(commentSchema.safeParse({ content: "" }).success).toBe(false);
    // 纯空格 / Tab / 换行（trim 后仍为空）
    expect(commentSchema.safeParse({ content: "   " }).success).toBe(false);
    expect(commentSchema.safeParse({ content: "\n\t\n" }).success).toBe(false);
    // 超长
    expect(commentSchema.safeParse({ content: "好".repeat(1001) }).success).toBe(false);
  });

  it("trim 生效：前后空格会被去掉，trim 后 1 字仍通过", () => {
    const res = commentSchema.safeParse({ content: "   好   " });
    expect(res.success).toBe(true);
    // Zod 会把 transform 后的值带出来；如果用 refine 则保持原值，这里我们用 .trim()
    if (res.success) {
      expect(res.data.content).toBe("好");
    }
  });

  it("非字符串 content 应失败（数组 / 数字 / undefined / null）", () => {
    expect(commentSchema.safeParse({ content: undefined }).success).toBe(false);
    expect(commentSchema.safeParse({ content: null }).success).toBe(false);
    expect(commentSchema.safeParse({ content: 123 }).success).toBe(false);
    expect(commentSchema.safeParse({ content: ["x", "y"] }).success).toBe(false);
  });
});
