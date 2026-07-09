/**
 * UI Mock 组件测试 T-5：点 FAB 弹出 Dialog，内含输入框 + 发送按钮
 *
 * 断言：
 *   1. data-testid="chat-dialog" 容器初始不可见
 *   2. 点击 FAB 后，chat-dialog 出现
 *   3. Dialog 内必须有 <textarea data-testid="chat-input"> 输入框（多行，Enter 发送/Shift+Enter 换行）
 *   4. Dialog 内必须有 data-testid="chat-send-btn" 发送按钮（纸飞机图标或「发送」文案）
 *   5. Dialog 顶部标题区含「达妮娅」文字
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

// 组件内 useSession 来自 next-auth/react（官方包），需 mock 此处
vi.mock("next-auth/react", () => ({
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

// Vercel "ai" 包 useChat 轻量 mock（空壳，不做真实请求）
vi.mock("ai", () => ({
  useChat: () => ({
    messages: [],
    input: "",
    setInput: vi.fn(),
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    append: vi.fn(),
    isLoading: false,
    error: null,
    reload: vi.fn(),
    stop: vi.fn(),
    setMessages: vi.fn(),
  }),
}));

describe("AI 聊天 T-5：点 FAB 弹出 Dialog + 输入区组件", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("5-1. daniya-chat-fab.tsx 文件存在", () => {
    expect(fs.existsSync(COMPONENT_PATH)).toBe(true);
  });

  it("5-2. 初始：Dialog 不可见", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    expect(screen.queryByTestId("chat-dialog")).not.toBeInTheDocument();
  });

  it("5-3. 点击 FAB 后：Dialog 出现，并含达妮娅标题", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    const user = userEvent.setup();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    const btn = screen.getByTestId("chat-fab-button");
    await user.click(btn);
    const dialog = await screen.findByTestId("chat-dialog");
    expect(dialog).toBeInTheDocument();
    // 标题含「达妮娅」
    expect(dialog.textContent).toMatch(/达\s*妮\s*娅/);
  });

  it("5-4. Dialog 内必须含 textarea 输入框（chat-input）+ 发送按钮（chat-send-btn）", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    const user = userEvent.setup();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    await user.click(screen.getByTestId("chat-fab-button"));
    const dialog = await screen.findByTestId("chat-dialog");
    expect(dialog.querySelector("[data-testid='chat-input']")).not.toBeNull();
    expect(dialog.querySelector("[data-testid='chat-send-btn']")).not.toBeNull();
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
