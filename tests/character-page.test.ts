import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, "$1")), "..");
const CHAR_SRC = fs.readFileSync(path.join(ROOT, "src/app/character/page.tsx"), "utf-8");
const CHAR_DATA = fs.readFileSync(path.join(ROOT, "src/app/character/archive-data.ts"), "utf-8");
const CHAR_CSS = fs.readFileSync(path.join(ROOT, "src/app/character/archive.css"), "utf-8");
const CHAR_LAYOUT = fs.readFileSync(path.join(ROOT, "src/app/character/layout.tsx"), "utf-8");
const GLOBALS_CSS = fs.readFileSync(path.join(ROOT, "src/app/globals.css"), "utf-8");

/**
 * 达妮娅 /character 页面 V4 — 侧翼档案架布局（2026-08-13 改版）
 * 结构：左栏 sticky 档案架（身份卡 + 数据胶囊 + 锚点导航 + 生日倒计时）
 *      右栏档案流（角色故事 → 鉴定报告 → 资料来源声明）
 * 配色：dan- 前缀暗色主题（深夜色底 + 达妮娅粉点缀 + 古纸墨色）
 */
describe("/character 达妮娅介绍页 V4：侧翼档案架 · 暗色文学叙事", () => {

  /* ========== 专属配色：--daniya-* 4 个变量保留在 globals.css ========== */

  it("4) globals.css 中保留了 --daniya-pink（粉白）专属 CSS 变量", () => {
    expect(GLOBALS_CSS).toMatch(/--daniya-pink\s*:/);
  });

  it("5) globals.css 中保留了 --daniya-night（星空黑）专属 CSS 变量", () => {
    expect(GLOBALS_CSS).toMatch(/--daniya-night\s*:/);
  });

  it("6) globals.css 中保留了 --daniya-accent（亮粉紫，强调色）专属 CSS 变量", () => {
    expect(GLOBALS_CSS).toMatch(/--daniya-accent\s*:/);
  });

  it("7) globals.css 中保留了 --daniya-star（粉白，星星点缀）专属 CSS 变量", () => {
    expect(GLOBALS_CSS).toMatch(/--daniya-star\s*:/);
  });

  /* ========== 区块 1：档案主体（dan-body） ========== */

  it("8) 档案以侧翼档案架开篇（左栏 dan-rail + 身份卡 dan-identity + 名字）", () => {
    expect(CHAR_SRC).toMatch(/dan-rail/);
    expect(CHAR_SRC).toMatch(/dan-identity/);
    expect(CHAR_SRC).toMatch(/达\s*妮\s*娅/);
  });

  /* ========== 区块 2：共鸣者档案属性表双列 ≥ 8 项 ========== */

  it("9) 角色档案数据包含 ≥ 8 项属性字段（archive-data.ts 中 PROFILE_ROWS）", () => {
    const keywords = [
      "称号", "武器", "属性", "稀有度", "性别",
      "所属", "实装", "声优", "配音", "组织",
      "生日", "身高", "版本", "共鸣者"
    ];
    let cnt = 0;
    for (const kw of keywords) {
      if (CHAR_DATA.includes(kw)) cnt++;
    }
    expect(cnt).toBeGreaterThanOrEqual(8);
  });

  it("9b) 属性表过滤 ⏳ 待补字段后渲染为数据胶囊（filter + visibleRows.map + dan-chip）", () => {
    expect(CHAR_SRC).toMatch(/PROFILE_ROWS\.filter/);
    expect(CHAR_SRC).toMatch(/visibleRows\.map/);
    expect(CHAR_SRC).toMatch(/dan-chip/);
  });

  /* ========== 区块 4：角色故事（单一卷轴卡片） ========== */

  it("10) 页面不再使用 Accordion 组件（V3 改用卷轴卡片）", () => {
    expect(CHAR_SRC).not.toMatch(/import[\s\S]{0,200}Accordion/);
  });

  it("11) 故事数据改为 STORY_TABS 五篇分卷（archive-data.ts）", () => {
    expect(CHAR_DATA).toMatch(/export\s+const\s+STORY_TABS/);
    for (const label of ["礼物", "荒芜", "明昼", "群魔", "谎言"]) {
      expect(CHAR_DATA).toMatch(new RegExp("label\\s*:\\s*['\"]" + label + "['\"]"));
    }
  });

  it("11b) 故事区改为标签栏 + 内容区渲染（dan-story-tabs + dan-story-panel）", () => {
    expect(CHAR_SRC).toMatch(/STORY_TABS\.map/);
    expect(CHAR_SRC).toMatch(/dan-story-tabs/);
    expect(CHAR_SRC).toMatch(/dan-story-tab--active/);
    expect(CHAR_SRC).toMatch(/dan-story-panel/);
    expect(CHAR_SRC).toMatch(/activeStoryId/);
    expect(CHAR_SRC).toMatch(/dan-sheet--story/);
    expect(CHAR_SRC).toMatch(/dan-sheet-head/);
    expect(CHAR_SRC).not.toMatch(/dan-chapter-head/);
    expect(CHAR_SRC).not.toMatch(/dan-chapter-title/);
    expect(CHAR_SRC).not.toMatch(/dan-chapter-divider/);
  });

  it("11c) 章节数据不再包含 chapterNo / pageNo 字段（装饰编号已移除）", () => {
    expect(CHAR_DATA).not.toMatch(/chapterNo/);
    expect(CHAR_DATA).not.toMatch(/pageNo/);
    expect(CHAR_SRC).not.toMatch(/dan-chapter-no/);
    expect(CHAR_SRC).not.toMatch(/dan-chapter-page/);
    // 新头部使用 § 符号 + sheet-title
    expect(CHAR_SRC).toMatch(/dan-sheet-number/);
    expect(CHAR_SRC).toMatch(/dan-sheet-page/);
  });

  /* ========== 区块 4：达妮娅相关二创作品已删除（用户 2026-07-03 要求移除） ========== */

  it("12) 「达妮娅 · 相关二创作品」区块已完全删除", () => {
    expect(CHAR_SRC).not.toMatch(/相关二创作品|二创作品/);
    expect(CHAR_SRC).not.toMatch(/import\s*\{[^}]*FeedList[^}]*\}\s*from\s*["']@\/components\/feed/);
    expect(CHAR_SRC).not.toMatch(/import\s*\{[^}]*getAllPosts[^}]*\}\s*from\s*["']@\/lib\/posts/);
    const tabKeywords = ["全部作品", "美图插画", "同人文 / 文章", "视频 & 手书", "游戏截图", "COS 正片", "漫画多图", "其他创作"];
    let cnt = 0;
    for (const kw of tabKeywords) if (CHAR_SRC.includes(kw)) cnt++;
    expect(cnt).toBeLessThan(4);
    expect(CHAR_SRC).not.toMatch(/searchParams\?\.(tab|\[.tab.\])/);
    expect(CHAR_SRC).not.toMatch(/\?tab=/);
    expect(CHAR_SRC).not.toMatch(/\bdisplayedPosts\b/);
    expect(CHAR_SRC).not.toMatch(/\bdaniyaPosts\b/);
    expect(CHAR_SRC).not.toMatch(/\bactiveTab\b/);
  });

  /* ========== 区块 5：资料来源声明（合规硬约束） ========== */

  it("13) 页面存在「资料来源」声明区块（合规：所有引用内容必须附来源链接）", () => {
    expect(CHAR_SRC).toMatch(/(资料来源|参考来源|内容来源|出处|引用来源|source)/i);
  });

  it("13b) 资料来源区块使用 dan-source-list 渲染（ARCHIVE_SOURCE_LINKS.map）", () => {
    expect(CHAR_SRC).toMatch(/dan-source-list/);
    expect(CHAR_SRC).toMatch(/ARCHIVE_SOURCE_LINKS\.map/);
  });

  /* ========== V3 新增：暗色文学风格样式 ========== */

  it("14) 页面导入 archive.css（暗色文学风格样式）", () => {
    expect(CHAR_SRC).toMatch(/import\s*["']\.\/archive\.css["']/);
  });

  it("15) archive.css 定义了 dan-archive 根容器变量（深夜色底 #0d0a14）", () => {
    expect(CHAR_CSS).toMatch(/--dan-bg:/);
    expect(CHAR_CSS).toMatch(/--dan-pink:\s*#e79bbe/);
  });

  it("16) archive.css 定义了纸张卡片样式（dan-sheet + 钉孔装饰）", () => {
    expect(CHAR_CSS).toMatch(/\.dan-sheet\b/);
    expect(CHAR_CSS).toMatch(/\.dan-sheet::before/);
    expect(CHAR_CSS).toMatch(/\.dan-sheet::after/);
  });

  it("17) archive.css 定义了拉贝尔曲线样式（dan-ecg 检测档案波形母题）", () => {
    expect(CHAR_CSS).toMatch(/\.dan-ecg\b/);
    expect(CHAR_CSS).toMatch(/\.dan-ecg-path/);
  });

  /* ========== V3 新增：archive-data.ts 数据结构 ========== */

  it("18) archive-data.ts 导出 STORY_CHAPTER、PROFILE_ROWS、ARCHIVE_SOURCE_LINKS、RESONANCE_REPORT 四个数据", () => {
    expect(CHAR_DATA).toMatch(/export\s+const\s+STORY_CHAPTER/);
    expect(CHAR_DATA).toMatch(/export\s+const\s+PROFILE_ROWS/);
    expect(CHAR_DATA).toMatch(/export\s+const\s+ARCHIVE_SOURCE_LINKS/);
    expect(CHAR_DATA).toMatch(/export\s+const\s+STORY_TABS/);
    expect(CHAR_DATA).toMatch(/export\s+const\s+RESONANCE_REPORT/);
  });

  it("19) 章节不再包含「站长备注」（用户 2026-08-04 要求删除）", () => {
    expect(CHAR_DATA).not.toMatch(/站长备注/);
  });

  /* ========== 区块 2.5：共鸣能力鉴定报告 ========== */

  it("20) 页面导入 RESONANCE_REPORT 数据并渲染报告区块", () => {
    expect(CHAR_SRC).toMatch(/RESONANCE_REPORT/);
    expect(CHAR_SRC).toMatch(/dan-sheet--report/);
  });

  it("21) 报告区块包含共鸣能力字段、子章节、对话引用（dan-report-ability / dan-report-sub / dan-report-quote）", () => {
    expect(CHAR_SRC).toMatch(/dan-report-ability/);
    expect(CHAR_SRC).toMatch(/dan-report-sub/);
    expect(CHAR_SRC).toMatch(/dan-report-quote/);
  });

  it("22) archive-data.ts 中共鸣能力鉴定报告数据包含「泡影视阈」和 ≥ 2 个子章节", () => {
    expect(CHAR_DATA).toMatch(/泡影视阈/);
    const subMatches = CHAR_DATA.match(/title\s*:\s*["'][^"']+["']/g) ?? [];
    // 至少包含频谱检验报告 + 超频诊断报告
    expect(CHAR_DATA).toMatch(/频谱检验报告/);
    expect(CHAR_DATA).toMatch(/超频诊断报告/);
  });

  it("23) archive.css 定义了报告卡片样式（dan-report-*）", () => {
    expect(CHAR_CSS).toMatch(/\.dan-report-ability/);
    expect(CHAR_CSS).toMatch(/\.dan-report-sub-title/);
    expect(CHAR_CSS).toMatch(/\.dan-report-fields/);
    expect(CHAR_CSS).toMatch(/\.dan-report-quote/);
  });

  /* ========== 可折叠胶囊交互 ========== */

  it("24) page.tsx 为 Client Component（含 'use client'）", () => {
    expect(CHAR_SRC).toMatch(/^["']use client["']/m);
  });

  it("25) page.tsx 使用 useState 管理折叠状态", () => {
    expect(CHAR_SRC).toMatch(/useState/);
    expect(CHAR_SRC).toMatch(/collapsed|toggle/i);
  });

  it("26) page.tsx 包含可折叠交互类名（dan-collapsible-head + dan-toggle + dan-collapse）", () => {
    expect(CHAR_SRC).toMatch(/dan-collapsible-head/);
    expect(CHAR_SRC).toMatch(/dan-toggle/);
    expect(CHAR_SRC).toMatch(/dan-collapse/);
  });

  it("27) 左栏身份卡（dan-identity）不包含可折叠交互（常驻展示）", () => {
    // 截取身份卡区块的代码片段，确认没有 dan-collapsible-head
    const identitySection = CHAR_SRC.match(/dan-identity[\s\S]*?<\/div>/)?.[0] ?? "";
    expect(identitySection).not.toMatch(/dan-collapsible-head/);
  });

  it("28) archive.css 定义了折叠动画样式（dan-collapse + dan-toggle + dan-collapsible-head）", () => {
    expect(CHAR_CSS).toMatch(/\.dan-collapsible-head/);
    expect(CHAR_CSS).toMatch(/\.dan-toggle\b/);
    expect(CHAR_CSS).toMatch(/\.dan-collapse\b/);
    expect(CHAR_CSS).toMatch(/\.dan-collapse--closed/);
  });

  it("29) metadata 移至 layout.tsx（Client Component 不能导出 metadata）", () => {
    expect(CHAR_LAYOUT).toMatch(/export\s+const\s+metadata/);
    expect(CHAR_LAYOUT).toMatch(/title.*达妮娅/);
  });
});
