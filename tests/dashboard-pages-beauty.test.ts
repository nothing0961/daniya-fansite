import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * 小屋的邮路 — 「我的投稿 / 投稿审核 / 我的收藏」三页美化
 * 覆盖：
 *  1) 共享样式 postal.css（邮戳三色 / 信封 / 信纸 / 盖章按钮）
 *  2) 我的投稿：✦ 寄出的信 眉题 + 信封卡片 letter-card + 状态邮戳（待投递/已抵达/已退回）+ 退回批注
 *  3) 投稿审核：✦ 分拣台 + 小邮戳列表 + 盖章按钮（盖邮戳 · 通过/退回）+ 信纸详情面板
 *  4) 投稿预览：右上 pill → 邮戳
 *  5) 我的收藏：✦ 收藏匣 + 匣子弧线 + 空状态邀请文案
 */

const ROOT = process.cwd();
const read = (rel: string): string => {
  try {
    return fs.readFileSync(path.join(ROOT, rel), "utf-8");
  } catch {
    return "";
  }
};
const exists = (rel: string): boolean => fs.existsSync(path.join(ROOT, rel));

describe("邮路 · 共享样式 postal.css", () => {
  const css = read("src/app/(dashboard)/dashboard/postal.css");

  it("postal.css 存在且定义邮戳三色：香槟金 / 粉金 / 红棕", () => {
    expect(exists("src/app/(dashboard)/dashboard/postal.css")).toBe(true);
    expect(css).toMatch(/--postmark-gold:\s*#cfa86b/);
    expect(css).toMatch(/--postmark-pink:\s*#e79bbe/);
    expect(css).toMatch(/--postmark-rust:\s*#c97a6e/);
  });

  it("邮戳类：.postmark（旋转盖章感）+ 三状态修饰（pending/approved/rejected）", () => {
    expect(css).toMatch(/\.postmark\s*\{/);
    expect(css).toMatch(/\.postmark--pending\s*\{/);
    expect(css).toMatch(/\.postmark--approved\s*\{/);
    expect(css).toMatch(/\.postmark--rejected\s*\{/);
    expect(css).toMatch(/rotate\(-6deg\)/);
  });

  it("信封卡片 .letter-card + 退回批注 .return-note + 盖章按钮 .stamp-btn--approve/--reject", () => {
    expect(css).toMatch(/\.letter-card\s*\{/);
    expect(css).toMatch(/\.return-note\s*\{/);
    expect(css).toMatch(/\.stamp-btn--approve\s*\{/);
    expect(css).toMatch(/\.stamp-btn--reject\s*\{/);
  });

  it("reduced-motion 下禁用邮戳晃动动画", () => {
    expect(css).toMatch(/prefers-reduced-motion[\s\S]{0,200}animation:\s*none/);
  });
});

describe("邮路 · 我的投稿（submissions/page.tsx）", () => {
  const page = read("src/app/(dashboard)/dashboard/submissions/page.tsx");

  it("引入 postal.css + 眉题「✦ 寄出的信」", () => {
    expect(page).toMatch(/\.\.\/postal\.css/);
    expect(page).toMatch(/✦\s*寄出的信/);
  });

  it("卡片升级为信封（letter-card），状态徽章改为邮戳（待投递/已抵达/已退回）", () => {
    expect(page).toMatch(/letter-card/);
    expect(page).toMatch(/postmark/);
    expect(page).toMatch(/待投递/);
    expect(page).toMatch(/已抵达/);
    expect(page).toMatch(/已退回/);
  });

  it("驳回理由 → 退回批注（return-note）", () => {
    expect(page).toMatch(/return-note/);
    expect(page).toMatch(/退回批注/);
  });

  it("空状态文案邮路化：信箱还空着", () => {
    expect(page).toMatch(/信箱还空着/);
  });
});

describe("邮路 · 投稿审核（moderation-panel.tsx）", () => {
  const panel = read("src/app/(dashboard)/dashboard/moderation/moderation-panel.tsx");

  it("引入 postal.css + 眉题「✦ 分拣台」", () => {
    expect(panel).toMatch(/\.\.\/postal\.css/);
    expect(panel).toMatch(/✦\s*分拣台/);
  });

  it("左侧列表用单字小邮戳（postmark-mini），右侧详情为信纸展开（letter-sheet）", () => {
    expect(panel).toMatch(/postmark-mini/);
    expect(panel).toMatch(/letter-sheet/);
  });

  it("审核操作改为盖章按钮：盖邮戳 · 通过并投递 / 盖邮戳 · 退回", () => {
    expect(panel).toMatch(/stamp-btn--approve/);
    expect(panel).toMatch(/stamp-btn--reject/);
    expect(panel).toMatch(/盖邮戳 · 通过并投递到首页/);
    expect(panel).toMatch(/盖邮戳 · 退回这封信/);
  });
});

describe("邮路 · 投稿预览（submissions/[slug]/page.tsx）", () => {
  const page = read("src/app/(dashboard)/dashboard/submissions/[slug]/page.tsx");

  it("引入 postal.css，右上状态胶囊改为邮戳（保留三态 label）", () => {
    expect(page).toMatch(/postal\.css/);
    expect(page).toMatch(/postmark/);
    expect(page).toMatch(/审核中/);
    expect(page).toMatch(/请重新编辑/);
    expect(page).toMatch(/已通过/);
  });
});

describe("邮路 · 我的收藏（bookmarks/page.tsx）", () => {
  const page = read("src/app/(dashboard)/dashboard/bookmarks/page.tsx");

  it("引入 postal.css + 眉题「✦ 收藏匣」+ 匣子弧线装饰（chest-arch）", () => {
    expect(page).toMatch(/\.\.\/postal\.css/);
    expect(page).toMatch(/✦\s*收藏匣/);
    expect(page).toMatch(/chest-arch/);
  });

  it("空状态邀请文案：匣子还空着——去首页逛逛，挑一件喜欢的收进来吧", () => {
    expect(page).toMatch(/匣子还空着——去首页逛逛，挑一件喜欢的收进来吧/);
  });
});
