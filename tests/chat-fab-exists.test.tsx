/**
 * UI Mock 组件测试 T-4：Header AI 聊天入口按钮存在
 *
 * 断言：
 *   1. src/components/shared/header-chat-button.tsx 文件存在
 *   2. 渲染后 DOM 中存在 data-testid="header-chat-button" 的可点击按钮
 *   3. 按钮内包含聊天语义图标或 aria-label
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
  "src/components/shared/header-chat-button.tsx",
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" as const }),
}));

describe("AI 聊天 T-4：Header 聊天入口按钮", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("4-1. header-chat-button.tsx 组件文件存在", () => {
    expect(fs.existsSync(COMPONENT_PATH)).toBe(true);
  });

  it("4-2. 渲染组件后，存在 data-testid='header-chat-button' 的可点击按钮", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) {
      expect(true).toBe(false);
      return;
    }
    const { HeaderChatButton } = await import(
      "../src/components/shared/header-chat-button"
    );
    render(<HeaderChatButton />);
    expect(screen.getByTestId("header-chat-button")).toBeInTheDocument();
  });

  it("4-3. 按钮内含聊天语义：aria-label 含「达妮娅聊天」或图标 path", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) {
      expect(true).toBe(false);
      return;
    }
    const src = fs.readFileSync(COMPONENT_PATH, "utf-8");
    const hasChatSemantic =
      /data-testid=["']header-chat-button["'][\s\S]{0,500}(💬|MessageCircle|💭|聊\s*天|对\s*话|chat|message)/i.test(
        src + (screen.queryByTestId("header-chat-button")?.outerHTML ?? ""),
      ) || /(aria-label|title)\s*=\s*["'][^"']*(聊天|对话|达妮娅聊)[^"']*["']/.test(src);
    expect(hasChatSemantic).toBe(true);
  });
});
