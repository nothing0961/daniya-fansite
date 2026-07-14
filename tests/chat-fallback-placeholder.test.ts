/**
 * 需求：失败降级占位回复（超时 + 网络错误 → 降级到 PRESET_REPLIES[0] SSE 打字机）
 *
 * 断言：
 *   1. fetch 失败（网络错误 / 超时 / 非 2xx），降级到 PRESET_REPLIES[0]
 *   2. 降级模式使用 AbortController 超时保护
 *   3. 占位模式下仍通过 stream 返回打字机，不是一次性返回 JSON
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");

describe("AI 聊天：失败降级占位回复（重试 2 次 + 指数退避 + 占位 SSE）", () => {
  it("case1: fetch 失败（网络错误 / 非 2xx），降级到 PRESET_REPLIES[0]", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasFallbackFunction = /function fallbackSSE|buildMockSSE/.test(src);
    expect(hasFallbackFunction).toBe(true);
    const hasCatchFallback =
      /catch\s*\([^)]*\)\s*\{[\s\S]*?fallbackSSE|PRESET_REPLIES/.test(src) ||
      /catch[\s\S]*?该功能还在测试中/.test(src) ||
      /!resp\.ok[\s\S]*?fallbackSSE/.test(src);
    expect(hasCatchFallback).toBe(true);
  });

  it("case2: 使用 AbortController 超时保护防止请求无限挂起", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasAbortController = /AbortController/.test(src);
    const hasTimeout = /setTimeout\s*\(\s*\(\)\s*=>\s*\w+\.abort\(\)/.test(src);
    expect(hasAbortController).toBe(true);
    expect(hasTimeout).toBe(true);
  });

  it("case3: 占位模式下仍通过 stream 返回打字机，不是一次性返回 JSON", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasStreamFallback =
      /buildMockSSE/.test(src) &&
      (/new\s+ReadableStream/.test(src) || /ReadableStream/.test(src));
    expect(hasStreamFallback).toBe(true);
    const hasSSEContentType = /text\/event-stream/.test(src);
    expect(hasSSEContentType).toBe(true);
  });

  it("case4: 默认模式（智谱）失败后重试 MAX=2 次 + 指数退避（sleep 500 → 1000ms，delay *= 2），单请求 timeout 3000ms", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hdpStart = src.indexOf("async function handleDefaultProvider");
    expect(hdpStart).toBeGreaterThan(0);
    const hdpBody = src.slice(hdpStart, hdpStart + 6000);
    // 重试 2 次：循环形式：for (let attempt = 0; attempt < [23] | maxRetries = 2 | while (< 3)
    const hasRetryLoop =
      /for\s*\(\s*let\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*[23]\s*;|while\s*\(\s*\w+\s*<\s*[23]\s*\)|MAX_RETRIES\s*=\s*[23]|maxRetries\s*=\s*[23]/.test(
        hdpBody,
      ) || /attempt\s*[<>=]+\s*[123]/.test(hdpBody);
    expect(hasRetryLoop).toBe(true);
    // 指数退避：delay *= 2 或 delay = delay * 2
    const hasExponentialBackoff =
      /\bdelay\s*\*\s*=\s*2\b|\bdelay\s*=\s*delay\s*\*\s*2\b|backoff\s*\*\s*=\s*2|sleep\s*\(\s*500\s*\)[\s\S]{0,200}sleep\s*\(\s*1000\s*\)/.test(
        hdpBody,
      );
    expect(hasExponentialBackoff).toBe(true);
    // 单请求 timeout = 3000ms（严格），不是 30000
    const defaultTimeout =
      /setTimeout\s*\(\s*\(\s*\)\s*=>\s*\w+\.abort\s*\(\s*\)\s*,\s*3000\s*\)/.test(
        hdpBody,
      );
    expect(defaultTimeout).toBe(true);
  });
});
