/**
 * UI Mock 组件测试 T-6：聊天抽屉渲染测试
 *
 * 聊天功能已从独立 /chat 页面迁移为全局抽屉（GlobalChatDrawer）
 *
 * 断言：
 *   1. 抽屉渲染达妮娅 topbar（.chat-topbar-name）
 *   2. 抽屉包含会话列表（新会话）与聊天输入区
 *
 * 风格：RTL
 */
/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
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

vi.mock("../src/components/chat/chat-drawer-context", () => ({
  useChatDrawer: () => ({
    open: true,
    openDrawer: vi.fn(),
    closeDrawer: vi.fn(),
    toggleDrawer: vi.fn(),
  }),
}));

describe("AI 聊天 T-6：聊天抽屉渲染", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("6-1. 抽屉渲染达妮娅 topbar 标题", async () => {
    const { GlobalChatDrawer } = await import("../src/components/chat/global-chat-drawer");
    render(<GlobalChatDrawer />);
    expect(screen.getByText("达妮娅", { selector: ".chat-topbar-name" })).toBeInTheDocument();
  });

  it("6-2. 抽屉包含会话列表与输入区域", async () => {
    const { GlobalChatDrawer } = await import("../src/components/chat/global-chat-drawer");
    render(<GlobalChatDrawer />);
    expect(screen.getByText("新会话")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "设置" })).toBeInTheDocument();
  });
});
