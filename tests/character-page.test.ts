import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, "$1")), "..");
const CHAR_SRC = fs.readFileSync(path.join(ROOT, "src/app/character/page.tsx"), "utf-8");
const GLOBALS_CSS = fs.readFileSync(path.join(ROOT, "src/app/globals.css"), "utf-8");

/**
 * 达妮娅 /character 页面 — Hero 主视觉填图
 * 交付：将 Hero Banner 区域（原 2:1 占位 div + "1200×600 达妮娅角色主视觉" 文字占位）
 *       替换为真正的 <img 引用用户提供的 4077c3fe...jpg 图片，保持 2:1 比例。
 */
describe("/character 达妮娅介绍页：Hero Banner 填图（主视觉 2:1）", () => {
  const HERO_PLACEHOLDER_TEXT = "1200 × 600 — 达妮娅角色主视觉";

  it("1) Hero 区已移除占位 span：页面 JSX 中不再出现占位提示文字 '1200 × 600 — 达妮娅角色主视觉'", () => {
    // 如果仍然是占位 div，就会有这段 span 文案；填图后应该移除
    expect(CHAR_SRC).not.toContain(HERO_PLACEHOLDER_TEXT);
  });

  it("2) Hero 区不再引用旧的 4077c3fe 图：用户已删除旧角色主视觉，<img src 不应再包含文件 basename '4077c3fe3de40de08a3cab3f6d408de01955897084.jpg'", () => {
    expect(CHAR_SRC).not.toMatch(
      /<img[^>]*src\s*=\s*["'][^"']*4077c3fe3de40de08a3cab3f6d408de01955897084\.jpg[^"']*["']/
    );
  });

  it("14) Hero 区已填入新生日主视觉：<img src 包含用户提供的新文件 basename '492b30d224bf47429e8aa73a9cfd104a20260521.jpg'", () => {
    // 允许 src="/492b...jpg" 或 src="/492b...jpg@xxxw_!..." 等后缀，只要文件名命中
    expect(CHAR_SRC).toMatch(
      /<img[^>]*src\s*=\s*["'][^"']*492b30d224bf47429e8aa73a9cfd104a20260521\.jpg[^"']*["']/
    );
  });

  /* ========== 区块 2：档案卡左侧头像占位 → 替换为 PNG 透明底立绘 ========== */

  it("15) 档案卡左侧头像占位文字已移除：源码中不应出现『头像占位』或『200 × 200』等占位提示文案（L156-176 区域）", () => {
    // 锚点：档案卡外层 div（含 "flex flex-col sm:flex-row gap-6 items-start rounded-xl border p-5 md:p-6" 特征 className）
    const cardIdx = CHAR_SRC.indexOf("头像占位（200×200");
    // 注释里的"头像占位（200×200"允许保留，检查的是渲染出来的文字，所以锚点用占位段落内的特征
    // 真正的占位提示是渲染给用户看的：<p>⏳ 头像占位</p> 和 <p>200 × 200<br />PNG 透明底<br />达妮娅立绘抠图</p>
    expect(CHAR_SRC).not.toMatch(/>\s*⏳\s*头像占位\s*</);
    expect(CHAR_SRC).not.toMatch(/200\s*×\s*200/);
    expect(CHAR_SRC).not.toMatch(/达妮娅立绘抠图/);
  });

  it("16) 档案卡头像位已填入新 PNG：<img src 包含文件 basename '625294f4d0b740f4bf5ce693ddb0b35920260521.png'（用户提供的透明底立绘）", () => {
    // 先找到头像外层 200×200 容器 className
    const wrapperIdx = CHAR_SRC.indexOf('w-[200px] h-[200px]');
    expect(wrapperIdx).toBeGreaterThan(0);
    const nearby = CHAR_SRC.slice(wrapperIdx, wrapperIdx + 1200);
    expect(nearby).toMatch(
      /<img[^>]*src\s*=\s*["'][^"']*625294f4d0b740f4bf5ce693ddb0b35920260521\.png[^"']*["']/
    );
  });

  it("17) 档案卡头像外层容器保持原规格：200×200 方形、rounded-xl 圆角、accent 色 border 都不丢（避免换图后尺寸/视觉错乱）", () => {
    const wrapperIdx = CHAR_SRC.indexOf('w-[200px] h-[200px]');
    expect(wrapperIdx).toBeGreaterThan(0);
    const wrapperLine = CHAR_SRC.slice(wrapperIdx - 400, wrapperIdx + 900);
    // A. 保持 200px 正方形
    expect(wrapperLine).toMatch(/w-\[200px\].*h-\[200px\]/);
    // B. 保持 rounded-xl 圆角
    expect(wrapperLine).toMatch(/\brounded-xl\b/);
    // C. 保持 accent 色边框（border-2 + borderColor accent 任一都可）
    const hasAccentBorder =
      /\bborder-2\b/.test(wrapperLine) ||
      /borderColor\s*:\s*["']var\(--daniya-accent\)["']/.test(wrapperLine) ||
      /borderColor:\s*"var\(--daniya-accent\)"/.test(wrapperLine);
    expect(hasAccentBorder).toBe(true);
    // D. <img> 用 object-contain（透明底 PNG 立绘应完整显示不裁切，而非 cover 裁切）
    const imgIdx = wrapperLine.indexOf("625294f4d0b740f4bf5ce693ddb0b35920260521");
    expect(imgIdx).toBeGreaterThan(0);
    const imgLine = wrapperLine.slice(imgIdx - 300, imgIdx + 300);
    expect(imgLine).toMatch(/\bobject-contain\b/);
  });

  it("3) Hero 图片外层仍然保持 2:1 比例：class 列表中仍有 aspect-[2/1]（避免图片把页面撑变形）", () => {
    // 定位 Hero Banner 注释附近的 className，含 aspect-[2/1]
    expect(CHAR_SRC).toMatch(
      /(?:Hero Banner|主视觉|角色信息)[\s\S]{0,300}className="[^"]*aspect-\[2\/1\]/
    );
  });
});

/**
 * 达妮娅 /character 页面 V2 大升级 — 5 大区块
 * 结构：Hero叠加层 + 档案信息卡（双列≥8项）+ 故事折叠（≥5个Accordion）+ 分类Tab作品区 + 资料来源声明
 * 配色：专属 --daniya-pink / --daniya-night / --daniya-accent / --daniya-star
 */
describe("/character 达妮娅介绍页 V2 升级：5 大区块 + 专属配色（方案确认版）", () => {

  /* ========== 专属配色：--daniya-* 4 个变量，亮/暗主题下都有 ========== */

  it("4) globals.css 中新增了 --daniya-pink（粉白）专属 CSS 变量（:root 或 .light/.dark 下都可）", () => {
    expect(GLOBALS_CSS).toMatch(/--daniya-pink\s*:/);
  });

  it("5) globals.css 中新增了 --daniya-night（星空黑）专属 CSS 变量", () => {
    expect(GLOBALS_CSS).toMatch(/--daniya-night\s*:/);
  });

  it("6) globals.css 中新增了 --daniya-accent（亮粉紫，强调色）专属 CSS 变量", () => {
    expect(GLOBALS_CSS).toMatch(/--daniya-accent\s*:/);
  });

  it("7) globals.css 中新增了 --daniya-star（淡鹅黄，星星点缀）专属 CSS 变量", () => {
    expect(GLOBALS_CSS).toMatch(/--daniya-star\s*:/);
  });

  /* ========== 区块 1：Hero 叠加层（主视觉图上直接显示大标题） ========== */

  it("8) Hero 主视觉图上有「达妮娅」大标题叠加层（不再只靠浏览器 tab 标题，图上直接有大字+副标题）", () => {
    // 要求：<h1 或 className含 overlay/gradient/banner 的区域里包含 "达妮娅" 大字
    // Hero 区块含注释 + img + gradient overlay + h1 + 标签胶囊，实际代码较长
    const heroBlock = CHAR_SRC.match(
      /(?:Hero|主视觉|Banner)[\s\S]{0,4000}?达妮娅[\s\S]{0,1000}?<\/(?:section|div)>/
    );
    expect(heroBlock).not.toBeNull();
    // 叠加层的关键特征：大标题标题元素 h1/h2 或 className 含 title/overlay/gradient/大字
    const hasOverlay =
      /<h1[\s\S]{0,60}达妮娅|<h2[\s\S]{0,60}达妮娅|(?:overlay|gradient|banner-title|叠加)/i.test(heroBlock![0]);
    expect(hasOverlay).toBe(true);
  });

  /* ========== 区块 2：档案信息卡双列 ≥8 项 ========== */

  it("9) 角色档案卡包含 ≥ 8 项属性字段（称号/武器/属性/稀有度/性别/所属/实装/声优 至少其中 8 个 key 出现）", () => {
    // 先找到档案卡所在区域：className 含 profile/profile-card/档案/info-card 附近，或 角色信息 区块
    // 然后统计字段标签："称号|武器|属性|稀有度|性别|所属|组织|实装|版本|声优|配音|身高|生日|共鸣者" —— 至少8个
    const keywords = [
      "称号", "武器", "属性", "稀有度", "性别",
      "所属", "实装", "声优", "配音", "组织",
      "生日", "身高", "版本", "共鸣者"
    ];
    let cnt = 0;
    for (const kw of keywords) {
      if (CHAR_SRC.includes(kw)) cnt++;
    }
    expect(cnt).toBeGreaterThanOrEqual(8);
  });

  /* ========== 区块 3：故事档案 shadcn/ui Accordion ≥ 5 项 ========== */

  it("10) 页面 import 了 Accordion 组件（shadcn/ui Accordion 相关组件名：AccordionItem / AccordionTrigger / AccordionContent）", () => {
    expect(CHAR_SRC).toMatch(/import[\s\S]{0,200}Accordion(?:Item|Trigger|Content)?/);
  });

  it("11) 故事折叠 Accordion ≥ 5 个 <AccordionItem>（5 段档案预留）", () => {
    // 有两种等价实现：a) 直接写 5 个 <AccordionItem>；b) 用 .map(STORY_SECTIONS) 循环渲染
    // 实现 b 时源码中 <AccordionItem 只出现 1 次，但 STORY_SECTIONS 数组 ≥ 5 项
    const tagMatches = CHAR_SRC.match(/<AccordionItem\b/g) ?? [];
    // 解析 STORY_SECTIONS 数组里的对象个数：统计 value: "xxx" 或 title: "xxx" 出现次数
    const sectionMatches = CHAR_SRC.match(/value\s*:\s*["'][^"']+["']\s*,\s*[\s\S]{0,100}?title\s*:/g) ?? [];
    const accordionCount = Math.max(tagMatches.length, sectionMatches.length);
    expect(accordionCount).toBeGreaterThanOrEqual(5);
  });

  /* ========== 区块 4：达妮娅相关二创作品已删除（用户 2026-07-03 要求移除） ========== */

  it("12) 「达妮娅 · 相关二创作品」区块已完全删除：页面源码中不应出现该标题、FeedList、分类Tab、getAllPosts过滤", () => {
    // A. 标题关键词"相关二创作品"或"二创作品"不能出现
    expect(CHAR_SRC).not.toMatch(/相关二创作品|二创作品/);
    // B. 不应 import FeedList 组件
    expect(CHAR_SRC).not.toMatch(/import\s*\{[^}]*FeedList[^}]*\}\s*from\s*["']@\/components\/feed/);
    // C. 不应 import getAllPosts（原用于 character:"DANIYA" 过滤）
    expect(CHAR_SRC).not.toMatch(/import\s*\{[^}]*getAllPosts[^}]*\}\s*from\s*["']@\/lib\/posts/);
    // D. 不应出现 WORK_TABS 或 分类 Tab 关键词组合（全部/美图/同人文/视频 同时出现≥4个就是区块4特征）
    const tabKeywords = ["全部作品", "美图插画", "同人文 / 文章", "视频 & 手书", "游戏截图", "COS 正片", "漫画多图", "其他创作"];
    let cnt = 0;
    for (const kw of tabKeywords) if (CHAR_SRC.includes(kw)) cnt++;
    expect(cnt).toBeLessThan(4);
    // E. 不应出现 searchParams?.tab 或 ?tab= URL 驱动 Tab 切换
    expect(CHAR_SRC).not.toMatch(/searchParams\?\.(tab|\[.tab.\])/);
    expect(CHAR_SRC).not.toMatch(/\?tab=/);
    // F. 不应出现 displayedPosts / daniyaPosts / activeTab 这些区块 4 专用变量
    expect(CHAR_SRC).not.toMatch(/\bdisplayedPosts\b/);
    expect(CHAR_SRC).not.toMatch(/\bdaniyaPosts\b/);
    expect(CHAR_SRC).not.toMatch(/\bactiveTab\b/);
  });

  /* ========== 区块 5：资料来源声明（合规硬约束） ========== */

  it("13) 页底部存在「资料来源 / 参考来源 / 出处」声明区块（合规：所有引用内容必须附来源链接）", () => {
    expect(CHAR_SRC).toMatch(/(资料来源|参考来源|内容来源|出处|引用来源|source)/i);
  });

});
