/**
 * 7月9日 进度同步修 bug · TDD RED
 * 不一致 2：package.json 仍保留 nodemailer + @types/nodemailer 两个死依赖
 *   （对应 SendCloud 邮件模块代码已物理删除，但依赖没卸载）
 * 期望：dependencies 和 devDependencies 中都不应该再出现这两个包名。
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("package.json · 死依赖清理（7月9日进度同步不一致2）", () => {
  const pkg = JSON.parse(
    readFileSync(`${process.cwd()}/package.json`, "utf-8"),
  );

  it("dependencies 中不应包含已废弃模块 nodemailer", () => {
    expect(Object.keys(pkg.dependencies ?? {})).not.toContain("nodemailer");
  });

  it("devDependencies 中不应包含已废弃类型模块 @types/nodemailer", () => {
    expect(Object.keys(pkg.devDependencies ?? {})).not.toContain(
      "@types/nodemailer",
    );
  });
});
