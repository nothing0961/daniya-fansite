import { describe, it, expect } from "vitest";
import { submitPostSchema } from "../src/lib/validators/submit-post-schema";

/**
 * 用户投稿 zod 校验需求（与站长 postMetaSchema 对齐，避免审核通过失败）：
 *  - title: 非空字符串，长度 1-120
 *  - description: 非空字符串，长度 1-300
 *  - type: "illustration" | "screenshot"
 *  - tags: 字符串数组，每个 tag 长度 1-20，最多 8 个
 *  - images: 字符串数组（URL），至少 1 张，最多 20 张
 *  - originalCreator / sourceUrl / sourcePlatform: 可选（审核时站长补全）
 *      · originalCreator / sourcePlatform: 填写则 1-60 字符
 *      · sourceUrl: 填写则必须合法 URL
 *  - slug: 可选，若填写则必须符合 kebab-case（3-60 字符）
 */

describe("投稿 submitPostSchema - 基础字段", () => {
  const baseGood = {
    title: "达妮娅的下午茶会",
    description: "在学院后花园里偶遇达妮娅，她正端着一杯奶茶打瞌睡……",
    type: "illustration",
    tags: ["达妮娅", "日常"],
    images: ["https://imgurl.org/i/abc.jpg"],
  };

  it("合法基础投稿应通过", () => {
    const res = submitPostSchema.safeParse(baseGood);
    expect(res.success).toBe(true);
  });

  it("title 为空或超长应失败；1 字通过", () => {
    expect(submitPostSchema.safeParse({ ...baseGood, title: "" }).success).toBe(false);
    expect(submitPostSchema.safeParse({ ...baseGood, title: "A" }).success).toBe(true); // 1 字即可（与 postMetaSchema 统一）
    expect(submitPostSchema.safeParse({ ...baseGood, title: "A".repeat(121) }).success).toBe(false);
    expect(submitPostSchema.safeParse({ ...baseGood, title: "A".repeat(120) }).success).toBe(true);
    expect(submitPostSchema.safeParse({ ...baseGood, title: "AB" }).success).toBe(true);
  });

  it("description 为空或过长应失败；1 字通过", () => {
    expect(submitPostSchema.safeParse({ ...baseGood, description: "" }).success).toBe(false);
    expect(submitPostSchema.safeParse({ ...baseGood, description: "短" }).success).toBe(true); // 1 字即可（与 postMetaSchema 统一）
    expect(submitPostSchema.safeParse({ ...baseGood, description: "好".repeat(300) }).success).toBe(true);
    expect(submitPostSchema.safeParse({ ...baseGood, description: "好".repeat(301) }).success).toBe(false); // 超过 300
  });

  it("type 只能是 illustration/screenshot", () => {
    expect(submitPostSchema.safeParse({ ...baseGood, type: "music" }).success).toBe(false);
    expect(submitPostSchema.safeParse({ ...baseGood, type: "video" }).success).toBe(false);
    expect(submitPostSchema.safeParse({ ...baseGood, type: "screenshot" }).success).toBe(true);
    // 站长后台有 "comic" 等类型，但投稿端仅开放 2 种，故 comic 投稿应失败
    expect(submitPostSchema.safeParse({ ...baseGood, type: "comic" }).success).toBe(false);
  });
});

describe("投稿 submitPostSchema - tags", () => {
  const base = {
    title: "测试",
    description: "描述足够长了吧测试测试描述足够长",
    type: "illustration",
    images: ["https://example.com/x.jpg"],
  };

  it("tags 可以为空数组，但不能超过 8 个", () => {
    expect(submitPostSchema.safeParse({ ...base, tags: [] }).success).toBe(true);
    const eight = Array.from({ length: 8 }, (_, i) => `t${i}`);
    expect(submitPostSchema.safeParse({ ...base, tags: eight }).success).toBe(true);
    const nine = [...eight, "extra"];
    expect(submitPostSchema.safeParse({ ...base, tags: nine }).success).toBe(false); // 超过 8 个（与 postMetaSchema 对齐）
  });

  it("单个 tag 长度 1-20", () => {
    expect(submitPostSchema.safeParse({ ...base, tags: [""] }).success).toBe(false);
    expect(submitPostSchema.safeParse({ ...base, tags: ["X"] }).success).toBe(true);
    expect(submitPostSchema.safeParse({ ...base, tags: ["X".repeat(21)] }).success).toBe(false);
  });
});

describe("投稿 submitPostSchema - images 必填", () => {
  it("所有类型，images 至少 1 张", () => {
    const good = { title: "测试", description: "描述足够长这里够了吧", type: "illustration" as const, tags: [] };
    expect(submitPostSchema.safeParse({ ...good, images: [] }).success).toBe(false);
    expect(submitPostSchema.safeParse({ ...good, images: undefined }).success).toBe(false);
    expect(submitPostSchema.safeParse({ ...good, images: ["https://x/a.jpg"] }).success).toBe(true);
    expect(submitPostSchema.safeParse({ ...good, images: ["https://x/a.jpg"], type: "screenshot" as const }).success).toBe(true);
  });

  it("images 最多 20 张，超过失败", () => {
    const images20 = Array.from({ length: 20 }, (_, i) => `https://x/${i}.jpg`);
    const base = { title: "测试", description: "描述足够长这里够了吧", type: "illustration" as const, tags: [] };
    expect(submitPostSchema.safeParse({ ...base, images: images20 }).success).toBe(true);
    expect(submitPostSchema.safeParse({ ...base, images: [...images20, "https://x/extra.jpg"] }).success).toBe(false);
  });
});

describe("投稿 submitPostSchema - 可选来源字段", () => {
  const base = {
    title: "测试",
    description: "描述足够长这里够了吧",
    type: "illustration",
    tags: [],
    images: ["https://x/a.jpg"],
  };

  it("sourceUrl 填了就必须是合法 URL；没填 / 不填就通过", () => {
    expect(submitPostSchema.safeParse({ ...base, sourceUrl: undefined }).success).toBe(true);
    // 空串不符合 z.string().url()（最短 URL 也需要协议和域名）
    expect(submitPostSchema.safeParse({ ...base, sourceUrl: "" }).success).toBe(false);
    expect(submitPostSchema.safeParse({ ...base, sourceUrl: "不是 URL" }).success).toBe(false);
    expect(submitPostSchema.safeParse({ ...base, sourceUrl: "https://weibo.com/123" }).success).toBe(true);
  });

  it("originalCreator、sourcePlatform 填写则长度限制 1-60", () => {
    expect(submitPostSchema.safeParse({ ...base, originalCreator: "" }).success).toBe(false);
    expect(submitPostSchema.safeParse({ ...base, originalCreator: "画师A" }).success).toBe(true);
    // sourcePlatform 投稿端自由字符串（1-60），站长审核时映射到枚举
    expect(submitPostSchema.safeParse({ ...base, sourcePlatform: "微博" }).success).toBe(true);
    expect(submitPostSchema.safeParse({ ...base, sourcePlatform: "" }).success).toBe(false);
  });
});
