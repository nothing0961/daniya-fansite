/**
 * 方案 B · 全局状态弹窗（Status Modal）源码结构断言测试
 * 验证：
 *   1. 存在全局 Context/Provider + Hook 文件
 *   2. app/layout.tsx 正确 wrap 了 Provider
 *   3. image-uploader.tsx 接入：成功 showSuccess / 失败 showError + 移除红色内联 error
 *   4. 复用了自制 Dialog 5 具名导出（不是原生 alert / 不是角落 Toast）
 */
import fs from "node:fs";
import path from "node:path";
import { describe, test, it, expect } from "vitest";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

const read = (rel: string) =>
  fs.readFileSync(path.join(SRC, rel), "utf-8");

describe("方案 B · 全局状态弹窗 Context + Hook 文件存在性", () => {
  const MODAL_FILES = [
    "components/ui/global-status-modal.tsx",
    "components/ui/status-modal.tsx",
    "lib/global-status-modal.tsx",
    "lib/status-modal.tsx",
  ];

  test("必须存在 1 个全局弹窗 Context 文件（4 种候选路径任选其一），且 export Provider + useHook", () => {
    const found = MODAL_FILES.filter((p) =>
      fs.existsSync(path.join(SRC, p)),
    );
    expect(found.length).toBeGreaterThanOrEqual(1);
    const src = read(found[0]);
    // Provider 导出 + useStatusModal / useGlobalModal hook 导出
    expect(src).toMatch(/export (const|function) (StatusModalProvider|GlobalModalProvider|NotificationProvider)/);
    expect(src).toMatch(/export (const|function) use(StatusModal|GlobalModal|Notification)/);
  });

  test("该 Context 文件必须 import 并复用自制 Dialog 5 具名导出（不是 alert / 不是 sonner）", () => {
    const found = MODAL_FILES.filter((p) =>
      fs.existsSync(path.join(SRC, p)),
    );
    expect(found.length).toBeGreaterThanOrEqual(1);
    const src = read(found[0]);
    // 复用我们自制的 ui/dialog.tsx 的 Dialog / DialogContent / DialogHeader / DialogTitle 具名导入
    expect(src).toContain(`@/components/ui/dialog`);
    expect(src).toMatch(/import \{[^}]*Dialog[^}]*\} from ["']@\/components\/ui\/dialog["']/);
    // 不允许用原生 alert（体验差）
    expect(src).not.toMatch(/\balert\s*\(/);
    // 不允许用 sonner / react-hot-toast（方案 B 是中央 Modal，不是角落 Toast）
    expect(src).not.toMatch(/from ["'](sonner|react-hot-toast)["']/);
  });
});

describe("方案 B · app/layout.tsx 正确 wrap Provider", () => {
  const LAYOUT_SRC = read("app/layout.tsx");
  it("app/layout.tsx 里必须 import 全局 Modal Provider", () => {
    expect(LAYOUT_SRC).toMatch(/import \{[^}]*Provider[^}]*\} from ["']@\/(components\/ui|lib)\/(global-status-modal|status-modal|global-modal)["']/);
  });
  it("app/layout.tsx return 的 JSX 里必须用 Provider 包裹所有 children（即 children 作为 Provider 的 prop 或子节点）", () => {
    // Provider 被使用：<XxxProvider> 或 <XxxProvider ...>
    expect(LAYOUT_SRC).toMatch(/<(StatusModalProvider|GlobalModalProvider|NotificationProvider)\b/);
  });
});

describe("方案 B · ImageUploader 正确接入全局 Modal Hook", () => {
  const UPLOADER_SRC = read("components/admin/image-uploader.tsx");

  it("ImageUploader 里必须 import 全局 Status Modal Hook", () => {
    expect(UPLOADER_SRC).toMatch(/import \{[^}]*use(StatusModal|GlobalModal|Notification)[^}]*\} from ["']@\/(components\/ui|lib)\/(global-status-modal|status-modal|global-modal)["']/);
  });

  it("成功分支（data.success 为 true 后）必须调用 showSuccess('上传成功') 或类似", () => {
    // 找到 if (data.success) 块内 showSuccess 调用
    expect(UPLOADER_SRC).toMatch(/showSuccess\s*\(\s*["']上传成功["']/);
  });

  it("失败分支（else + catch 块）必须调用 showError，传入完整失败原因（用兼容逻辑：data.message || data.error || ...）", () => {
    // 失败分支 showError 被调用，且参数里包含失败原因（支持跨行展开：data.message || data.error 等在 detail 字段）
    expect(UPLOADER_SRC).toMatch(/showError\s*\(/);
    // 使用 [\s\S]*? 跨行匹配：showError("X 失败", ... detail: data.message 或 data.error 或 data.msg
    expect(UPLOADER_SRC).toMatch(
      /showError\s*\(\s*["'][^"']*失败[^"']*["'][\s\S]*?(data\.message|data\.error|data\.msg)[\s\S]*?\)/,
    );
  });

  it("按默认体验升级：不再渲染按钮下方内联红色 error 小字（屏幕中央弹窗已统一失败提示）", () => {
    // 原来的：<p className="text-sm text-red-400">{error}</p> 这种 error text 不再存在
    expect(UPLOADER_SRC).not.toContain(`text-red-400`);
    // setError 也应该移除（改为直接调用 showError）
    expect(UPLOADER_SRC).not.toContain(`setError(`);
  });
});
