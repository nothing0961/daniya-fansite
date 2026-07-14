/**
 * AI 聊天自定义配置 lib 测试 T-C：src/lib/custom-ai-config.ts
 * AES-GCM 加密 localStorage 存取，按 sessToken 派生密钥
 *
 * 导出函数签名（必须存在）：
 *   saveCustomAiConfig(sessToken, cfg): Promise<void>
 *   loadCustomAiConfig(sessToken): Promise<{baseURL,apiKey,model}|null>
 *   deleteCustomAiConfig(): void
 *
 * 断言（6 cases）：
 *   1. save → load 往返：明文三字段一致
 *   2. sessToken 不同 = 解密失败（A2 解 A1 保存 → null）
 *   3. delete 后 load 返回 null
 *   4. localStorage 实际值 **不是** 明文（base64 结果里搜不到原 apiKey 子串）
 *   5. localStorage key === "daniya:ai:config:v1"
 *   6. apiKey="sk-test" 保存后，直接读 localStorage 值不含 "sk-test"
 *
 * 风格：纯 node/vitest，不 render 组件
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

const LIB_PATH = path.join(
  process.cwd(),
  "src/lib/custom-ai-config.ts",
);

const STORAGE_KEY = "daniya:ai:config:v1";

const mockLocalStorage: Record<string, string> = {};
const createMockStorage = () => ({
  getItem: (k: string) => (k in mockLocalStorage ? mockLocalStorage[k] : null),
  setItem: (k: string, v: string) => { mockLocalStorage[k] = v; },
  removeItem: (k: string) => { delete mockLocalStorage[k]; },
  clear: () => { for (const k of Object.keys(mockLocalStorage)) delete mockLocalStorage[k]; },
  key: (i: number) => Object.keys(mockLocalStorage)[i] ?? null,
  get length() { return Object.keys(mockLocalStorage).length; },
});

describe("AI 聊天 T-C：custom-ai-config AES-GCM 加密 localStorage", () => {
  beforeEach(() => {
    for (const k of Object.keys(mockLocalStorage)) delete mockLocalStorage[k];
    (global as any).localStorage = createMockStorage();
  });

  afterEach(() => {
    for (const k of Object.keys(mockLocalStorage)) delete mockLocalStorage[k];
    delete (global as any).localStorage;
  });

  const loadLib = async () => {
    if (!fs.existsSync(LIB_PATH)) return null;
    vi.resetModules();
    return await import(LIB_PATH);
  };

  it("C-0. 模块文件存在，且导出 3 个函数（函数签名测试）", async () => {
    expect(fs.existsSync(LIB_PATH)).toBe(true);
    const mod = await loadLib();
    expect(mod).not.toBeNull();
    expect(typeof mod!.saveCustomAiConfig).toBe("function");
    expect(typeof mod!.loadCustomAiConfig).toBe("function");
    expect(typeof mod!.deleteCustomAiConfig).toBe("function");
  });

  it("C-1. save → load 往返：baseURL / apiKey / model 三字段明文恢复一致", async () => {
    if (!fs.existsSync(LIB_PATH)) return expect(true).toBe(false);
    const mod = await loadLib();
    if (!mod) return expect(true).toBe(false);
    const cfg = {
      baseURL: "https://api.deepseek.com/v1",
      apiKey: "sk-abcdefgh1234567890uvwxyzIJKL",
      model: "deepseek-chat",
    };
    await mod.saveCustomAiConfig("session-token-A1", cfg);
    const loaded = await mod.loadCustomAiConfig("session-token-A1");
    expect(loaded).not.toBeNull();
    expect(loaded!.baseURL).toBe(cfg.baseURL);
    expect(loaded!.apiKey).toBe(cfg.apiKey);
    expect(loaded!.model).toBe(cfg.model);
  });

  it("C-2. sessToken 不同 = 解密失败（A2 解 A1 保存 → 返回 null）", async () => {
    if (!fs.existsSync(LIB_PATH)) return expect(true).toBe(false);
    const mod = await loadLib();
    if (!mod) return expect(true).toBe(false);
    await mod.saveCustomAiConfig("session-token-A1", {
      baseURL: "https://api.example.com/v1",
      apiKey: "sk-secret-001",
      model: "gpt-4o-mini",
    });
    const loadedWithWrongToken = await mod.loadCustomAiConfig("session-token-A2");
    expect(loadedWithWrongToken).toBeNull();
  });

  it("C-3. deleteCustomAiConfig 后 load 返回 null", async () => {
    if (!fs.existsSync(LIB_PATH)) return expect(true).toBe(false);
    const mod = await loadLib();
    if (!mod) return expect(true).toBe(false);
    await mod.saveCustomAiConfig("token-X", {
      baseURL: "https://api.anthropic.com/v1",
      apiKey: "sk-ant-123456",
      model: "claude-sonnet-4",
    });
    const before = await mod.loadCustomAiConfig("token-X");
    expect(before).not.toBeNull();
    mod.deleteCustomAiConfig();
    const after = await mod.loadCustomAiConfig("token-X");
    expect(after).toBeNull();
  });

  it("C-4. localStorage 存的 base64 值不是明文，搜不到原 apiKey 子串", async () => {
    if (!fs.existsSync(LIB_PATH)) return expect(true).toBe(false);
    const mod = await loadLib();
    if (!mod) return expect(true).toBe(false);
    const apiKeyPlain = "sk-this-is-a-very-long-secret-key-0xDEADBEEF";
    await mod.saveCustomAiConfig("token-enc", {
      baseURL: "https://api.deepseek.com/v1",
      apiKey: apiKeyPlain,
      model: "deepseek-chat",
    });
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(raw).not.toContain(apiKeyPlain);
    expect(raw).not.toContain("api.deepseek.com");
    expect(raw).not.toContain("deepseek-chat");
  });

  it("C-5. localStorage key === daniya:ai:config:v1（方案 B2-X 常量）", async () => {
    if (!fs.existsSync(LIB_PATH)) return expect(true).toBe(false);
    const mod = await loadLib();
    if (!mod) return expect(true).toBe(false);
    expect(Object.keys(mockLocalStorage).length).toBe(0);
    await mod.saveCustomAiConfig("token-k", {
      baseURL: "https://a.com",
      apiKey: "sk-k",
      model: "m-k",
    });
    expect(Object.keys(mockLocalStorage)).toContain(STORAGE_KEY);
    expect(Object.keys(mockLocalStorage).length).toBe(1);
  });

  it("C-6. apiKey=sk-test 保存后，localStorage 原始值不含 sk-test 子串（防明文）", async () => {
    if (!fs.existsSync(LIB_PATH)) return expect(true).toBe(false);
    const mod = await loadLib();
    if (!mod) return expect(true).toBe(false);
    await mod.saveCustomAiConfig("abc123", {
      baseURL: "https://api.openai.com/v1",
      apiKey: "sk-test",
      model: "gpt-4o",
    });
    const raw = localStorage.getItem(STORAGE_KEY) ?? "";
    expect(raw).not.toContain("sk-test");
    expect(raw).not.toContain("openai");
    expect(raw).not.toContain("gpt-4o");
  });
});
