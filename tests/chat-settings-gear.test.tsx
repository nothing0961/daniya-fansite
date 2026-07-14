/**
 * AI 聊天设置齿轮按钮测试 T-A：Header 右上角 ⚙️ 设置按钮 + 配置 Dialog
 *
 * 断言：
 *   1. 登录态：打开 chat-dialog 后，Header 右上角存在 data-testid="chat-settings-gear" 按钮（aria-label="聊天设置"）
 *   2. 未登录态：⚙️ gear 按钮不渲染
 *   3. 点击 ⚙️ gear → 打开 data-testid="ai-settings-dialog" 设置 Dialog
 *   4. 设置 Dialog 里有 3 个输入字段 + 2 个按钮（连接测试 + 保存并启用）
 *   5. 设置 Dialog 底部「删除配置」按钮：点击后 localStorage 清空 + UI 三字段变空
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
  useRouter: () => ({ push: vi.fn() }),
}));

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

describe("AI 聊天 T-A：设置齿轮按钮 ⚙️ + 配置 Dialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("A-1. 登录态：打开 chat-dialog → Header 右上角存在 ⚙️ chat-settings-gear 按钮（aria-label=聊天设置）", async () => {
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
    const user = userEvent.setup();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    await user.click(screen.getByTestId("chat-fab-button"));
    await screen.findByTestId("chat-dialog");
    const gear = screen.getByTestId("chat-settings-gear");
    expect(gear).toBeInTheDocument();
    expect(gear).toHaveAttribute("aria-label", "聊天设置");
  });

  it("A-2. 未登录态：打开 Dialog（空状态）→ ⚙️ gear 按钮不渲染", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    vi.doMock("next-auth/react", () => ({
      useSession: () => ({ data: null, status: "unauthenticated" as const }),
    }));
    vi.resetModules();
    const user = userEvent.setup();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    await user.click(screen.getByTestId("chat-fab-button"));
    await screen.findByTestId("chat-dialog");
    expect(screen.queryByTestId("chat-settings-gear")).not.toBeInTheDocument();
  });

  it("A-3. 点击 ⚙️ gear → 打开 ai-settings-dialog 设置 Dialog", async () => {
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
    const user = userEvent.setup();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    await user.click(screen.getByTestId("chat-fab-button"));
    await screen.findByTestId("chat-dialog");
    const gear = screen.getByTestId("chat-settings-gear");
    await user.click(gear);
    const settingsDialog = await screen.findByTestId("ai-settings-dialog");
    expect(settingsDialog).toBeInTheDocument();
  });

  it("A-4. 设置 Dialog 内：3 个输入字段（baseURL/apiKey/model）+ 2 个按钮（连接测试 + 保存并启用）", async () => {
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
    const user = userEvent.setup();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    await user.click(screen.getByTestId("chat-fab-button"));
    await screen.findByTestId("chat-dialog");
    await user.click(screen.getByTestId("chat-settings-gear"));
    const dialog = await screen.findByTestId("ai-settings-dialog");
    expect(dialog.querySelector("[data-testid='ai-base-url-input']")).not.toBeNull();
    expect(dialog.querySelector("[data-testid='ai-api-key-input']")).not.toBeNull();
    expect(dialog.querySelector("[data-testid='ai-model-input']")).not.toBeNull();
    expect(dialog.querySelector("[data-testid='ai-test-connection-btn']")).not.toBeNull();
    expect(dialog.querySelector("[data-testid='ai-save-config-btn']")).not.toBeNull();
  });

  it("A-5. 底部「删除配置」按钮 ai-clear-config-btn：点击后 localStorage 清空 + UI 三字段变空", async () => {
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
    const user = userEvent.setup();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    await user.click(screen.getByTestId("chat-fab-button"));
    await screen.findByTestId("chat-dialog");
    await user.click(screen.getByTestId("chat-settings-gear"));
    const dialog = await screen.findByTestId("ai-settings-dialog");
    const clearBtn = dialog.querySelector("[data-testid='ai-clear-config-btn']");
    expect(clearBtn).not.toBeNull();
    if (!clearBtn) return;
    localStorage.setItem("daniya:ai:config:v1", "SOME_ENCRYPTED_STUB");
    const baseUrlInput = dialog.querySelector<HTMLInputElement>("[data-testid='ai-base-url-input']");
    const apiKeyInput = dialog.querySelector<HTMLInputElement>("[data-testid='ai-api-key-input']");
    const modelInput = dialog.querySelector<HTMLInputElement>("[data-testid='ai-model-input']");
    if (baseUrlInput) baseUrlInput.value = "https://api.example.com/v1";
    if (apiKeyInput) apiKeyInput.value = "sk-testkey";
    if (modelInput) modelInput.value = "gpt-4o-mini";
    await user.click(clearBtn);
    expect(localStorage.getItem("daniya:ai:config:v1")).toBeNull();
    expect(baseUrlInput?.value ?? "").toBe("");
    expect(apiKeyInput?.value ?? "").toBe("");
    expect(modelInput?.value ?? "").toBe("");
  });
});
