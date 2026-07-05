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

  it("3) character 下拉默认选中值为 DANIYA（defaultValue 属性或受控 state 初值 character 默认 DANIYA 均可）", () => {
    // 匹配两种正确实现都算：
    //  a) 非受控：defaultValue="DANIYA" / value="DANIYA"（属性里字面）
    //  b) 受控：useState<Character>(... || "DANIYA") — state 初值默认 DANIYA
    const attrMatch = /\b(?:defaultValue|value)\s*=\s*\{?\s*["']?DANIYA["']?/.test(FORM_SRC);
    const stateMatch = /useState\s*<\s*Character\s*>\s*\([\s\S]{0,100}["']DANIYA["']/.test(FORM_SRC);
    expect(attrMatch || stateMatch).toBe(true);
  });

  it("4) submit-post route.ts 写入 PendingPost 时也写入 character 字段（数据不丢失）", () => {
    expect(PENDING_API).toMatch(/\bcharacter\b/);
  });

});

describe("PostForm：投稿成功弹窗关闭后跳转『个人投稿预览页』（方案 A）", () => {

  it("5) 投稿成功（mode=submit / !isEdit）的 StatusModal onDismiss：不再跳列表 /dashboard/submissions，改为跳 /dashboard/submissions/${slug}（带后端返回的 slug）", () => {
    // 条件：mode==='submit' && !isEdit 分支里，onDismiss 必须用模板字符串带 json.slug / data.slug
    // 不能是固定 "/dashboard/submissions"（不带动态 slug）
    const onDismissIdx = FORM_SRC.indexOf("onDismiss");
    expect(onDismissIdx).toBeGreaterThan(0);
    const section = FORM_SRC.slice(Math.max(0, onDismissIdx - 800), onDismissIdx + 1200);
    // 必须带动态 slug（变量形式：json.slug / data.slug / res.slug / 局部变量 slug 都算）
    expect(section).toMatch(
      /\/dashboard\/submissions\/\$\{(?:(?:json|data|res)\.slug|slug)\}/,
    );
    // 不得出现：onDismiss 直接只跳列表（硬编码 "/dashboard/submissions" 后面不带任何 /${... 的完整 router.push 调用）
    const hardList = section.match(
      /onDismiss\s*:\s*\(\s*\)\s*=>\s*router\.push\s*\(\s*["']\/dashboard\/submissions["']\s*\)/,
    );
    expect(hardList).toBeNull();
  });

  it("6) submit-post route.ts 成功响应必须返回 { id, slug }，让前端跳转可用（已有返回，防止后续被误删）", () => {
    // 成功 200 JSON 中要包含 id 和 slug 字段（直接搜整源串，避免切片不足）
    expect(PENDING_API.indexOf("success")).toBeGreaterThan(0);
    // 要求存在 "NextResponse.json({ success: true, ... id: ... slug: ... })"
    expect(PENDING_API).toMatch(
      /NextResponse\.json\s*\(\s*\{\s*success\s*:\s*true[\s\S]{0,500}\bid\s*:\s*created\.id[\s\S]{0,200}\bslug\s*:\s*created\.slug/,
    );
  });

});

describe("PostForm：受控组件一致性（React Warning 防御）", () => {
  it("7) 所有原生 <select> 元素不得同时出现 value= 和 defaultValue=（受控/非受控二选一，否则 React 报警告）", () => {
    // 找出 FORM_SRC 中所有 <select ...> 开始标签的区间（不含 </select> 结束）
    const FORM_SRC = fs.readFileSync(
      path.join(ROOT, "src", "components", "admin", "post-form.tsx"),
      "utf-8",
    );
    // 简单解析：按 "<select" 分割后，取每个片段开头直到下一个 ">" 或 "/>" 的属性段
    const selects: string[] = [];
    let idx = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const pos = FORM_SRC.indexOf("<select", idx);
      if (pos < 0) break;
      const close = FORM_SRC.indexOf(">", pos);
      if (close < 0) break;
      selects.push(FORM_SRC.slice(pos, close + 1));
      idx = close + 1;
    }
    expect(selects.length).toBeGreaterThanOrEqual(2); // 至少有类型下拉 + 关联角色下拉
    let badCount = 0;
    const badAttrs: string[] = [];
    for (const s of selects) {
      const hasVal = /\svalue\s*=/.test(s);
      const hasDef = /\sdefaultValue\s*=/.test(s);
      if (hasVal && hasDef) {
        badCount++;
        badAttrs.push(s);
      }
    }
    expect(badCount).toBe(0); // 期望 0 个冲突。当前至少有 1 个（character select）所以应失败
    if (badCount > 0) {
      // 把冲突 select 的属性段打印出来方便 debug（写到 expect 里）
      expect(badAttrs.map((s) => s.replace(/\s+/g, " ").trim()).join(" || ")).toBe(
        "no-conflict-selects",
      );
    }
  });
});
