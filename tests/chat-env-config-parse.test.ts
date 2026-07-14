/**
 * 需求：6 个环境变量读取（env config parse）
 *
 * 断言 case1~6：route.ts 中存在读取
 *   1. ZHIPU_API_KEY
 *   2. ZHIPU_BASE_URL
 *   3. ZHIPU_DEFAULT_MODEL
 *   4. CHAT_DAILY_QUOTA_PER_USER
 *   5. CHAT_MAX_OUTPUT_TOKENS
 *   6. DANIYA_SYSTEM_PROMPT
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");

describe("AI 聊天：6 个环境变量配置读取（env config parse）", () => {
  it("case1: route.ts 存在读取 process.env.ZHIPU_API_KEY（或包装函数里读）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasEnv = /process\.env\.ZHIPU_API_KEY/.test(src);
    expect(hasEnv).toBe(true);
  });

  it("case2: route.ts 存在读取 process.env.ZHIPU_BASE_URL（或包装函数里读）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasEnv = /process\.env\.ZHIPU_BASE_URL/.test(src);
    expect(hasEnv).toBe(true);
  });

  it("case3: route.ts 存在读取 process.env.ZHIPU_DEFAULT_MODEL（或包装函数里读）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasEnv = /process\.env\.ZHIPU_DEFAULT_MODEL/.test(src);
    expect(hasEnv).toBe(true);
  });

  it("case4: route.ts 存在读取 process.env.CHAT_DAILY_QUOTA_PER_USER（或包装函数里读）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasEnv = /process\.env\.CHAT_DAILY_QUOTA_PER_USER/.test(src);
    expect(hasEnv).toBe(true);
  });

  it("case5: route.ts 存在读取 process.env.CHAT_MAX_OUTPUT_TOKENS（或包装函数里读）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasEnv = /process\.env\.CHAT_MAX_OUTPUT_TOKENS/.test(src);
    expect(hasEnv).toBe(true);
  });

  it("case6: route.ts 存在读取 process.env.DANIYA_SYSTEM_PROMPT（或包装函数里读）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasEnv = /process\.env\.DANIYA_SYSTEM_PROMPT/.test(src);
    expect(hasEnv).toBe(true);
  });
});
