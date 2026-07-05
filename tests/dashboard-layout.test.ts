import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// 源码根目录（C:/Users/29942/Desktop/daniya-fansite → 由 import.meta.url 计算，避免硬编码绝对路径）
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, "$1")), "..");
const LAYOUT_SRC = fs.readFileSync(path.join(ROOT, "src/app/(dashboard)/layout.tsx"), "utf-8");
const PAGE_SRC = fs.readFileSync(path.join(ROOT, "src/app/(dashboard)/dashboard/page.tsx"), "utf-8");

/**
 * Dashboard 整体布局测试（源码结构断言）
 * 覆盖两个改造点：
 * 1. sidebar 删除「账号设置」「作品管理」两个菜单项（保留「概览 / 我的收藏 / 投稿审核」）
 * 2. /dashboard 概览页 — 删除「绑定账号」区域，追加「账号设置卡」+「作品管理快捷入口（站长）」
 */
describe("Dashboard sidebar 侧边栏菜单（方案 A：整合后）", () => {
  it("sidebarLinks 必须包含 概览 + 我的收藏（所有用户都能看到）", () => {
    expect(LAYOUT_SRC).toContain('href: "/dashboard", label: "概览"');
    expect(LAYOUT_SRC).toContain('href: "/dashboard/bookmarks", label: "我的收藏"');
  });

  it("sidebarLinks 必须保留投稿审核（仅站长 isAdmin 追加）", () => {
    expect(LAYOUT_SRC).toContain('href: "/dashboard/moderation", label: "投稿审核"');
  });

  it("sidebarLinks 必须删除 账号设置 菜单项（整合到概览页，不再单独列出）", () => {
    // 匹配精确的 href + label，防止 href 出现在注释里被误判
    expect(LAYOUT_SRC).not.toContain('href: "/dashboard/settings", label: "账号设置"');
  });

  it("sidebarLinks 必须删除 作品管理 菜单项（整合到概览页，不再单独列出）", () => {
    expect(LAYOUT_SRC).not.toContain('href: "/dashboard/posts", label: "作品管理"');
  });
});

describe("Dashboard 概览页（/dashboard，方案 A：整合后）", () => {
  // ===== ① 删除绑定账号区域 =====
  it("应删除 '绑定账号' section（文案 / 标题 / map 渲染全部移除）", () => {
    expect(PAGE_SRC).not.toContain("绑定账号");
    expect(PAGE_SRC).not.toContain("linkedMethods");
    expect(PAGE_SRC).not.toContain("linkedProviders");
    expect(PAGE_SRC).not.toContain('m.linked ? "已绑定" : "未绑定"');
  });

  it("绑定账号 3 个 label（GitHub/QQ/邮箱）必须从页面里移除", () => {
    // 用更精确的结构匹配：{ label: "GitHub" ... } 这种 linkedMethods 内的声明
    expect(PAGE_SRC).not.toMatch(/label:\s*"GitHub"[,\s]*linked:/);
    expect(PAGE_SRC).not.toMatch(/label:\s*"QQ"[,\s]*linked:/);
    expect(PAGE_SRC).not.toMatch(/label:\s*"邮箱"[,\s]*linked:/);
  });

  // ===== ② 改造：基本信息区已合并到顶部「用户信息卡片」（避免重复展示头像+昵称+邮箱）=====
  it("原独立的 '基本信息' section 标题必须被移除（已合并到顶部用户信息卡片，不再重复显示）", () => {
    // 匹配 JSX section 标题渲染模式（<h2>基本信息</h2>），注释里的"基本信息"不受影响
    expect(PAGE_SRC).not.toMatch(/<h2[^>]*>\s*基本信息\s*<\/h2>/);
    // 也不应出现基本信息 section 的注释块"从账号设置页整合过来"的独立区域标识
    expect(PAGE_SRC).not.toMatch(/从账号设置页整合过来[^\n]*\n[\s\S]{0,400}基本信息/);
  });

  it("页面中只能存在 1 个 Avatar 组件实例（原「用户信息卡+基本信息区」两个 Avatar 已合并为一个）", () => {
    const matches = PAGE_SRC.match(/<Avatar\s+className/g) || [];
    expect(matches.length).toBe(1);
  });

  it("AvatarUploadDialog 组件必须存在（更换头像功能依然保留）且放在顶部用户信息卡片内", () => {
    expect(PAGE_SRC).toContain("AvatarUploadDialog");
    // 必须带 props（currentImage + userName，避免导入未使用）
    expect(PAGE_SRC).toMatch(/AvatarUploadDialog[\s\S]{0,80}currentImage=/);
    expect(PAGE_SRC).toMatch(/AvatarUploadDialog[\s\S]{0,80}userName=/);
    // 关键：JSX 用法（<AvatarUploadDialog .../>）必须紧跟在第一个 Avatar 组件之后 800 字符内
    // —— 证明按钮被嵌入在用户信息卡片的同一行 flex 布局里，而不是下方独立 section
    const firstAvatarIdx = PAGE_SRC.indexOf("<Avatar className");
    // 用 <AvatarUploadDialog\s 精确匹配 JSX 自闭合标签（而非 import 语句命中）
    const jsxDialogRegex = /<AvatarUploadDialog\s/;
    const dialogMatch = jsxDialogRegex.exec(PAGE_SRC);
    expect(firstAvatarIdx).toBeGreaterThan(-1);
    expect(dialogMatch).not.toBeNull();
    const dialogIdx = dialogMatch!.index;
    expect(dialogIdx).toBeGreaterThan(firstAvatarIdx);
    expect(dialogIdx - firstAvatarIdx).toBeLessThan(800);
  });

  it("Separator 组件依然存在（用于分隔统计区与账号操作等，保留结构层次）", () => {
    expect(PAGE_SRC).toContain("Separator");
  });

  it("必须包含 '账号操作' section + '退出登录' 红色 Link（跳 /api/auth/signout）", () => {
    expect(PAGE_SRC).toContain("账号操作");
    expect(PAGE_SRC).toContain("退出登录");
    expect(PAGE_SRC).toContain('href="/api/auth/signout"');
  });

  // ===== ④ 编辑ID（更换昵称）按钮：用户信息卡片内更换头像右侧相邻位置 =====
  it("用户信息卡片内必须出现 EditNameDialog 组件（提供「编辑ID/修改昵称」入口）", () => {
    // 导入声明存在
    expect(PAGE_SRC).toContain("EditNameDialog");
    // JSX 用法存在：<EditNameDialog 自闭合标签开始
    const jsx = /<EditNameDialog\s/.exec(PAGE_SRC);
    expect(jsx).not.toBeNull();
    // Props 必须传 currentName（= 初始化 input 默认值用 session.user.name）
    expect(PAGE_SRC).toMatch(/<EditNameDialog[\s\S]{0,120}currentName=/);
  });

  it("按钮文案必须为「编辑ID」或「修改昵称」—— 去子组件源文件（edit-name-dialog.tsx）查验（父组件 page.tsx 只写 JSX 标签不含按钮文本）", () => {
    // 读子组件源文件（和下方 describe 块相同路径；此处再读一次，保证这个 describe 块自给自足）
    const EDIT_NAME = fs.existsSync(
      path.join(ROOT, "src/components/auth/edit-name-dialog.tsx"),
    )
      ? fs.readFileSync(
          path.join(ROOT, "src/components/auth/edit-name-dialog.tsx"),
          "utf-8",
        )
      : "";
    expect(EDIT_NAME).not.toBe("");
    expect(EDIT_NAME).toMatch(/编辑(ID|昵称)|修改(ID|昵称)/);
  });

  it("EditNameDialog 按钮必须与 AvatarUploadDialog 按钮紧邻放置（同一张用户信息卡片 flex 行，距离 ≤ 600 字符）", () => {
    const avatarDlg = /<AvatarUploadDialog\s/.exec(PAGE_SRC);
    const nameDlg = /<EditNameDialog\s/.exec(PAGE_SRC);
    expect(avatarDlg).not.toBeNull();
    expect(nameDlg).not.toBeNull();
    const distance = Math.abs(avatarDlg!.index - nameDlg!.index);
    expect(distance).toBeLessThan(600);
  });

  // ===== ③ 追加站长专属：作品管理快捷操作 =====
  it("必须包含 '作品管理快捷操作' section（方案 A 的 3 个跳转入口）", () => {
    expect(PAGE_SRC).toContain("作品管理快捷操作");
  });

  it("3 个跳转入口必须完整：新增作品 / 管理作品 / 投稿审核", () => {
    expect(PAGE_SRC).toContain('href="/dashboard/posts/new"');
    expect(PAGE_SRC).toContain("新增作品");
    expect(PAGE_SRC).toContain('href="/dashboard/posts"');
    expect(PAGE_SRC).toContain("管理作品");
    expect(PAGE_SRC).toContain('href="/dashboard/moderation"');
    expect(PAGE_SRC).toContain("投稿审核");
  });

  it("'作品管理快捷操作' section 必须被 isAdmin 守卫（普通用户看不到）", () => {
    // 代码里必须出现 `process.env.ADMIN_USER_ID` 或 `isAdmin` 的判断，且包含该 section
    expect(PAGE_SRC).toMatch(/(isAdmin|ADMIN_USER_ID)[\s\S]{0,400}作品管理快捷操作/);
  });
});

describe("Dashboard 个人资料扩展：/api/user/profile PATCH 支持 name + EditNameDialog 组件", () => {
  const PROFILE_API = fs.readFileSync(
    path.join(ROOT, "src/app/api/user/profile/route.ts"),
    "utf-8",
  );
  const EDIT_NAME_SRC = fs.existsSync(
    path.join(ROOT, "src/components/auth/edit-name-dialog.tsx"),
  )
    ? fs.readFileSync(
        path.join(ROOT, "src/components/auth/edit-name-dialog.tsx"),
        "utf-8",
      )
    : "";

  it("PATCH /api/user/profile 必须接受 name 字段：① 解构出 name；② name 长度校验 2-20；③ prisma.user.update 的 data 中包含 name", () => {
    // 解构出 name（跟 image 一并处理）
    expect(PROFILE_API).toMatch(/const\s*\{[^}]*name[^}]*\}\s*=\s*body/);
    // name 长度校验：允许 name.trim().length 或中间变量 trimmedName / $name.length，变量名不限于 name
    //    —— 兼容：`name.trim().length < 2` · `trimmedName.length < 2` · `name.length > 20` 等多种常见写法
    expect(PROFILE_API).toMatch(/(\.length\s*[<>=]+\s*2|\.length\s*[<>=]+\s*20|2\s*[<>=]+\s*[\w$]*\.length|20\s*[<>=]+\s*[\w$]*\.length)/);
    // prisma.update 的 data 中包含 name —— 兼容两种常见写法：
    //   · 内联字面量：prisma.user.update({ data: { name: ... }, select: ... })
    //   · 变量简写：先 const data = { name?: ... }，然后 prisma.user.update({ data, select: ... })
    expect(PROFILE_API).toMatch(/prisma\.user\.update[\s\S]{0,600}(name\s*:|data\.name\s*=)/);
  });

  it("EditNameDialog 组件文件必须存在：① 'use client'；② <input type='text' 昵称输入框；③ fetch('/api/user/profile') method=PATCH 传 name；④ Button 文案为「编辑ID」或「修改昵称」", () => {
    expect(EDIT_NAME_SRC).not.toBe("");
    expect(EDIT_NAME_SRC).toContain("use client");
    expect(EDIT_NAME_SRC).toMatch(/<input[^>]*type\s*=\s*["']text["']/);
    expect(EDIT_NAME_SRC).toMatch(/fetch\s*\(\s*["']\/api\/user\/profile["'][\s\S]{0,120}method\s*:\s*["']PATCH["']/);
    expect(EDIT_NAME_SRC).toMatch(/fetch[\s\S]{0,400}body\s*:\s*JSON\.stringify\([\s\S]{0,80}name\s*:/);
    expect(EDIT_NAME_SRC).toMatch(/编辑(ID|昵称)|修改(ID|昵称)/);
  });
});
