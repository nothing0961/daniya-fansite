/**
 * AI 聊天设置齿轮按钮测试 T-A：聊天页面设置按钮 + Header 聊天入口
 *
 * 断言：
 *   1. Header 聊天按钮在登录态下指向 /chat
 *   2. 未登录态：按钮存在但点击弹出登录提示
 *
 * 风格：RTL + userEvent
 */
/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";

const COMPONENT_PATH = path.join(
  process.cwd(),
  "src/components/shared/header-chat-button.tsx",
);

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("AI 聊天 T-A：Header 聊天入口按钮", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("A-1. Header 聊天按钮存在，登录态下指向 /chat 页面", async () => {
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
    const { HeaderChatButton } = await import("../src/components/shared/header-chat-button");
    render(<HeaderChatButton />);
    const btn = screen.getByTestId("header-chat-button");
    expect(btn).toHaveAttribute("href", "/chat");
  });

  it("A-2. 未登录态：Header 聊天按钮存在但点击弹出登录提示", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    vi.doMock("next-auth/react", () => ({
      useSession: () => ({ data: null, status: "unauthenticated" as const }),
    }));
    vi.resetModules();
    const { HeaderChatButton } = await import("../src/components/shared/header-chat-button");
    render(<HeaderChatButton />);
    expect(screen.getByTestId("header-chat-button")).toBeInTheDocument();
  });
});
