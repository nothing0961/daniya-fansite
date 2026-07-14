/**
 * AI 聊天连接测试 + 协议提示 Dialog 测试 T-D
 *
 * 断言：
 *   1. baseURL=https://api.deepseek.com/v1 → mock 200 + choices[0].message.content + object=chat.completion
 *      → 绿色成功：data-testid="ai-connection-ok" 存在，无 hint Dialog
 *   2. baseURL=https://api.anthropic.com → 非 OpenAI 格式
 *      → ai-protocol-hint-dialog 弹，文案含「Claude 官方地址不是 OpenAI 兼容」+ docs 外链含 anthropic.com 或「OpenRouter / 硅基流动」
 *   3. baseURL=https://generativelanguage.googleapis.com → protocol=gemini
 *      → 弹 hint，文案含 Gemini + API 兼容代理
 *   4. mock 返回 401 invalid_api_key
 *      → 弹 hint 文案含「你的 API Key 无效」，无 docs 外链
 *   5. baseURL=http://localhost:11434/v1 + mock fetch TypeError (ECONNREFUSED/CORS 类)
 *      → 弹 hint 文案含「Vercel 连不上本地 Ollama」+ cloudflared / 内网穿透关键词
 *
 * 风格：RTL + userEvent + vi.mock(global.fetch)
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

describe("AI 聊天 T-D：连接测试按钮 + 协议提示 Dialog", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    localStorage.clear();
    global.fetch = originalFetch;
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

  const fillFieldsAndClickTest = async (
    baseUrl: string,
    apiKey: string,
    model: string,
  ) => {
    const baseUrlInput = screen.getByTestId("ai-base-url-input") as HTMLInputElement;
    const apiKeyInput = screen.getByTestId("ai-api-key-input") as HTMLInputElement;
    const modelInput = screen.getByTestId("ai-model-input") as HTMLInputElement;
    fireEvent.change(baseUrlInput, { target: { value: baseUrl } });
    fireEvent.change(apiKeyInput, { target: { value: apiKey } });
    fireEvent.change(modelInput, { target: { value: model } });
    const testBtn = screen.getByTestId("ai-test-connection-btn");
    const user = userEvent.setup();
    await user.click(testBtn);
  };

  it("D-1. deepseek 200 OK → 绿色 ai-connection-ok 元素存在，无 protocol-hint", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        object: "chat.completion",
        choices: [{ message: { content: "pong" } }],
      }),
    } as Response);
    await openSettingsDialog();
    await fillFieldsAndClickTest(
      "https://api.deepseek.com/v1",
      "sk-deepseek-test",
      "deepseek-chat",
    );
    const okEl = await screen.findByTestId("ai-connection-ok");
    expect(okEl).toBeInTheDocument();
    expect(screen.queryByTestId("ai-protocol-hint-dialog")).not.toBeInTheDocument();
  });

  it("D-2. anthropic.com 非 OpenAI 格式 → 弹协议 hint，文案含 Claude + OpenRouter/硅基流动", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        type: "message",
        content: [{ type: "text", text: "hi" }],
      }),
    } as Response);
    await openSettingsDialog();
    await fillFieldsAndClickTest(
      "https://api.anthropic.com",
      "sk-ant-test",
      "claude-sonnet-4",
    );
    const hint = await screen.findByTestId("ai-protocol-hint-dialog");
    expect(hint).toBeInTheDocument();
    expect(hint.textContent).toMatch(/Claude.*不是.*OpenAI.*兼容|Claude 官方地址不是 OpenAI 兼容/);
    const hasDocsLink = /anthropic\.com|OpenRouter|硅基流动/.test(hint.innerHTML);
    expect(hasDocsLink).toBe(true);
  });

  it("D-3. generativelanguage.googleapis.com (Gemini) → 弹 hint 含 Gemini + 兼容代理", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: "hi" }] } }],
      }),
    } as Response);
    await openSettingsDialog();
    await fillFieldsAndClickTest(
      "https://generativelanguage.googleapis.com",
      "AIzaSy-gemini-test-key",
      "gemini-1.5-flash",
    );
    const hint = await screen.findByTestId("ai-protocol-hint-dialog");
    expect(hint).toBeInTheDocument();
    expect(hint.textContent).toMatch(/Gemini/);
    expect(hint.textContent).toMatch(/兼容代理|API.*代理|兼容/);
  });

  it("D-4. 401 invalid_api_key → 弹 hint 文案含「API Key 无效」，无 docs 外链", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: "invalid_api_key" } }),
    } as Response);
    await openSettingsDialog();
    await fillFieldsAndClickTest(
      "https://api.deepseek.com/v1",
      "sk-wrong-wrong-wrong",
      "deepseek-chat",
    );
    const hint = await screen.findByTestId("ai-protocol-hint-dialog");
    expect(hint).toBeInTheDocument();
    expect(hint.textContent).toMatch(/API Key.*无效|你的 API Key 无效/);
    const hasExternalDocLink = /anthropic\.com|OpenRouter|硅基流动|cloudflared|内网穿透|generativelanguage/.test(hint.innerHTML);
    expect(hasExternalDocLink).toBe(false);
  });

  it("D-5. localhost:11434 + fetch TypeError → 弹 hint 含「Vercel 连不上本地 Ollama」+ cloudflared / 内网穿透", async () => {
    if (!fs.existsSync(COMPONENT_PATH)) return expect(true).toBe(false);
    global.fetch = vi.fn().mockRejectedValue(
      new TypeError("Failed to fetch: ECONNREFUSED 127.0.0.1:11434"),
    );
    await openSettingsDialog();
    await fillFieldsAndClickTest(
      "http://localhost:11434/v1",
      "ollama-no-key-need",
      "qwen2.5:7b",
    );
    const hint = await screen.findByTestId("ai-protocol-hint-dialog");
    expect(hint).toBeInTheDocument();
    expect(hint.textContent).toMatch(/Vercel.*本地.*Ollama|Vercel 连不上本地 Ollama/);
    const hasProxyKeyword = /cloudflared|内网穿透|frp|ngrok|隧道|穿透/.test(hint.textContent ?? "");
    expect(hasProxyKeyword).toBe(true);
  });
});
