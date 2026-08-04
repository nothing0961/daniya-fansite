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
const MOCK_DATA = fs.readFileSync(path.join(ROOT, "src/lib/home-mock-data.ts"), "utf-8");

describe("首页 page.tsx — 三栏暗色角色主题布局", () => {
  it("1) 页面导入 home-mock-data 数据（HERO_DATA / ABILITY_TAGS / RESONANCE_TAGS / SIDE_NOTES / STAT_ITEMS）", () => {
    expect(PAGE_SRC).toMatch(/from\s+"@\/lib\/home-mock-data"/);
    expect(PAGE_SRC).toMatch(/HERO_DATA/);
    expect(PAGE_SRC).toMatch(/ABILITY_TAGS/);
    expect(PAGE_SRC).toMatch(/RESONANCE_TAGS/);
    expect(PAGE_SRC).toMatch(/SIDE_NOTES/);
    expect(PAGE_SRC).toMatch(/STAT_ITEMS/);
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

  it("4) 左栏保留 TetrisConsoleHost 俄罗斯方块", () => {
    expect(PAGE_SRC).toMatch(/TetrisConsoleHost/);
    expect(PAGE_SRC).toMatch(/hp-tetris-wrap/);
  });

  it("5) 中栏主舞台包含 hp-hero 卡片（hp-hero-content / hp-hero-title / hp-ability-cloud / hp-cta-row）", () => {
    expect(PAGE_SRC).toMatch(/hp-hero-content/);
    expect(PAGE_SRC).toMatch(/hp-hero-title/);
    expect(PAGE_SRC).toMatch(/hp-ability-cloud/);
    expect(PAGE_SRC).toMatch(/hp-cta-row/);
  });

  it("6) 中栏包含统计条（hp-stat-bar），生日倒计时移至右栏", () => {
    expect(PAGE_SRC).toMatch(/hp-stat-bar/);
    expect(PAGE_SRC).toMatch(/hp-sidebar-birthday/);
    expect(PAGE_SRC).toMatch(/BirthdayCountdown/);
  });

  it("7) 右栏包含三个面板（生日倒计时 hp-sidebar-birthday / 共鸣图鉴 hp-resonance-grid / 站长笔记 hp-note-list）", () => {
    expect(PAGE_SRC).toMatch(/hp-sidebar-birthday/);
    expect(PAGE_SRC).toMatch(/hp-resonance-grid/);
    expect(PAGE_SRC).toMatch(/hp-note-list/);
  });

  it("8) 首页不再包含底部信息流（已迁移到 /works 独立页）", () => {
    expect(PAGE_SRC).not.toMatch(/FeedList/);
    expect(PAGE_SRC).not.toMatch(/FeedPagination/);
    expect(PAGE_SRC).not.toMatch(/getAllPosts/);
    expect(PAGE_SRC).not.toMatch(/hp-feed-section/);
  });

  it("9) 页面标题 metadata 包含达妮娅", () => {
    expect(PAGE_SRC).toMatch(/title.*达妮娅/);
  });
});

describe("首页 home.css — 暗色角色主题样式", () => {
  it("10) CSS 定义了主题 CSS 变量（--hp-gold / --hp-ink / --hp-card 等）", () => {
    expect(HOME_CSS).toMatch(/--hp-gold:/);
    expect(HOME_CSS).toMatch(/--hp-ink:/);
    expect(HOME_CSS).toMatch(/--hp-card:/);
    expect(HOME_CSS).toMatch(/--hp-bg-deep:/);
  });

  it("11) CSS 定义了三栏网格布局（grid-template-columns: 360px 1fr 240px）", () => {
    expect(HOME_CSS).toMatch(/grid-template-columns:\s*360px\s+1fr\s+240px/);
  });

  it("12) CSS 定义了俄罗斯方块容器约束（hp-col--left .hp-tetris-wrap > div 宽度 100%）", () => {
    expect(HOME_CSS).toMatch(/hp-col--left.*hp-tetris-wrap/);
    expect(HOME_CSS).toMatch(/width:\s*100%\s*!important/);
    expect(HOME_CSS).toMatch(/min-width:\s*0\s*!important/);
  });

  it("13) CSS 定义了能力标签样式（hp-ability-tag--gold/pink/blue/green）", () => {
    expect(HOME_CSS).toMatch(/hp-ability-tag--gold/);
    expect(HOME_CSS).toMatch(/hp-ability-tag--pink/);
    expect(HOME_CSS).toMatch(/hp-ability-tag--blue/);
    expect(HOME_CSS).toMatch(/hp-ability-tag--green/);
  });

  it("14) CSS 定义了统计条和 CTA 按钮样式", () => {
    expect(HOME_CSS).toMatch(/\.hp-stat-bar/);
    expect(HOME_CSS).toMatch(/\.hp-btn--primary/);
    expect(HOME_CSS).toMatch(/\.hp-btn--ghost/);
  });

  it("15) CSS 响应式代码已注释（移动端显示桌面端布局）", () => {
    expect(HOME_CSS).toMatch(/\/\*\s*\n?\s*@media/);
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

  it("19) mock-data 导出 RESONANCE_TAGS 和 STAT_ITEMS", () => {
    expect(MOCK_DATA).toMatch(/export\s+const\s+RESONANCE_TAGS/);
    expect(MOCK_DATA).toMatch(/export\s+const\s+STAT_ITEMS/);
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
