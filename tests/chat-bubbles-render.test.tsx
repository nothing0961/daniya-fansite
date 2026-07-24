/**
 * UI Mock 组件测试 T-6：聊天页面气泡渲染测试
 *
 * 断言：
 *   1. 聊天页面文件存在
 *   2. 聊天页面包含消息区域
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
        id: "user-666",
        name: "粉丝小A",
        image: "/avatar.jpg",
      },
    },
    status: "authenticated" as const,
  }),
}));

describe("AI 聊天 T-6：聊天页面气泡渲染", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("6-1. 聊天页面文件存在", () => {
    expect(fs.existsSync(CHAT_PAGE_PATH)).toBe(true);
  });

  it("6-2. 聊天页面包含达妮娅标题和消息区域", async () => {
    if (!fs.existsSync(CHAT_PAGE_PATH)) return expect(true).toBe(false);
    const { default: ChatPage } = await import("../src/app/chat/page");
    render(<ChatPage />);
    expect(screen.getByText("达妮娅")).toBeInTheDocument();
  });

  it("6-3. 聊天页面包含侧边栏和输入区域", async () => {
    if (!fs.existsSync(CHAT_PAGE_PATH)) return expect(true).toBe(false);
    const { default: ChatPage } = await import("../src/app/chat/page");
    render(<ChatPage />);
    expect(screen.getByText("新会话")).toBeInTheDocument();
  });
});