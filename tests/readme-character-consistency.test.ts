/**
 * 7月9日 进度同步修 bug · TDD RED
 * 不一致 1：README 超前写了「DANIYA/OTHER 二分」，但源码三处（Prisma schema / Zod / PostForm）
 *   的 Character enum 都只有 DANIYA 一个值。按用户选择 A（修 README 措辞零风险）：
 *   README 描述应与真实源码对齐，不应再宣称存在 OTHER 枚举值，
 *   改为「DANIYA 单值（OTHER 占位预留给后续扩角色）」。
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const README_PATH = `${process.cwd()}/README.md`;
const PRISMA_PATH = `${process.cwd()}/prisma/schema.prisma`;

function read(p: string) {
  return readFileSync(p, "utf-8");
}

describe("README 与源码 Character enum 一致性（7月9日进度同步不一致1）", () => {
  it("源码真实 ground truth：prisma schema Character enum 当前只有 DANIYA，没有 OTHER", () => {
    const prisma = read(PRISMA_PATH);
    const enumBlock = prisma.match(/enum\s+Character\s*\{([^}]+)\}/)?.[1] ?? "";
    const values = enumBlock
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    expect(values).toEqual(["DANIYA"]);
    expect(values).not.toContain("OTHER");
  });

  it("README 第十四波 表行（schema.prisma enum Character { X Y }）应写为 单值 { DANIYA } 并注明 OTHER 占位预留", () => {
    const readme = read(README_PATH);
    // 当前错误写法 = 写了 { DANIYA OTHER } 二分
    expect(readme).not.toMatch(/enum\s+Character\s*\{\s*DANIYA\s+OTHER\s*\}/);
    // 期望：只写 { DANIYA }，同时有「OTHER 占位预留」之类的短语
    expect(readme).toMatch(/enum\s+Character\s*\{\s*DANIYA\s*\}/);
    expect(readme).toMatch(/OTHER.*占位预留|占位预留.*OTHER/);
  });

  it("README 设计理念出处标注优先行：应改成「目前 DANIYA 单值」，不再写 (DANIYA / OTHER)", () => {
    const readme = read(README_PATH);
    expect(readme).not.toContain("角色归属（DANIYA / OTHER）");
    expect(readme).toContain(
      "目前 DANIYA 单值，OTHER 占位预留给后续扩角色",
    );
  });

  it("README 第十四波背景描述：不应再写 DANIYA 或 OTHER 其他鸣潮角色 这种『既有 OTHER』的措辞", () => {
    const readme = read(README_PATH);
    expect(readme).not.toMatch(
      /DANIYA\s*达妮娅\s*或\s*OTHER\s*其他鸣潮角色/,
    );
    expect(readme).toMatch(/仅\s*DANIYA.*OTHER.*占位预留|DANIYA.*单值.*OTHER.*预留/);
  });
});
