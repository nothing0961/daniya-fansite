/**
 * 首页生日倒计时专项测试
 * 验证：birthday-countdown.tsx 存在性 + 核心逻辑特征，以及 page.tsx L98-109 胶囊替换
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const COMPONENT_PATH = path.join(
  process.cwd(),
  "src/app/birthday-countdown.tsx"
);
const PAGE_PATH = path.join(process.cwd(), "src/app/page.tsx");
const COMP_SRC = fs.existsSync(COMPONENT_PATH)
  ? fs.readFileSync(COMPONENT_PATH, "utf-8")
  : "";
const PAGE_SRC = fs.readFileSync(PAGE_PATH, "utf-8");

describe("birthday-countdown.tsx Client 组件", () => {
  it("1) 组件文件已创建：src/app/birthday-countdown.tsx 存在且非空", () => {
    expect(fs.existsSync(COMPONENT_PATH)).toBe(true);
    expect(COMP_SRC.length).toBeGreaterThan(50);
  });

  it("2) 必须是 use client（每秒倒计时需要浏览器端 setInterval，不能是 RSC）", () => {
    expect(COMP_SRC.slice(0, 50)).toMatch(/^\s*["']use client["']\s*;?\s*\n/);
  });

  it("3) 生日常量：每年 5 月 21 日（不要写死年份，要按每年循环）", () => {
    // 月 5、日 21 两个数字同时出现；并同时匹配 5/21、05/21、5-21、05-21 任一写法
    const hasMonth5 = /\bMONTH\s*[:=]\s*5\b|\b5\s*,\s*21\b|\bBIRTHDAY_MONTH\s*[:=]\s*5/.test(COMP_SRC)
      || /new\s+Date\(\s*\d{4}\s*,\s*4\s*,/.test(COMP_SRC)   // Date(year, 4, 21)  月份从 0 开始，5 月是 4
      || /(05|5)[-/](21)\b/.test(COMP_SRC);                  // "5-21" / "05-21" / "5/21"
    const hasDay21 = /\bDAY\s*[:=]\s*21\b|\b21\s*[,)]/.test(COMP_SRC)
      || /(05|5)[-/](21)\b/.test(COMP_SRC)
      || /new\s+Date\(\s*\d{4}\s*,\s*\d\s*,\s*21/.test(COMP_SRC);
    expect(hasMonth5).toBe(true);
    expect(hasDay21).toBe(true);
  });

  it("4) 每秒刷新：使用 setInterval + 1000ms（或 1s），并在 useEffect 返回 cleanup", () => {
    expect(COMP_SRC).toMatch(/\bsetInterval\b/);
    // 1000 或 1_000 或 每一秒的常量
    expect(COMP_SRC).toMatch(/\b(1000|1_000)\b/);
    // useEffect 里开 interval，cleanup clearInterval
    expect(COMP_SRC).toMatch(/useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*clearInterval\s*\(/);
  });

  it("5) 分支判断：生日当天要显示庆祝态（例如『今天是达妮娅生日！』/『🎉』/『生日快乐』等文案或单独分支）", () => {
    const keywords = /生日(快乐|当天|就是今天|🎉|🎂|🍰)|今天是.*生日|happy.*birthday/i;
    expect(COMP_SRC).toMatch(keywords);
  });

  it("6) 核心导出：export function BirthdayCountdown 或 default export（名字里有 Birthday 或 Countdown）", () => {
    expect(COMP_SRC).toMatch(
      /export\s+(default\s+)?(function|const)\s+\w*(Birthday|Countdown)\w*/
    );
  });

  it("7) 过了今年生日自动 rollover：计算下次生日时，若 today > 今年生日则用 year+1（通过对比 setMonth+setDate 或年份 + 逻辑判断来验证存在 rollover 机制）", () => {
    // 只要源码里有 year+1 / +1 的年份判断（或等价写法 today > target 时再 setFullYear+1）就算
    const hasRollover =
      /year\s*\+\s*1/.test(COMP_SRC) ||
      /setFullYear\([^)]*\+\s*1\)/.test(COMP_SRC) ||
      /target\s*[<]\s*now|now\s*[>]\s*target/.test(COMP_SRC);
    expect(hasRollover).toBe(true);
  });
});

describe("birthday-countdown.tsx 俏皮文案暗色主题变白", () => {
  it("12) 倒计时态俏皮文案 <p>（tagline 输出的那行，带『{/* 俏皮文案 */}』JSX 注释）：亮色保留 muted-foreground，暗色追加 dark:text-white 变白", () => {
    // 锚点：精确到 JSX 注释 {/* 俏皮文案 */}，避免与 pickTagline 函数上方的 JSDoc 注释"俏皮文案池"混淆
    const anchor = "{/* 俏皮文案 */}";
    const idx = COMP_SRC.indexOf(anchor);
    expect(idx).toBeGreaterThan(0);
    const nearby = COMP_SRC.slice(idx, idx + 300);
    // 必须匹配紧随注释的 <p> 标签
    const pMatch = nearby.match(/<p\s+className="([^"]+)"\s*>/);
    expect(pMatch).not.toBeNull();
    const cls = pMatch![1];
    // A. 保留原字号 + 外边距 mt-1.5
    expect(cls).toMatch(/text-\[11px\]/);
    expect(cls).toMatch(/\bsm:text-xs\b/);
    expect(cls).toMatch(/\bmt-1\.5\b/);
    // B. 保留原亮色颜色 text-[var(--muted-foreground)]
    expect(cls).toMatch(/text-\[var\(--muted-foreground\)\]/);
    // C. 追加 dark:text-white
    expect(cls).toMatch(/\bdark:text-white\b/);
  });

  it("13) 庆祝态（今天生日）的副文案 <p> 颜色保持不变（用户未要求修改），防止误改", () => {
    // 找到庆祝态里面的"别忘了多准备一点蛋糕与甜点"这句文案的所属 p
    const idx = COMP_SRC.indexOf("别忘了多准备一点蛋糕与甜点");
    expect(idx).toBeGreaterThan(0);
    const nearby = COMP_SRC.slice(idx - 300, idx + 50);
    // 找这个 p 的开头标签
    const pMatch = nearby.match(/<p\s+className="([^"]+)"\s*>/g) || [];
    // 取最后一个（离那句文案最近的 p 标签）
    expect(pMatch.length).toBeGreaterThanOrEqual(1);
    const lastP = pMatch[pMatch.length - 1];
    // 不应出现 dark:text-white（保持原来的 muted-foreground 或者用户以后自己改）
    expect(lastP).not.toMatch(/\bdark:text-white\b/);
  });
});

describe("首页 page.tsx L98-109 胶囊替换为生日倒计时", () => {
  it("8) 页面 import 了 BirthdayCountdown 组件（本地 ./birthday-countdown）", () => {
    expect(PAGE_SRC).toMatch(
      /import\s*\{[^}]*BirthdayCountdown[^}]*\}\s*from\s*["']\.\/birthday-countdown["']/
    );
  });

  it("9) 原来的站名文案已移除：不再出现『达妮娅的瞌睡小屋』或『curation 站点』或『标注原作者与出处』等原 H1/描述", () => {
    // 但 "达妮娅" 三个字在左边卡片里还有，所以不能全文件删；只要求在原来的胶囊位置（rounded-full px-10 py-5 附近）没有这些词
    const idx = PAGE_SRC.indexOf("rounded-full border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md px-10 py-5");
    expect(idx).toBeGreaterThan(0);
    const nearby = PAGE_SRC.slice(idx, idx + 1200);
    expect(nearby).not.toMatch(/达妮娅的瞌睡小屋/);
    expect(nearby).not.toMatch(/curation 站点/);
    expect(nearby).not.toMatch(/标注原作者与出处/);
    // 旧的 h1 和 p 结构也不应该在附近
    expect(nearby).not.toMatch(/<h1\b/);
    expect(nearby).not.toMatch(/《鸣潮》角色达妮娅的同人/);
  });

  it("10) 原胶囊容器样式保留：仍然是 rounded-full + border + card 半透明 + backdrop-blur + px-10 py-5（A 方案要求保留外形）", () => {
    expect(PAGE_SRC).toMatch(
      /rounded-full\s+border\s+border-\[var\(--border\)\]\s+bg-\[var\(--card\)\]\/50\s+backdrop-blur-md\s+px-10\s+py-5/
    );
  });

  it("11) 原胶囊内部换成了 <BirthdayCountdown /> JSX 标签", () => {
    const idx = PAGE_SRC.indexOf("rounded-full border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md px-10 py-5");
    const nearby = PAGE_SRC.slice(idx, idx + 800);
    expect(nearby).toMatch(/<BirthdayCountdown\s*\/?>/);
  });
});
