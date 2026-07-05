import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, "$1")), "..");
const HEADER_SRC = fs.readFileSync(path.join(ROOT, "src/components/layout/header.tsx"), "utf-8");
const USERMENU_SRC = fs.readFileSync(path.join(ROOT, "src/components/auth/user-menu.tsx"), "utf-8");

/**
 * Header 顶部导航栏 — UI 样式改造
 * 两个交付：
 *   A. 中间 navLinks 导航项：改为「小胶囊容器」框起来（rounded-full + border）
 *   B. 右侧操作区的搜索图标（放大镜svg）→ 改为真正的「搜索栏」(form GET /search + input name="q")
 */
describe("Header 顶部导航样式改造（导航胶囊化 + 搜索图标→搜索栏）", () => {

  describe("A. 中间导航（首页/达妮娅/关于）每个小胶囊框起来", () => {
    it("1) navLinks 循环渲染的 Link className 必须含有 rounded-full（胶囊圆角）", () => {
      // 定位到 navLinks.map 区域（中间桌面端导航），查验其 className
      expect(HEADER_SRC).toMatch(
        /navLinks\.map[\s\S]{0,600}className="[^"]*rounded-full/
      );
    });

    it("2) navLinks 循环渲染的 Link className 必须含有 border（胶囊边框线），参考「投稿」按钮同款边框样式", () => {
      // 在 navLinks.map 里，className 必须包含 border 关键字
      expect(HEADER_SRC).toMatch(
        /navLinks\.map[\s\S]{0,600}className="[^"]*border[^"]*"/
      );
    });
  });

  describe("B. 右侧操作区：搜索图标 → 搜索栏（form GET /search）", () => {
    it("3) header.tsx 必须出现 <form action=\"/search\"（或 action='/search'）表单，用于 GET 提交到搜索页", () => {
      expect(HEADER_SRC).toMatch(/<form[^>]*action\s*=\s*["']\/search["']/);
    });

    it("4) form 表单内部必须有搜索输入框：含 <input 且 name=\"q\"（搜索关键字字段名），type=search 或 type=text", () => {
      // 先验证 <input ... name="q"> 或 <input ... name='q'> 在 form 里出现
      expect(HEADER_SRC).toMatch(/<input[^>]*name\s*=\s*["']q["'][^>]*>/);
      // type=search 或 type=text（搜索栏外观）
      expect(HEADER_SRC).toMatch(/<input[^>]*type\s*=\s*["'](search|text)["'][^>]*>/);
    });

    it("5) 原「放大镜图标」搜索入口已移除：不再包含原 SVG path 'M21 21l-5.197-5.197'（说明确实从图标换成了输入框）", () => {
      expect(HEADER_SRC).not.toContain("M21 21l-5.197-5.197");
    });
  });

});

/**
 * C. 用户头像下拉菜单 UserMenu：纯色底
 *   亮色主题下纯白（bg-white）+ 暗色主题下纯黑（dark:bg-black）
 */
describe("Header 用户菜单 UserMenu：下拉菜单主题化纯色底（亮白/暗黑）", () => {
  // 定位到：下拉菜单外层 div（absolute right-0 top-full mt-2 w-48 rounded-lg）的 className 段
  const MENU_DIV_RE =
    /className="(absolute[^"]*rounded-lg[^"]*z-50[^"]*)"/;

  it("1) 下拉菜单容器不再使用半透明 bg-[var(--card)]（--card 自带 alpha 透明）", () => {
    const m = MENU_DIV_RE.exec(USERMENU_SRC);
    expect(m).not.toBeNull();
    const className = m![1];
    expect(className).not.toContain("bg-[var(--card)]");
  });

  it("2) 亮色主题下拉菜单必须是纯白底：className 含 bg-white（Tailwind 标准不透明 #fff）", () => {
    const m = MENU_DIV_RE.exec(USERMENU_SRC);
    expect(m).not.toBeNull();
    const className = m![1];
    // 必须有 bg-white（不是 :bg-white 不行，得是"独立"出现或行末/空格分隔 bg-white
    expect(className).toMatch(/(?:^|\s)bg-white(?:\s|$)/);
  });

  it("3) 暗色主题下拉菜单必须是纯黑底：className 含 dark:bg-black（Tailwind dark 变体切换）", () => {
    const m = MENU_DIV_RE.exec(USERMENU_SRC);
    expect(m).not.toBeNull();
    const className = m![1];
    expect(className).toContain("dark:bg-black");
  });
});
