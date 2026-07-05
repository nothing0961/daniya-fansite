import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, "$1")), "..");
const FORM_SRC = fs.readFileSync(path.join(ROOT, "src", "components", "admin", "post-form.tsx"), "utf-8");
const SCHEMA_SRC = fs.readFileSync(path.join(ROOT, "src", "lib", "validators", "post-schema.ts"), "utf-8");
const PENDING_API = fs.readFileSync(path.join(ROOT, "src", "app", "api", "user", "submit-post", "route.ts"), "utf-8");

/**
 * PostForm + Zod schema 扩展「关联角色」字段：
 *  - 前端：下拉框（默认 DANIYA）
 *  - Zod：可选 character 字段（枚举 DANIYA | ... ，但目前只有一个）
 *  - submit API：写入 PendingPost.character 列
 */
describe("PostForm：新增「关联角色」下拉（character，默认 DANIYA，方案 A）", () => {

  it("1) Zod postMetaSchema / 投稿校验 schema 中新增了 character 字段（与 title/type 同级）", () => {
    expect(SCHEMA_SRC).toMatch(/\bcharacter\b/);
  });

  it("2) PostForm JSX 中存在 character 选择 UI（<select 或 shadcn Select / Combobox，name=character 或含 label 「关联角色/角色」）", () => {
    // 正则匹配：标签名为 select 或包含 shadcn/ui Select，或含「关联角色」「角色」label 文案
    const hasSelect =
      /<select[\s\S]{0,600}character|character[\s\S]{0,600}<\/select>/.test(FORM_SRC) ||
      /SelectTrigger|SelectContent[\s\S]{0,800}character/.test(FORM_SRC) ||
      /(?:关联角色|角色)[\s\S]{0,400}(?:<select|SelectTrigger|Combobox)/.test(FORM_SRC);
    expect(hasSelect).toBe(true);
  });

  it("3) character 下拉默认选中值为 DANIYA（前端 default value = DANIYA 或 defaultValue=\"DANIYA\" 之类）", () => {
    // 匹配 defaultValue / value = DANIYA / initialData.character ?? "DANIYA"
    expect(FORM_SRC).toMatch(/\b(?:defaultValue|value)\s*=\s*\{?\s*["']?DANIYA["']?/);
  });

  it("4) submit-post route.ts 写入 PendingPost 时也写入 character 字段（数据不丢失）", () => {
    expect(PENDING_API).toMatch(/\bcharacter\b/);
  });

});
