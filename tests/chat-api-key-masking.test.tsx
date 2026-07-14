/**
 * AI 聊天 API Key 掩码测试 T-B：输入框 blur 后掩码、focus 清空、保存时用真实值
 *
 * 断言：
 *   1. blur 后掩码：sk-abcdefgh1234567890uvwxyzIJKL → sk-***********************JKL（前3后3中间*）
 *   2. focus 后清空值 + placeholder =「如需修改请重新输入完整 Key」
 *   3. 保存时参数 apiKey === 完整明文（内部 realKeyRef 持有），不是掩码字符串
 *   4. 空值 / <8 字符 → blur 不掩码，显示原值
 *
 * 风格：RTL + userEvent + fireEvent
 */
/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

describe("AI 聊天 T-B：API Key 掩码输入框", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const openSettingsDialog = async () => {
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
    await screen.findByTestId("ai-settings-dialog");
    return user;
  };

  it("B-1. 输入长 Key 后 blur：显示 sk-***********************JKL（前3后3中间*）", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    await openSettingsDialog();
    const input = screen.getByTestId("ai-api-key-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "sk-abcdefgh1234567890uvwxyzIJKL" } });
    fireEvent.blur(input);
    expect(input.value).toBe("sk-***********************JKL");
  });

  it("B-2. blur 后再 focus：值被清空为 '' + placeholder=「如需修改请重新输入完整 Key」", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    await openSettingsDialog();
    const input = screen.getByTestId("ai-api-key-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "sk-abcdefgh1234567890uvwxyzIJKL" } });
    fireEvent.blur(input);
    fireEvent.focus(input);
    expect(input.value).toBe("");
    expect(input.placeholder).toBe("如需修改请重新输入完整 Key");
  });

  it("B-3. 保存时 apiKey 参数 === 原完整 key（不是掩码字符串）", async () => {
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
    let savedConfig: any = null;
    vi.doMock("../src/lib/custom-ai-config", () => ({
      saveCustomAiConfig: vi.fn((_token, cfg) => {
        savedConfig = cfg;
        return Promise.resolve();
      }),
      loadCustomAiConfig: vi.fn(() => Promise.resolve(null)),
      deleteCustomAiConfig: vi.fn(() => {}),
    }));
    vi.resetModules();
    const user = userEvent.setup();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    await user.click(screen.getByTestId("chat-fab-button"));
    await screen.findByTestId("chat-dialog");
    await user.click(screen.getByTestId("chat-settings-gear"));
    await screen.findByTestId("ai-settings-dialog");
    const apiKeyInput = screen.getByTestId("ai-api-key-input") as HTMLInputElement;
    const baseUrlInput = screen.getByTestId("ai-base-url-input") as HTMLInputElement;
    const modelInput = screen.getByTestId("ai-model-input") as HTMLInputElement;
    fireEvent.change(baseUrlInput, { target: { value: "https://api.deepseek.com/v1" } });
    fireEvent.change(apiKeyInput, { target: { value: "sk-abcdefgh1234567890uvwxyzIJKL" } });
    fireEvent.blur(apiKeyInput);
    fireEvent.change(modelInput, { target: { value: "deepseek-chat" } });
    await user.click(screen.getByTestId("ai-save-config-btn"));
    await vi.waitFor(() => expect(savedConfig).not.toBeNull(), { timeout: 2000 });
    expect(savedConfig.apiKey).toBe("sk-abcdefgh1234567890uvwxyzIJKL");
    expect(savedConfig.apiKey).not.toBe("sk-***********************JKL");
  });

  it("B-4. 空值 / <8 字符 → blur 不掩码，显示原值", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    await openSettingsDialog();
    const input = screen.getByTestId("ai-api-key-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(input.value).toBe("");
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.blur(input);
    expect(input.value).toBe("abc");
    fireEvent.change(input, { target: { value: "sk-123" } });
    fireEvent.blur(input);
    expect(input.value).toBe("sk-123");
  });

  it("B-5. 三字段不全（空 baseURL 或空 model）→ 点击保存不触发 saveCustomAiConfig，显示 ai-settings-error 错误提示", async () => {
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
    let saveCount = 0;
    vi.doMock("../src/lib/custom-ai-config", () => ({
      saveCustomAiConfig: vi.fn(() => {
        saveCount += 1;
        return Promise.resolve();
      }),
      loadCustomAiConfig: vi.fn(() => Promise.resolve(null)),
      deleteCustomAiConfig: vi.fn(() => {}),
    }));
    vi.resetModules();
    const user = userEvent.setup();
    const { default: Comp } = await import("../src/components/shared/daniya-chat-fab");
    render(<Comp />);
    await user.click(screen.getByTestId("chat-fab-button"));
    await screen.findByTestId("chat-dialog");
    await user.click(screen.getByTestId("chat-settings-gear"));
    await screen.findByTestId("ai-settings-dialog");
    // 只填 apiKey，baseURL 和 model 留空 → 应该不能保存
    const apiKeyInput = screen.getByTestId("ai-api-key-input") as HTMLInputElement;
    fireEvent.change(apiKeyInput, { target: { value: "sk-abcdefgh1234567890uvwxyzIJKL" } });
    fireEvent.blur(apiKeyInput);
    await user.click(screen.getByTestId("ai-save-config-btn"));
    await new Promise(r => setTimeout(r, 300));
    expect(saveCount).toBe(0);
    const err = screen.queryByTestId("ai-settings-error");
    expect(err).not.toBeNull();
    expect(err!.textContent).toMatch(/必填|请填|baseURL|模型|地址|model/i);
  });
});
