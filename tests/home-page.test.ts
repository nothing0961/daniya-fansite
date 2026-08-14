/**
 * 首页 (/ 路由) 专项测试
 * 三栏暗色角色主题布局（2026-08-04 改版）
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, "$1")), "..");
const PAGE_SRC = fs.readFileSync(path.join(ROOT, "src/app/page.tsx"), "utf-8");
const HOME_CSS = fs.readFileSync(path.join(ROOT, "src/app/home.css"), "utf-8");
const GLOBALS_CSS = fs.readFileSync(path.join(ROOT, "src/app/globals.css"), "utf-8");
const MOCK_DATA = fs.readFileSync(path.join(ROOT, "src/lib/home-mock-data.ts"), "utf-8");

describe("首页 page.tsx — 三栏暗色角色主题布局", () => {
  it("1) 页面导入 home-mock-data 数据（HERO_DATA / ABILITY_TAGS / ECHO_QUOTES / RESONANCE_TAGS / SIDE_NOTES）与 getAllPosts", () => {
    expect(PAGE_SRC).toMatch(/from\s+"@\/lib\/home-mock-data"/);
    expect(PAGE_SRC).toMatch(/HERO_DATA/);
    expect(PAGE_SRC).toMatch(/ABILITY_TAGS/);
    expect(PAGE_SRC).toMatch(/ECHO_QUOTES/);
    expect(PAGE_SRC).toMatch(/RESONANCE_TAGS/);
    expect(PAGE_SRC).toMatch(/SIDE_NOTES/);
    expect(PAGE_SRC).toMatch(/getAllPosts/);
  });

  it("2) 页面导入 home.css 样式", () => {
    expect(PAGE_SRC).toMatch(/import\s+"\.\/home\.css"/);
  });

  it("3) 页面包含三栏布局类名（hp-stage / hp-col--left / hp-col--center / hp-col--right）", () => {
    expect(PAGE_SRC).toMatch(/hp-stage/);
    expect(PAGE_SRC).toMatch(/hp-col--left/);
    expect(PAGE_SRC).toMatch(/hp-col--center/);
    expect(PAGE_SRC).toMatch(/hp-col--right/);
  });

  it("4) 左栏保留 TetrisConsoleHost 俄罗斯方块，语音回声卡片改为 EchoRotator 轮播（ECHO_QUOTES 台词气泡）", () => {
    expect(PAGE_SRC).toMatch(/TetrisConsoleHost/);
    expect(PAGE_SRC).toMatch(/hp-tetris-wrap/);
    expect(PAGE_SRC).toMatch(/hp-echo-card/);
    expect(PAGE_SRC).toMatch(/EchoRotator/);
    expect(PAGE_SRC).toMatch(/quotes=\{ECHO_QUOTES\}/);
  });

  it("5) 中栏主舞台包含 hp-hero 卡片（hp-hero-content / hp-hero-title / hp-ability-cloud / hp-cta-row）", () => {
    expect(PAGE_SRC).toMatch(/hp-hero-content/);
    expect(PAGE_SRC).toMatch(/hp-hero-title/);
    expect(PAGE_SRC).toMatch(/hp-ability-cloud/);
    expect(PAGE_SRC).toMatch(/hp-cta-row/);
  });

  it("5b) 中栏台词上移为副标题，移除与 kicker 重复的 subtitle 与底部引用块", () => {
    expect(PAGE_SRC).toMatch(/hp-hero-sub[^>]*>\{HERO_DATA\.quote\}/);
    expect(PAGE_SRC).not.toMatch(/HERO_DATA\.subtitle/);
    expect(PAGE_SRC).not.toMatch(/hp-quote">/);
  });

  it("5c) 中栏 hero 新增立绘海报卡（hp-hero-body / hp-hero-poster，竖图 webp 素材）", () => {
    expect(PAGE_SRC).toMatch(/hp-hero-body/);
    expect(PAGE_SRC).toMatch(/hp-hero-poster/);
    expect(PAGE_SRC).toMatch(/615294f4d0b740f4bf5ce693ddb0b35920260521\.webp/);
  });

  it("6) 统计条移至右栏「站点速览」卡（hp-stat-card + hp-stat-bar），生日倒计时与共鸣图鉴同栏", () => {
    expect(PAGE_SRC).toMatch(/hp-stat-card/);
    expect(PAGE_SRC).toMatch(/hp-stat-bar/);
    expect(PAGE_SRC).toMatch(/站点速览/);
    expect(PAGE_SRC).toMatch(/hp-sidebar-birthday/);
    expect(PAGE_SRC).toMatch(/BirthdayCountdown/);
    // 统计值来自真实数据源而非编造数字
    expect(PAGE_SRC).toMatch(/getAllPosts\(\)\.length/);
    expect(PAGE_SRC).toMatch(/RESONANCE_TAGS\.length/);
    expect(PAGE_SRC).toMatch(/ECHO_QUOTES\.length/);
    expect(PAGE_SRC).not.toMatch(/23,461/);
  });

  it("7) 右栏包含三个面板（生日倒计时 hp-sidebar-birthday / 共鸣图鉴 hp-resonance-grid / 站长笔记 hp-note-list）", () => {
    expect(PAGE_SRC).toMatch(/hp-sidebar-birthday/);
    expect(PAGE_SRC).toMatch(/hp-resonance-grid/);
    expect(PAGE_SRC).toMatch(/hp-note-list/);
  });

  it("8) 首页不再包含底部信息流（已迁移到 /works 独立页）", () => {
    expect(PAGE_SRC).not.toMatch(/FeedList/);
    expect(PAGE_SRC).not.toMatch(/FeedPagination/);
    expect(PAGE_SRC).not.toMatch(/hp-feed-section/);
    // getAllPosts 现用于站点速览统计作品数（真实数据），非信息流
    expect(PAGE_SRC).toMatch(/getAllPosts/);
  });

  it("9) 页面标题 metadata 包含达妮娅", () => {
    expect(PAGE_SRC).toMatch(/title.*达妮娅/);
  });
});

describe("语音回声轮播组件 echo-rotator.tsx", () => {
  const ROTATOR_SRC = fs.readFileSync(
    path.join(ROOT, "src/components/home/echo-rotator.tsx"),
    "utf-8"
  );

  it("a) 组件为客户端组件，含台词叠层舞台（hp-echo-stage）", () => {
    expect(ROTATOR_SRC).toMatch(/"use client"/);
    expect(ROTATOR_SRC).toMatch(/hp-echo-stage/);
    expect(ROTATOR_SRC).toMatch(/hp-quote-bubble--left/);
    expect(ROTATOR_SRC).toMatch(/hp-quote--active/);
  });

  it("b) 轮播带指示点与 hover 暂停，定时切换台词", () => {
    expect(ROTATOR_SRC).toMatch(/hp-echo-dots/);
    expect(ROTATOR_SRC).toMatch(/hp-echo-dot--active/);
    expect(ROTATOR_SRC).toMatch(/onMouseEnter/);
    expect(ROTATOR_SRC).toMatch(/setTimeout/);
    expect(ROTATOR_SRC).toMatch(/4000/);
  });
});

describe("首页 home.css — 暗色角色主题样式", () => {
  it("10) 主题 CSS 变量定义在 globals.css 共享块（--hp-pink / --hp-ink / --hp-card 等）", () => {
    expect(GLOBALS_CSS).toMatch(/--hp-pink:/);
    expect(GLOBALS_CSS).toMatch(/--hp-ink:/);
    expect(GLOBALS_CSS).toMatch(/--hp-card:/);
    expect(GLOBALS_CSS).toMatch(/--hp-bg-deep:/);
  });

  it("11) CSS 定义了三栏网格布局（grid-template-columns: 280px minmax(0, 1fr) 300px）", () => {
    expect(HOME_CSS).toMatch(/grid-template-columns:\s*280px\s+minmax\(0,\s*1fr\)\s+300px/);
  });

  it("12) CSS 定义了俄罗斯方块容器约束（hp-col--left .hp-tetris-wrap > div 宽度 100%）", () => {
    expect(HOME_CSS).toMatch(/hp-col--left.*hp-tetris-wrap/);
    expect(HOME_CSS).toMatch(/width:\s*100%\s*!important/);
    expect(HOME_CSS).toMatch(/min-width:\s*0\s*!important/);
  });

  it("13) CSS 定义了能力标签样式（hp-ability-tag--pink/blue/green）", () => {
    expect(HOME_CSS).toMatch(/hp-ability-tag--pink/);
    expect(HOME_CSS).toMatch(/hp-ability-tag--blue/);
    expect(HOME_CSS).toMatch(/hp-ability-tag--green/);
  });

  it("14) CSS 定义了统计条和 CTA 按钮样式", () => {
    expect(HOME_CSS).toMatch(/\.hp-stat-bar/);
    expect(HOME_CSS).toMatch(/\.hp-btn--primary/);
    expect(HOME_CSS).toMatch(/\.hp-btn--ghost/);
  });

  it("15) CSS 启用了响应式断点（≤1100px 两栏 / ≤760px 单栏）", () => {
    expect(HOME_CSS).not.toMatch(/\/\*\s*\n?\s*@media/);
    expect(HOME_CSS).toMatch(/@media\s*\(max-width:\s*1100px\)/);
    expect(HOME_CSS).toMatch(/@media\s*\(max-width:\s*760px\)/);
  });

  it("15b) CSS 定义了语音回声卡片（hp-echo-card）与轮播样式（hp-echo-stage 叠层 + 指示点）", () => {
    expect(HOME_CSS).toMatch(/\.hp-echo-card/);
    expect(HOME_CSS).toMatch(/\.hp-quote-bubble--left/);
    expect(HOME_CSS).toMatch(/\.hp-echo-stage/);
    expect(HOME_CSS).toMatch(/\.hp-echo-dots/);
    expect(HOME_CSS).toMatch(/\.hp-quote--active/);
    expect(HOME_CSS).not.toMatch(/\.hp-quote-bubble--right/);
    expect(HOME_CSS).not.toMatch(/\.hp-quote-list/);
  });

  it("15c) CSS 定义了立绘海报卡（hp-hero-poster）与竖排统计带（hp-stat-card 内行式）", () => {
    expect(HOME_CSS).toMatch(/\.hp-hero-body/);
    expect(HOME_CSS).toMatch(/\.hp-hero-poster/);
    expect(HOME_CSS).toMatch(/\.hp-stat-card \.hp-stat-bar/);
    expect(HOME_CSS).toMatch(/aspect-ratio:\s*2\s*\/\s*3/);
  });
});

describe("首页 home-mock-data.ts — 数据完整性", () => {
  it("16) mock-data 导出 HERO_DATA 包含 titleZh/titleEn/ctaPrimary/ctaSecondary", () => {
    expect(MOCK_DATA).toMatch(/titleZh:\s*"达妮娅"/);
    expect(MOCK_DATA).toMatch(/titleEn:/);
    expect(MOCK_DATA).toMatch(/ctaPrimary:/);
    expect(MOCK_DATA).toMatch(/ctaSecondary:/);
  });

  it("17) mock-data 导出 ABILITY_TAGS（≥ 4 个能力标签）", () => {
    expect(MOCK_DATA).toMatch(/export\s+const\s+ABILITY_TAGS/);
    const tags = MOCK_DATA.match(/label:\s*"[^"]+"/g) ?? [];
    // 至少有 HERO_DATA + ABILITY_TAGS 中的标签
    expect(tags.length).toBeGreaterThanOrEqual(4);
  });

  it("18) mock-data 导出 ECHO_QUOTES（≥ 3 条对话）", () => {
    expect(MOCK_DATA).toMatch(/export\s+const\s+ECHO_QUOTES/);
    const quotes = MOCK_DATA.match(/id:\s*"q\d+"/g) ?? [];
    expect(quotes.length).toBeGreaterThanOrEqual(3);
  });

  it("19) mock-data 导出 RESONANCE_TAGS，且已移除编造数字 STAT_ITEMS", () => {
    expect(MOCK_DATA).toMatch(/export\s+const\s+RESONANCE_TAGS/);
    expect(MOCK_DATA).not.toMatch(/STAT_ITEMS/);
    expect(MOCK_DATA).not.toMatch(/23,461/);
  });

  it("20) mock-data 导出 SIDE_NOTES（站长笔记 ≥ 2 条）", () => {
    expect(MOCK_DATA).toMatch(/export\s+const\s+SIDE_NOTES/);
    expect(MOCK_DATA).toMatch(/export\s+interface\s+SideNote/);
  });
});

describe("作品集页 works/page.tsx", () => {
  const WORKS_SRC = fs.readFileSync(
    path.join(ROOT, "src/app/works/page.tsx"),
    "utf-8"
  );

  it("21) works 页面使用 getFilteredWorks 获取筛选后作品", () => {
    expect(WORKS_SRC).toMatch(/getFilteredWorks/);
  });

  it("22) works 页面使用瀑布流 + Tab + 客户端组件", () => {
    expect(WORKS_SRC).toMatch(/WorksClient/);
    expect(WORKS_SRC).toMatch(/WorksTabs/);
  });

  it("23) works 页面使用 URL 参数同步 Tab 状态", () => {
    expect(WORKS_SRC).toMatch(/searchParams/);
    expect(WORKS_SRC).toMatch(/params\.type/);
    expect(WORKS_SRC).toMatch(/params\.sort/);
  });

  it("24) works 页面标题为「作品集」", () => {
    expect(WORKS_SRC).toMatch(/作品集/);
  });
});

describe("导航栏 — 新增「作品集」入口", () => {
  const HEADER_SRC = fs.readFileSync(
    path.join(ROOT, "src/components/layout/header.tsx"),
    "utf-8"
  );
  const NAV_LINKS_SRC = fs.readFileSync(
    path.join(ROOT, "src/components/layout/nav-links.tsx"),
    "utf-8"
  );

  it("25) header.tsx navLinks 包含 /works 作品集", () => {
    expect(HEADER_SRC).toMatch(/href:\s*"\/works"/);
    expect(HEADER_SRC).toMatch(/label:\s*"作品集"/);
  });

  it("26) nav-links.tsx 包含 /works 作品集", () => {
    expect(NAV_LINKS_SRC).toMatch(/href:\s*"\/works"/);
    expect(NAV_LINKS_SRC).toMatch(/label:\s*"作品集"/);
  });
});
