import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, "$1")), "..");
const LIB_SRC = fs.readFileSync(path.join(ROOT, "src", "lib", "posts.ts"), "utf-8");

/**
 * lib/posts.ts getAllPosts 扩展：增加 character 过滤参数
 * 目前签名：getAllPosts(opts?: { includeDrafts?: boolean }): PostMeta[]
 * 新签名：getAllPosts(opts?: { includeDrafts?: boolean; character?: string }): PostMeta[]
 *  —— character 传 'DANIYA' 则只返回 meta.character 或 tags/type 匹配的作品
 */
describe("lib/posts.ts：getAllPosts 新增 character 过滤参数", () => {

  it("1) getAllPosts 函数形参或内部逻辑引用了 character 关键字（说明新增了过滤维度）", () => {
    expect(LIB_SRC).toMatch(/\bcharacter\b/);
  });

  it("2) getAllPosts 的 opts 类型扩展：includeDrafts 旁新增 character 可选字段（interface / type 中同时存在）", () => {
    // 形式 1：opts?: { includeDrafts?: boolean; character?: ... }
    // 形式 2：interface GetAllPostsOpts { includeDrafts; character }
    const hasOpts =
      /includeDrafts\?\s*:\s*boolean[\s\S]{0,80}character\?/.test(LIB_SRC) ||
      /character\?[\s\S]{0,80}includeDrafts\?\s*:\s*boolean/.test(LIB_SRC) ||
      /interface\s+\w+Opts\s*\{[\s\S]{0,200}includeDrafts\?\s*:\s*boolean[\s\S]{0,200}character\?/.test(LIB_SRC);
    expect(hasOpts).toBe(true);
  });

  it("3) getAllPosts 内部存在按 character 过滤的分支（filter / if 判断 character 存在即过滤）", () => {
    // 比如：if (opts.character) posts = posts.filter(p => p.character === character)
    const filterLine = LIB_SRC.match(/(?:if\s*\([^)]*character[^)]*\)[\s\S]{0,200}filter|\.filter\s*\([^}]*character[^}]*\))/);
    expect(filterLine).not.toBeNull();
  });

});
