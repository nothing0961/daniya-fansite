/**
 * 第八波 · 投稿页额度显示卡片 + 上传后实时刷新（方案A·Server 直读 + router.refresh）
 *
 * 源码结构断言（8 条）：
 * 1) submit/page.tsx 导入限流 4 项（SITE_DAILY_LIMIT / USER_DAILY_LIMIT / getSiteTodayUploadCount / getUserTodayUploadCount）
 * 2) submit/page.tsx 渲染「今日额度」卡片（含 全站剩余 / 我的剩余 两条文案）
 * 3) submit/page.tsx 给 PostForm 传了 refreshQuotaOnUpload={true}（boolean prop，Server→Client 可序列化）
 * 4) image-uploader.tsx Props 接口新增 onUploadSuccess?: () => void 可选回调
 * 5) image-uploader.tsx 上传成功分支（data.success === true）在 showSuccess 后调用 onUploadSuccess?.()
 * 6) post-form.tsx Props 接口新增 refreshQuotaOnUpload?: boolean 可选
 * 7) post-form.tsx 构造上传成功回调：refreshQuotaOnUpload 为真时，传 () => router.refresh() 给 ImageUploader
 * 8) image-uploader.tsx 的 onUploadSuccess 调用不破坏 showSuccess 的逻辑（两者都存在）
 */

import { describe, test, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
function readFile(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf-8");
}

describe("第八波 · 投稿页额度卡片 + 上传后实时刷新", () => {
  let submitPage: string;
  let imageUploader: string;
  let postForm: string;

  beforeAll(() => {
    submitPage = readFile("src/app/submit/page.tsx");
    imageUploader = readFile("src/components/admin/image-uploader.tsx");
    postForm = readFile("src/components/admin/post-form.tsx");
  });

  // 1) submit/page.tsx 导入限流 4 项
  test("submit/page.tsx 导入 SITE_DAILY_LIMIT / USER_DAILY_LIMIT / getSiteTodayUploadCount / getUserTodayUploadCount", () => {
    expect(submitPage).toMatch(/import\s*\{[^}]*SITE_DAILY_LIMIT[^}]*\}\s*from\s*["']@\/lib\/upload-rate-limit["']/);
    expect(submitPage).toMatch(/USER_DAILY_LIMIT/);
    expect(submitPage).toMatch(/getSiteTodayUploadCount/);
    expect(submitPage).toMatch(/getUserTodayUploadCount/);
  });

  // 2) submit/page.tsx 渲染「今日额度」卡片（含全站剩余 / 我的剩余 两条文案）
  test("submit/page.tsx 渲染「今日额度」卡片（含 全站剩余 / 我的剩余 文案）", () => {
    expect(submitPage).toMatch(/今日额度|额度/);
    expect(submitPage).toMatch(/全站|站点/);
    expect(submitPage).toMatch(/(我的|个人|用户).*(剩余|额度)/);
    expect(submitPage).toMatch(/(剩余|还能|还有).*(张|上传)/);
  });

  // 3) submit/page.tsx 给 PostForm 传了 refreshQuotaOnUpload={true}
  test("submit/page.tsx 给 PostForm 传 refreshQuotaOnUpload boolean prop", () => {
    // 匹配 <PostForm ... refreshQuotaOnUpload ... /> 结构
    expect(submitPage).toMatch(/<PostForm[\s\S]*?refreshQuotaOnUpload[\s\S]*?\/>/);
    expect(submitPage).toMatch(/refreshQuotaOnUpload\s*=\s*\{?\s*true\s*\}?/);
  });

  // 4) image-uploader.tsx Props 接口新增 onUploadSuccess?: () => void
  test("image-uploader.tsx Props 接口包含 onUploadSuccess 可选回调", () => {
    expect(imageUploader).toMatch(/interface\s+ImageUploaderProps[\s\S]*?onUploadSuccess\s*\?\s*:\s*\(\s*\)\s*=>\s*void/);
  });

  // 5) image-uploader.tsx 上传成功后在 showSuccess 之后调用 onUploadSuccess?.()
  test("image-uploader.tsx 上传成功分支调用 onUploadSuccess?.() 且 showSuccess 仍存在", () => {
    // 找到 data.success 分支
    const successBlock = imageUploader.match(/if\s*\(\s*data\.success\s*\)\s*\{[\s\S]*?\n\s*\}/)?.[0] ?? "";
    expect(successBlock.length).toBeGreaterThan(10);
    expect(successBlock).toMatch(/showSuccess\s*\(\s*["']上传成功["']\s*\)/);
    expect(successBlock).toMatch(/onUploadSuccess\s*\?\.\s*\(\s*\)/);
  });

  // 6) post-form.tsx Props 接口新增 refreshQuotaOnUpload?: boolean
  test("post-form.tsx Props 接口包含 refreshQuotaOnUpload 可选 boolean", () => {
    expect(postForm).toMatch(/interface\s+PostFormProps[\s\S]*?refreshQuotaOnUpload\s*\?\s*:\s*boolean/);
  });

  // 7) post-form.tsx 构造上传成功回调并传给 ImageUploader
  test("post-form.tsx refreshQuotaOnUpload=true 时传 router.refresh() 给 ImageUploader", () => {
    // 构造回调的代码（至少包含 refreshQuotaOnUpload 和 router.refresh 两个关键词）
    expect(postForm).toMatch(/refreshQuotaOnUpload[\s\S]{0,200}router\.refresh/);
    // ImageUploader 组件上有 onUploadSuccess prop 传递
    expect(postForm).toMatch(/<ImageUploader[\s\S]*?onUploadSuccess\s*=/);
  });

  // 8) image-uploader.tsx showSuccess 与 onUploadSuccess 都调用（互不破坏）
  test("image-uploader.tsx onUploadSuccess 不替代 showSuccess，两者都被调用", () => {
    // showSuccess 至少被调用 1 次
    expect((imageUploader.match(/showSuccess\s*\(/g) ?? []).length).toBeGreaterThanOrEqual(1);
    // onUploadSuccess?.() 调用 1 次
    expect((imageUploader.match(/onUploadSuccess\s*\?\.\s*\(\s*\)/g) ?? []).length).toBe(1);
  });
});
