/**
 * UI Mock 组件测试 T-5：点 FAB 跳转到聊天页面
 *
 * 断言：
 *   1. daniya-chat-fab.tsx 文件存在
 *   2. 登录态：FAB 按钮是 Link 链接，指向 /chat
 *   3. 未登录态：点击 FAB 弹出登录提示 Dialog
 *   4. 源码层面使用 shadcn/ui Dialog 组件
 *
 * 风格：RTL + userEvent
 */
/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "node:fs";
import path from "node:path";

const COMPONENT_PATH = path.join(
  process.cwd(),
  "src/components/shared/daniya-chat-fab.tsx",
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("AI 聊天 T-5：点 FAB 跳转到聊天页面", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("5-1. daniya-chat-fab.tsx 文件存在", () => {
    expect(fs.existsSync(COMPONENT_PATH)).toBe(true);
  });

  it("5-2. 登录态：FAB 按钮是 Link 链接，指向 /chat", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    vi.doMock("next-auth/react", () => ({
      useSession: () => ({
        data: {
          user: {
            id: "test-user-id",
            name: "测试用户",
            image: "/avatar-cropped.jpg",
          },
        },
        status: "authenticated" as const,
      }),
    }));
    vi.resetModules();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    const btn = screen.getByTestId("chat-fab-button");
    expect(btn).toHaveAttribute("href", "/chat");
  });

  it("5-3. 未登录态：点击 FAB 弹出登录提示 Dialog，含达妮娅标题", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    vi.doMock("next-auth/react", () => ({
      useSession: () => ({ data: null, status: "unauthenticated" as const }),
    }));
    vi.resetModules();
    const user = userEvent.setup();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    await user.click(screen.getByTestId("chat-fab-button"));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog.textContent).toMatch(/达\s*妮\s*娅/);
  });

  it("5-4. 未登录 Dialog 内含登录引导和去登录按钮", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    vi.doMock("next-auth/react", () => ({
      useSession: () => ({ data: null, status: "unauthenticated" as const }),
    }));
    vi.resetModules();
    const user = userEvent.setup();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    await user.click(screen.getByTestId("chat-fab-button"));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toMatch(/登录/);
    expect(dialog.querySelector("a[href='/login']")).not.toBeNull();
  });

  it("5-5. 源码层面必须使用 shadcn/ui Dialog 组件（与项目其他弹窗风格统一）", () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(COMPONENT_PATH, "utf-8");
    const usesProjectDialog =
      /from\s+["']@\/components\/ui\/dialog["']/.test(src) &&
      /<Dialog\s/.test(src);
    expect(usesProjectDialog).toBe(true);
  });
});