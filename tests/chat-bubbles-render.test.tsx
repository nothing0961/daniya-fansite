/**
 * UI Mock 组件测试 T-6：发送消息后，左右气泡（用户→右、达妮娅→左）先后正确渲染
 *
 * 断言：
 *   1. mock Vercel ai 包 useChat() 返回固定 messages + append 方法
 *   2. 预置 1 条用户侧消息后，渲染出用户气泡（data-testid="chat-bubble-user"，靠右）
 *   3. 预置 1 条 AI 侧消息后，渲染出 AI 气泡（data-testid="chat-bubble-ai"，靠左，含达妮娅头像或头像容器）
 *   4. 气泡内容里：AI 回复 ≤ 50 字（符合 T-3 短回复要求）
 *
 * 风格：RTL + vi.mock("ai", ...) — 用预置 messages 直接渲染，避免 mock 非响应式
 */
/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "node:fs";
import path from "node:path";
import React from "react";

const COMPONENT_PATH = path.join(
  process.cwd(),
  "src/components/shared/daniya-chat-fab.tsx",
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// 组件内 useSession 来自 next-auth/react（官方包），mock 此处（已登录态，方便测试发消息）
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

// 核心：mock Vercel "ai" 包 useChat()，返回可控的 messages/append/isLoading
let mockMessages: { id: string; role: "user" | "assistant"; content: string }[] = [];
const appendMock = vi.fn(async (msg: { role: "user"; content: string }) => {
  // 立即 push 用户消息，500ms 后 push AI 短回复（模拟打字机）
  mockMessages = [...mockMessages, { id: "u1", role: "user", content: msg.content }];
  await new Promise((r) => setTimeout(r, 200));
  mockMessages = [
    ...mockMessages,
    { id: "a1", role: "assistant", content: "你好呀~一起吃蛋糕？🍰" },
  ];
});

vi.mock("ai", () => ({
  useChat: () => ({
    messages: mockMessages,
    input: "",
    setInput: vi.fn(),
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn((e?: React.FormEvent) => {
      e?.preventDefault();
      // 真实组件会用 useChat 的 input 值，这里我们手动让组件触发 append
      return appendMock({ role: "user", content: "达妮娅你好" });
    }),
    append: appendMock,
    isLoading: false,
    error: null,
    reload: vi.fn(),
    stop: vi.fn(),
    setMessages: vi.fn(),
  }),
}));

describe("AI 聊天 T-6：发送消息后左右气泡正确渲染（含头像、短回复）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMessages = [];
  });

  it("6-1. 组件文件存在", () => {
    expect(fs.existsSync(COMPONENT_PATH)).toBe(true);
  });

  it("6-2. 预置 1 条用户消息后，Dialog 内渲染出用户侧气泡（chat-bubble-user，靠右，内容匹配）", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    // 渲染前预置 mock messages：1 条 user 消息（useChat mock 直接返回这段数组）
    mockMessages = [
      { id: "u1", role: "user", content: "达妮娅你好" },
    ];
    const user = userEvent.setup();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    await user.click(screen.getByTestId("chat-fab-button"));
    await screen.findByTestId("chat-dialog");
    // 必须出现用户侧气泡
    const userBubble = await waitFor(
      () => screen.getByTestId("chat-bubble-user"),
      { timeout: 1500 },
    );
    expect(userBubble).toBeInTheDocument();
    // 靠右：justify-end / text-right / ml-auto 任一
    expect(
      userBubble.className.includes("ml-auto") ||
        userBubble.className.includes("justify-end"),
    ).toBe(true);
    // 内容匹配
    expect(userBubble.textContent).toMatch(/达妮娅你好/);
  });

  it("6-3. 预置 1 条 AI 消息后，Dialog 内出现 AI 侧气泡（chat-bubble-ai，靠左，含头像，回复 ≤ 50 字）", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    // 渲染前预置：1 user + 1 assistant 消息
    mockMessages = [
      { id: "u1", role: "user", content: "达妮娅你好" },
      { id: "a1", role: "assistant", content: "你好呀~一起吃蛋糕？🍰" },
    ];
    const user = userEvent.setup();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    await user.click(screen.getByTestId("chat-fab-button"));
    // 等 AI 气泡
    const aiBubble = await waitFor(
      () => screen.getByTestId("chat-bubble-ai"),
      { timeout: 1500 },
    );
    expect(aiBubble).toBeInTheDocument();
    // 靠左：mr-auto / justify-start
    expect(
      aiBubble.className.includes("mr-auto") ||
        aiBubble.className.includes("justify-start"),
    ).toBe(true);
    // 回复文本（去掉 emoji）≤ 50 字
    const content = aiBubble.textContent ?? "";
    const stripped = content.replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
      "",
    );
    expect(stripped.length).toBeLessThanOrEqual(50);
    // 存在达妮娅头像（img[alt*=达妮娅] 或 .avatar 或 [data-testid=ai-avatar]）
    const dialog = screen.getByTestId("chat-dialog");
    expect(
      (dialog.querySelector("img[alt*='达妮娅']") ??
        dialog.querySelector(".avatar") ??
        dialog.querySelector("[data-testid='ai-avatar']")) != null,
    ).toBe(true);
  });
});
