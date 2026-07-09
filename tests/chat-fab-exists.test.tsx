/**
 * UI Mock 组件测试 T-4：聊天 FAB 悬浮按钮存在
 *
 * 断言：
 *   1. src/components/shared/daniya-chat-fab.tsx 文件存在
 *   2. 渲染后 DOM 中存在 data-testid="chat-fab-button" 的可点击按钮
 *   3. 按钮内包含「💬」/ MessageCircle / 消息气泡 图标或文案（语义明确是聊天入口）
 *
 * 风格：RTL（@testing-library/react）
 */
/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";

const COMPONENT_PATH = path.join(
  process.cwd(),
  "src/components/shared/daniya-chat-fab.tsx",
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// 组件里的 useSession 来自 next-auth/react（官方包），mock 它即可
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" as const }),
}));

// Vercel "ai" 包 useChat 轻量 mock（空壳就行，不做真实请求）
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

describe("AI 聊天 T-4：FAB 悬浮聊天入口（右下角）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("4-1. daniya-chat-fab.tsx 组件文件存在", () => {
    expect(fs.existsSync(COMPONENT_PATH)).toBe(true);
  });

  it("4-2. 渲染组件后，存在 data-testid='chat-fab-button' 的可点击按钮", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) {
      expect(true).toBe(false);
      return;
    }
    const { default: DaniyaChatFAB } = await import(
      "../src/components/shared/daniya-chat-fab"
    );
    render(<DaniyaChatFAB />);
    expect(screen.getByTestId("chat-fab-button")).toBeInTheDocument();
  });

  it("4-3. FAB 按钮内含聊天语义图标：💬 emoji 或 MessageCircle 图标 class/aria-label 含 聊天/对话 等关键词", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) {
      expect(true).toBe(false);
      return;
    }
    const src = fs.readFileSync(COMPONENT_PATH, "utf-8");
    const hasChatSemantic =
        /data-testid=["']chat-fab-button["'][\s\S]{0,500}(💬|MessageCircle|💭|聊\s*天|对\s*话|chat|message)/i.test(
          src + (screen.queryByTestId("chat-fab-button")?.outerHTML ?? ""),
        ) || /(aria-label|title)\s*=\s*["'][^"']*(聊天|对话|达妮娅聊)[^"']*["']/.test(src);
    expect(hasChatSemantic).toBe(true);
  });
});
