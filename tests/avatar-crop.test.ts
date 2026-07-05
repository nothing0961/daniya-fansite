import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, "$1")), "..");
const UPLOAD_SRC = fs.readFileSync(
  path.join(ROOT, "src/components/auth/avatar-upload-dialog.tsx"),
  "utf-8"
);
const PKG = JSON.parse(
  fs.readFileSync(path.join(ROOT, "package.json"), "utf-8")
);

/**
 * 头像裁剪弹窗：
 * 流程：点击更换头像 → 选择图片 → **弹裁剪弹窗（1:1 比例）** → 确认裁剪后才上传。
 * 核心原则（来自经验 447309）：upload API 只出现在「确认裁剪」的回调里。
 */
describe("AvatarUploadDialog 头像裁剪功能（选择图片后弹出裁剪，确认裁剪后才上传）", () => {

  it("1) 依赖库已安装：package.json dependencies 中包含 react-easy-crop", () => {
    expect(Object.keys(PKG.dependencies ?? {})).toContain("react-easy-crop");
  });

  it("2) avatar-upload-dialog.tsx 已引入 Cropper 组件：import 语句中出现 react-easy-crop", () => {
    expect(UPLOAD_SRC).toMatch(/from\s+["']react-easy-crop["']/);
  });

  it("3) JSX 中实际渲染了 <Cropper 组件（不是只 import 没用到）", () => {
    expect(UPLOAD_SRC).toMatch(/<Cropper\b/);
  });

  it("4) Cropper 必须按 1:1 比例裁剪（头像为圆形/正方形 1:1）：aspect={1} 或 aspect={1/1}", () => {
    expect(UPLOAD_SRC).toMatch(/<Cropper[\s\S]{0,200}aspect\s*=\s*\{?\s*1(\s*\/\s*1)?\s*\}?/);
  });

  it("5) handleFileSelect 不再直接调用 upload(file)（选择文件后只准备裁剪源，立即上传是旧逻辑）", () => {
    // 精确截取 handleFileSelect 函数体本身：从它定义开始，到它后面第一个 2 空格 + }（组件函数内部缩进 2 级的闭合大括号，区别于 4 空格级 if/try 内部块）
    const start = UPLOAD_SRC.indexOf("function handleFileSelect");
    expect(start).toBeGreaterThan(-1);
    const end = UPLOAD_SRC.indexOf("\n  }\n", start + 50);  // 第一个 2 空格级闭合括号 = 该函数自身结束
    expect(end).toBeGreaterThan(start + 50);
    const fnScope = UPLOAD_SRC.slice(start, end);
    // handleFileSelect 函数体内（只包含它自己）不应有 upload( 调用
    expect(fnScope).not.toMatch(/\b(?:void\s+)?(?:await\s+)?upload\s*\(/);
  });

  it("6) handleFileSelect 里必须设置裁剪图片源的状态（setCropImageSrc / setImageToCrop 等命名）——说明进入裁剪流程", () => {
    const start = UPLOAD_SRC.indexOf("function handleFileSelect");
    expect(start).toBeGreaterThan(-1);
    const end = UPLOAD_SRC.indexOf("\n  }\n", start + 50);
    expect(end).toBeGreaterThan(start + 50);
    const fnScope = UPLOAD_SRC.slice(start, end);
    expect(fnScope).toMatch(/set(CropImageSrc|ImageSrc|ImageToCrop|CropSource)\s*\(/);
  });

  it("7) 上传动作 upload(...) 必须出现在「确认裁剪」的回调函数里（如 handleConfirmCrop / onCropConfirm），说明只有用户点击确认才上传", () => {
    const start = UPLOAD_SRC.indexOf("handleConfirmCrop");
    expect(start).toBeGreaterThan(-1);
    // handleConfirmCrop 函数体从 { 开始到它自身的闭合 2 空格级 } 结束
    const bodyStart = UPLOAD_SRC.indexOf("{", start);
    expect(bodyStart).toBeGreaterThan(start);
    const end = UPLOAD_SRC.indexOf("\n  }\n", bodyStart + 10); // 第一个 2 空格级闭合
    expect(end).toBeGreaterThan(bodyStart + 30);
    const confirmFnBody = UPLOAD_SRC.slice(start, end);
    // 确认裁剪函数体中必须调用 upload
    expect(confirmFnBody).toMatch(/\b(?:void\s+)?(?:await\s+)?upload\s*\(/);
  });

  /* ====== 8-9：「选择图片」按钮胶囊样式（小胶囊 + 粉色） ====== */

  it("8) 初始界面「选择图片」按钮必须是小胶囊样式（rounded-full 类表明两端完全圆角的胶囊外观）", () => {
    // 定位初始界面中「选择图片」按钮（cropImageSrc 为空时渲染的 Button，textContent 含「选择图片」）
    // 查 Button 组件里匹配选择图片的那一行附近的 className（放宽到 900，粉色长 className 可能超 400）
    const btnMatch = UPLOAD_SRC.match(
      /<Button[\s\S]{0,900}?选择图片[\s\S]{0,120}?<\/Button>/
    );
    expect(btnMatch).not.toBeNull();
    // 该按钮必须含 rounded-full 类（胶囊=两端完全圆角）
    expect(btnMatch![0]).toMatch(/\brounded-full\b/);
  });

  it("9) 「选择图片」按钮必须是粉色配色（包含 Tailwind pink-* 类或引用 --primary 粉色变量 / pink 色）", () => {
    const btnMatch = UPLOAD_SRC.match(
      /<Button[\s\S]{0,900}?选择图片[\s\S]{0,120}?<\/Button>/
    );
    expect(btnMatch).not.toBeNull();
    const btnClass = btnMatch![0];
    // 粉色判定：pink-*（Tailwind）或 bg-[var(--primary)]（CSS 变量粉紫色）/ text-pink / border-pink 任一
    const hasPink =
      /\bpink-\d+\b/.test(btnClass) ||
      /\b(?:bg|text|border)-(?:pink\[|pink-|var\(--primary[^\]]*\])/.test(btnClass) ||
      /\[--primary\]/.test(btnClass);
    expect(hasPink).toBe(true);
  });

});
