/**
 * AI 聊天连接测试 + 协议提示测试 T-D
 *
 * 由于聊天功能已迁移到独立页面，此测试文件验证新的聊天页面结构
 *
 * 风格：RTL
 */
/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";

const CHAT_PAGE_PATH = path.join(
  process.cwd(),
  "src/app/chat/page.tsx",
);

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

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

describe("AI 聊天 T-D：新聊天页面结构验证", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("D-1. 聊天页面文件存在", () => {
    expect(fs.existsSync(CHAT_PAGE_PATH)).toBe(true);
  });

  it("D-2. 聊天页面包含侧边栏、消息区域和输入区域", async () => {
    if (!fs.existsSync(CHAT_PAGE_PATH)) return expect(true).toBe(false);
    const { default: ChatPage } = await import("../src/app/chat/page");
    render(<ChatPage />);
    expect(screen.getByText("达妮娅")).toBeInTheDocument();
    expect(screen.getByText("新会话")).toBeInTheDocument();
  });

  it("D-3. FAB 按钮在登录态下指向 /chat", async () => {
    const COMPONENT_PATH = path.join(
      process.cwd(),
      "src/components/shared/daniya-chat-fab.tsx",
    );
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
});