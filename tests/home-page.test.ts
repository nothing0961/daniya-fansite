/**
 * 首页 (/ 路由) 专项测试
 * 测试范围：page.tsx 中的 Hero Banner / 角色卡片 / 暗色主题颜色联动
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const PAGE_SRC = fs.readFileSync(
  path.join(process.cwd(), "src/app/page.tsx"),
  "utf-8"
);

describe("首页 page.tsx — 角色卡片 L66-72 暗色主题字色覆盖", () => {
  it("1) 『中部：角色档案 · 3 段』外层 div（L65）在暗色主题下覆盖文字为纯白：className 里同时保留亮色 muted-foreground + dark:text-white", () => {
    // 定位到区块注释
    const blockComment = "中部：角色档案 · 3 段";
    const idx = PAGE_SRC.indexOf(blockComment);
    expect(idx).toBeGreaterThan(0);

    // 从注释向下抓 800 字符（正好覆盖外层 div 到 blockquote 之前的区域）
    const nearby = PAGE_SRC.slice(idx, idx + 800);

    // A. 必须保留原有亮色颜色 text-[var(--muted-foreground)]
    expect(nearby).toMatch(/text-\[var\(--muted-foreground\)\]/);

    // B. 必须新增暗色主题覆盖 dark:text-white（Tailwind class 策略）
    //    —— 亮色不变，暗色变纯白，符合用户需求
    expect(nearby).toMatch(/\bdark:text-white\b/);
  });

  it("2) L66-72 两段正文本身不要被硬编码 text-white（亮色要保持原 muted-foreground，颜色覆盖统一由外层 div 驱动）", () => {
    const idx = PAGE_SRC.indexOf("任何时间、任何地点、任何一位讲师的课堂");
    expect(idx).toBeGreaterThan(0);
    const nearby = PAGE_SRC.slice(idx - 200, idx + 600);

    // 两段 <p> 标签内不应出现单独的 text-white 或 style={{color:"white"}}
    // 颜色统一由外层 div 的 dark:text-white 控制，避免亮色串色
    const twoParas = nearby.match(/<p>[\s\S]*?<\/p>/g) || [];
    expect(twoParas.length).toBeGreaterThanOrEqual(2);
    for (const p of twoParas) {
      expect(p).not.toMatch(/className="[^"]*\btext-white\b/);
      expect(p).not.toMatch(/\btext-white\b/);
      expect(p).not.toMatch(/style=\{[^}]*color.*white/);
    }
  });

  it("3) 内部 blockquote（L73）颜色不受影响：仍使用 var(--credit) 金色，不被白色覆盖", () => {
    const idx = PAGE_SRC.indexOf("至于这些数据来自哪里……她劝你最好别问");
    expect(idx).toBeGreaterThan(0);
    const nearby = PAGE_SRC.slice(idx - 500, idx + 200);
    const bqMatch = nearby.match(/<blockquote\s+[^>]*>/);
    expect(bqMatch).not.toBeNull();
    const bq = bqMatch![0];
    expect(bq).toMatch(/var\(--credit\)/);
    // 不应加 dark:text-white（否则会覆盖掉 credit 金色高亮）
    expect(bq).not.toMatch(/\bdark:text-white\b/);
  });
});

describe("首页 page.tsx — 类型筛选胶囊栏的『筛选』二字暗色主题变白", () => {
  it("4) L107 『筛选』span 亮色保留 muted-foreground，暗色追加 dark:text-white 覆盖为纯白", () => {
    // 定位"筛选"二字的 span。页面里应该只有一个 text-sm + text-[var(--muted-foreground)] 且内容为"筛选"的 span
    // 用类型筛选标签胶囊外层容器作锚点
    const anchor = "rounded-full border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md px-6 py-3 flex items-center gap-3 flex-wrap justify-center";
    const idx = PAGE_SRC.indexOf(anchor);
    expect(idx).toBeGreaterThan(0);
    const nearby = PAGE_SRC.slice(idx, idx + 600);
    // 内部的"筛选"span（紧随其后的第一个 span）
    const spanMatch = nearby.match(/<span\s+className="([^"]+)"\s*>\s*筛选\s*<\/span>/);
    expect(spanMatch).not.toBeNull();
    const cls = spanMatch![1];
    // A. 必须保留原来的 text-sm + text-[var(--muted-foreground)]（亮色不串色）
    expect(cls).toMatch(/\btext-sm\b/);
    expect(cls).toMatch(/text-\[var\(--muted-foreground\)\]/);
    // B. 必须追加 dark:text-white（暗色主题变白）
    expect(cls).toMatch(/\bdark:text-white\b/);
  });

  it("5) 『筛选』下面的类型 Link 标签不要加 dark:text-white（它们自己有 hover:border-primary 配色，保持原来的 text-[var(--foreground)]）", () => {
    const anchor = "rounded-full border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md px-6 py-3 flex items-center gap-3 flex-wrap justify-center";
    const idx = PAGE_SRC.indexOf(anchor);
    expect(idx).toBeGreaterThan(0);
    const nearby = PAGE_SRC.slice(idx, idx + 3000);
    const links = nearby.match(/<Link\b[\s\S]*?<\/Link>/g) || [];
    // 核心语义：命中的每个 Link 都不能被错误地加了 dark:text-white
    for (const link of links) {
      expect(link).not.toMatch(/\bdark:text-white\b/);
    }
    // 兜底：直接在整个筛选栏范围搜 Link 的 className 字符串常量，那里也不应有 dark:text-white
    const linkClassName = 'className="rounded-full border border-[var(--border)] bg-[var(--muted)]/40 px-4 py-1 text-sm text-[var(--foreground)] hover:bg-[var(--primary)]/30 hover:border-[var(--primary)] transition-colors"';
    if (nearby.includes(linkClassName)) {
      expect(linkClassName).not.toMatch(/\bdark:text-white\b/);
    }
  });
});
