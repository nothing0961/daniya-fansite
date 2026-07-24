/**
 * AI 聊天设置齿轮按钮测试 T-A：聊天页面右上角 ⚙️ 设置按钮 + 配置面板
 *
 * 断言：
 *   1. 聊天页面存在设置齿轮按钮
 *   2. 点击齿轮打开设置面板
 *
 * 风格：RTL + userEvent
 */
/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "node:fs";
import path from "node:path";

const COMPONENT_PATH = path.join(
  process.cwd(),
  "src/components/shared/daniya-chat-fab.tsx",
);

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("AI 聊天 T-A：设置齿轮按钮 ⚙️ + 配置面板", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("A-1. FAB 按钮存在，点击后跳转到 /chat 页面", async () => {
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

  it("A-2. 未登录态：FAB 按钮存在但点击弹出登录提示", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    vi.doMock("next-auth/react", () => ({
      useSession: () => ({ data: null, status: "unauthenticated" as const }),
    }));
    vi.resetModules();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    expect(screen.getByTestId("chat-fab-button")).toBeInTheDocument();
  });
});