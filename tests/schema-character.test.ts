import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, "$1")), "..");
const SCHEMA_SRC = fs.readFileSync(path.join(ROOT, "prisma", "schema.prisma"), "utf-8");

/**
 * Schema 改造 Phase 1：
 *  - 新增 Character 枚举（值：DANIYA），以后可扩展其他角色
 *  - PendingPost 模型加 character Character? 字段（可空无默认值=方案A）
 *
 * 方案 A 动机：
 *  老作品保持 null，不被粗鲁归类；新投稿在 PostForm 前端默认选 DANIYA。
 */
describe("Prisma Schema：新增 Character 枚举 + PendingPost.character 可空字段（方案 A）", () => {

  it("1) schema.prisma 中定义了 enum Character（独立角色枚举，区别于 PostType）", () => {
    expect(SCHEMA_SRC).toMatch(/\benum\s+Character\b/);
  });

  it("2) Character 枚举中包含第一个值 DANIYA", () => {
    // 找到 enum Character 区块：从 enum Character { 到它的闭合 }
    const start = SCHEMA_SRC.indexOf("enum Character");
    expect(start).toBeGreaterThan(-1);
    const braceStart = SCHEMA_SRC.indexOf("{", start);
    expect(braceStart).toBeGreaterThan(start);
    // 找到 0 缩进的 } 作为该 enum 块结束
    const braceEnd = SCHEMA_SRC.indexOf("\n}\n", braceStart);
    expect(braceEnd).toBeGreaterThanOrEqual(braceStart + 10);
    const enumBlock = SCHEMA_SRC.slice(braceStart, braceEnd);
    expect(enumBlock).toMatch(/\bDANIYA\b/);
  });

  it("3) PendingPost 模型中新增了 character 字段（名字必须叫 character）", () => {
    // 找 PendingPost 模型块
    const start = SCHEMA_SRC.indexOf("model PendingPost");
    expect(start).toBeGreaterThan(-1);
    const blockStart = SCHEMA_SRC.indexOf("{", start);
    expect(blockStart).toBeGreaterThan(start);
    // 找到 model 结束：0 缩进的下一个 }（model PendingPost 内部的闭括号都是有缩进的）
    const blockEnd = SCHEMA_SRC.indexOf("\n}\n", blockStart);
    expect(blockEnd).toBeGreaterThan(blockStart + 100);
    const modelBlock = SCHEMA_SRC.slice(blockStart, blockEnd);
    expect(modelBlock).toMatch(/\bcharacter\b/);
  });

  it("4) character 字段类型是 Character 枚举，并且是可空的（? 标记，方案 A 无默认值）", () => {
    const start = SCHEMA_SRC.indexOf("model PendingPost");
    const blockStart = SCHEMA_SRC.indexOf("{", start);
    const blockEnd = SCHEMA_SRC.indexOf("\n}\n", blockStart);
    const modelBlock = SCHEMA_SRC.slice(blockStart, blockEnd);
    // 匹配 character Character? —— 字段名 + 枚举类型 + 可空问号
    // 匹配 character Character? —— 字段名 + 枚举类型 + 可空问号（注意 ? 后无 \b，避免换行时失败）
    expect(modelBlock).toMatch(/\bcharacter\s+Character\s*\?[^A-Za-z0-9_]/);
    // 不允许出现 @default(DANIYA)，保持方案 A
    expect(modelBlock).not.toMatch(/\bcharacter[\s\S]{0,40}@default\s*\(\s*DANIYA\s*\)/);
  });

});
