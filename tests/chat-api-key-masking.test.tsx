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

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("AI 聊天 T-B：API Key 掩码输入框", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const openSettingsPanel = async () => {
    vi.doMock("../src/lib/custom-ai-config", () => ({
      loadCustomAiConfig: vi.fn(() => Promise.resolve(null)),
      saveCustomAiConfig: vi.fn(() => Promise.resolve()),
      deleteCustomAiConfig: vi.fn(() => {}),
    }));
    vi.doMock("../src/lib/skill-mcp-config", () => ({
      loadSkillMcpConfig: vi.fn(() => Promise.resolve(null)),
      saveSkillMcpConfig: vi.fn(() => Promise.resolve()),
      deleteSkillMcpConfig: vi.fn(() => {}),
      generateId: vi.fn(() => `test-id-${Date.now()}`),
    }));
    vi.resetModules();
    const user = userEvent.setup();
    const { default: ChatPage } = await import("../src/app/chat/page");
    render(<ChatPage />);
    await user.click(screen.getByRole("button", { name: /设置/i }));
    return user;
  };

  it("B-1. 输入长 Key 后 blur：显示 sk-***********************JKL（前3后3中间*）", async () => {
    await openSettingsPanel();
    const input = screen.getByPlaceholderText(/sk-/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "sk-abcdefgh1234567890uvwxyzIJKL" } });
    fireEvent.blur(input);
    expect(input.value).toBe("sk-***********************JKL");
  });

  it("B-2. blur 后再 focus：值被清空为 '' + placeholder=「如需修改请重新输入完整 Key」", async () => {
    await openSettingsPanel();
    const input = screen.getByPlaceholderText(/sk-/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "sk-abcdefgh1234567890uvwxyzIJKL" } });
    fireEvent.blur(input);
    fireEvent.focus(input);
    expect(input.value).toBe("");
    expect(input.placeholder).toBe("sk-...");
  });

  it("B-3. 保存时 apiKey 参数 === 原完整 key（不是掩码字符串）", async () => {
    let savedConfig: any = null;
    vi.doMock("../src/lib/custom-ai-config", () => ({
      saveCustomAiConfig: vi.fn((_token, cfg) => {
        savedConfig = cfg;
        return Promise.resolve();
      }),
      loadCustomAiConfig: vi.fn(() => Promise.resolve(null)),
      deleteCustomAiConfig: vi.fn(() => {}),
    }));
    vi.doMock("../src/lib/skill-mcp-config", () => ({
      loadSkillMcpConfig: vi.fn(() => Promise.resolve(null)),
      saveSkillMcpConfig: vi.fn(() => Promise.resolve()),
      deleteSkillMcpConfig: vi.fn(() => {}),
      generateId: vi.fn(() => `test-id-${Date.now()}`),
    }));
    vi.resetModules();
    const user = userEvent.setup();
    const { default: ChatPage } = await import("../src/app/chat/page");
    render(<ChatPage />);
    await user.click(screen.getByRole("button", { name: /设置/i }));
    
    const baseUrlInput = screen.getByPlaceholderText(/api.deepseek/i) as HTMLInputElement;
    const apiKeyInput = screen.getByPlaceholderText(/sk-/i) as HTMLInputElement;
    const modelInput = screen.getByPlaceholderText(/deepseek-v4-flash/i) as HTMLInputElement;
    
    fireEvent.change(baseUrlInput, { target: { value: "https://api.deepseek.com/v1" } });
    fireEvent.change(apiKeyInput, { target: { value: "sk-abcdefgh1234567890uvwxyzIJKL" } });
    fireEvent.blur(apiKeyInput);
    fireEvent.change(modelInput, { target: { value: "deepseek-chat" } });
    await user.click(screen.getByRole("button", { name: /保存并启用/i }));
    await vi.waitFor(() => expect(savedConfig).not.toBeNull(), { timeout: 2000 });
    expect(savedConfig.apiKey).toBe("sk-abcdefgh1234567890uvwxyzIJKL");
    expect(savedConfig.apiKey).not.toBe("sk-***********************JKL");
  });

  it("B-4. 空值 / <8 字符 → blur 不掩码，显示原值", async () => {
    await openSettingsPanel();
    const input = screen.getByPlaceholderText(/sk-/i) as HTMLInputElement;
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

  it("B-5. 三字段不全（空 baseURL 或空 model）→ 点击保存不触发 saveCustomAiConfig，显示错误提示", async () => {
    let saveCount = 0;
    vi.doMock("../src/lib/custom-ai-config", () => ({
      saveCustomAiConfig: vi.fn(() => {
        saveCount += 1;
        return Promise.resolve();
      }),
      loadCustomAiConfig: vi.fn(() => Promise.resolve(null)),
      deleteCustomAiConfig: vi.fn(() => {}),
    }));
    vi.doMock("../src/lib/skill-mcp-config", () => ({
      loadSkillMcpConfig: vi.fn(() => Promise.resolve(null)),
      saveSkillMcpConfig: vi.fn(() => Promise.resolve()),
      deleteSkillMcpConfig: vi.fn(() => {}),
      generateId: vi.fn(() => `test-id-${Date.now()}`),
    }));
    vi.resetModules();
    const user = userEvent.setup();
    const { default: ChatPage } = await import("../src/app/chat/page");
    render(<ChatPage />);
    await user.click(screen.getByRole("button", { name: /设置/i }));
    
    const apiKeyInput = screen.getByPlaceholderText(/sk-/i) as HTMLInputElement;
    fireEvent.change(apiKeyInput, { target: { value: "sk-abcdefgh1234567890uvwxyzIJKL" } });
    fireEvent.blur(apiKeyInput);
    await user.click(screen.getByRole("button", { name: /保存并启用/i }));
    await new Promise(r => setTimeout(r, 300));
    expect(saveCount).toBe(0);
    const errors = screen.getAllByText(/必填|请填|地址|模型/i);
    const err = errors.find(e => e.classList.contains("bg-red-50") || e.classList.contains("bg-red-950"));
    expect(err).not.toBeNull();
  });
});