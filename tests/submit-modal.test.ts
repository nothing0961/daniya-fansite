/**
 * 提交审核弹窗（方案 A-1 分级错误）源码结构断言测试
 *
 * 覆盖：
 *   1. StatusModal showSuccess 支持 opts 参数（autoClose + onDismiss 回调）
 *   2. PostForm 接入 useStatusModal
 *   3. 成功分支 showSuccess("提交成功，等待审核", autoClose:false + onDismiss: TODO 我的上传占位）
 *   4. 失败分支 showError("提交失败，请再检查" + 分级错误映射）
 *   5. 存在错误分级映射（🟢用户级显示具体 / 🔴系统级隐藏细节）
 *   6. 已删 errors._form 顶部红色横条（失败中央弹窗统一显示）
 *   7. 字段级校验 setErrors 保留（字段下方小字仍显示）
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

const read = (rel: string) =>
  fs.readFileSync(path.join(SRC, rel), "utf-8");

describe("方案 A-1 · StatusModal showSuccess 升级（支持 opts：autoClose + onDismiss）", () => {
  const SM = read("components/ui/status-modal.tsx");

  it("showSuccess 支持第二个 options 参数（而非只有 message 可选字符串）", () => {
    // showSuccess 签名要支持 opts: { autoClose?; onDismiss? } 形式
    expect(SM).toMatch(
      /showSuccess\s*=\s*React\.useCallback\s*\(\s*\(\s*title[^,]*,\s*(opts|options)\s*[?]?\s*[:?]/,
    );
  });

  it("showSuccess 的 opts 中包含 autoClose 字段（支持 false 永不自动关 / 数字自定义毫秒）", () => {
    expect(SM).toMatch(/\bautoClose\b/);
  });

  it("showSuccess 的 opts 中包含 onDismiss 回调（关闭弹窗时触发，用于跳转" +
     "我的上传页面）", () => {
    expect(SM).toMatch(/\bonDismiss\b/);
  });

  it("成功弹窗 UI：当 autoClose === false（必须手动关）时，显示「知道了」按钮", () => {
    // autoClose !== true（=false 或数字？）也要在关闭按钮/知道了时触发 onDismiss
    expect(SM).toMatch(/state\.type\s*===\s*["']success["'][\s\S]*?知道了/);
  });

  it("保持上传成功默认行为不变（不传 opts 时仍然 1.5 秒自动关闭，不破坏 ImageUploader）", () => {
    expect(SM).toMatch(/SUCCESS_AUTO_CLOSE_MS\s*=\s*1500/);
  });
});

describe("方案 A-1 · PostForm 接入 StatusModal + 成功分支", () => {
  const PF = read("components/admin/post-form.tsx");

  it("PostForm 中 import 了 useStatusModal Hook", () => {
    expect(PF).toContain(`@/components/ui/status-modal`);
    expect(PF).toMatch(/import \{[^}]*useStatusModal[^}]*\} from ["']@\/components\/ui\/status-modal["']/);
  });

  it("成功分支调用 showSuccess(\"提交成功，等待审核\", ...) 并传了 autoClose:false（必须手动关）", () => {
    expect(PF).toMatch(/showSuccess\s*\(\s*["']提交成功，等待审核["'][\s\S]*?autoClose\s*:\s*false/);
  });

  it("成功 onDismiss 回调中：① 有「TODO / 我的上传 / my-submissions / 我的投稿 /dashboard/submissions」（占位注释或真实跳转路径均可）；② submit 模式下新建投稿不直接 router.push(successRedirect)（而是走 showSuccess + onDismiss，关弹窗后跳）", () => {
    // 必须出现"我的投稿"相关关键词（早期是 TODO 占位，后期变成真实 router.push('/dashboard/submissions')）
    expect(PF).toMatch(/(TODO|我的上传|my-submissions|我的投稿|dashboard\/submissions)/);
    // submit 模式新建投稿的分流分支必须存在（优先级在默认 router.push 之上）
    expect(PF).toMatch(
      /else\s+if\s*\(\s*mode\s*===\s*["']submit["']\s*&&\s*!isEdit\s*\)\s*\{/,
    );
  });
});

describe("方案 A-1 · PostForm 失败分支（分级错误 A-1 + 删顶部红色横条）", () => {
  const PF = read("components/admin/post-form.tsx");
  // 错误分级映射函数可能放在单独文件或 post-form 内部；我们先找全局
  const libFiles = [
    "lib/submit-error-classifier.ts",
    "lib/error-classifier.ts",
    "components/admin/submit-error-classifier.ts",
  ];
  const classifierInLib = libFiles.find((p) => fs.existsSync(path.join(SRC, p)));
  const classifierSource = classifierInLib
    ? read(classifierInLib)
    : PF; // 没独立文件就写在 post-form 内部

  it("存在「错误分级映射函数」（独立文件或 post-form 内部）：name 包含 classify", () => {
    expect(classifierSource).toMatch(/(export\s+)?(function|const)\s+\w*(classify|Classify)\w*/);
  });

  it("分级映射函数至少区分两类：① 🟢用户级（关键词：标题/简介/BV/标签/限流/图片张数/额度/审核/格式 等 → 保留原错误 detail）；② 🔴系统级（关键词：Prisma|Neon|database|500|服务器|ImgToken|写入失败|数据库 → 返回通用系统维护中）", () => {
    // 🟢用户级关键词识别
    expect(classifierSource).toMatch(/(标题|简介|BV|标签|限流|图片.*张|额度|格式|至少.*张|不能为空|不超过|最多)/);
    // 🔴系统级关键词识别
    expect(classifierSource).toMatch(/(Prisma|Neon|database|500|服务器|ImgToken|数据库|写入失败|系统维护)/);
  });

  it("系统级错误时 detail 不直接输出原 error；而是提示「系统维护中，请稍后再试」等通用人话", () => {
    expect(classifierSource).toMatch(/系统维护中/);
  });

  it("HTTP 非 2xx 分支 & catch 分支：改用 showError(\"提交失败，请再检查\", { detail: 分级后的 detail })；不再使用 setErrors({ _form }) 设置全局表单错误", () => {
    // showError 标题正确
    expect(PF).toMatch(/showError\s*\(\s*["']提交失败，请再检查["']/);
    // 不再 setErrors({ _form: ... })（两个分支：res.ok=false & catch）
    const formErrorMatches = PF.match(/setErrors\s*\(\s*\{\s*_form\s*:/g) || [];
    expect(formErrorMatches.length).toBe(0);
  });

  it("已删除 L244-L248 的 errors._form 顶部红色横条渲染（失败原因统一在屏幕中央弹窗，不再重复显示）", () => {
    expect(PF).not.toMatch(
      /errors\._form\s*&&\s*\(\s*<div className=["'][^"']*border-red-500/,
    );
    expect(PF).not.toContain("errors._form");
  });

  it("字段级校验失败保留 setErrors(fieldErrors) 逻辑（字段下方红色小字仍显示，不弹全局弹窗，避免打扰填表）", () => {
    expect(PF).toContain("setErrors(fieldErrors)");
  });
});
