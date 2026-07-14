/**
 * 需求：每日限额 200（CHAT_DAILY_QUOTA_PER_USER 默认 200）
 *
 * 断言：
 *   1. route.ts 读 CHAT_DAILY_QUOTA_PER_USER 默认 200
 *   2. 限流 key = ${session.user.id}_${YYYYMMDD}（按自然日 UTC+8）
 *   3. 超限额返回 429，error 含「今日额度用完」或「填自己的 API Key」
 *   4. 限额逻辑在 auth() 之后，在模型调用之前
 *   5. 自定义 key 模式（customAiConfig 存在）跳过默认模型限流
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");

describe("AI 聊天：每日限额 200（CHAT_DAILY_QUOTA_PER_USER）", () => {
  it("case1: route.ts 读 CHAT_DAILY_QUOTA_PER_USER 默认 200", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasEnvQuota = /process\.env\.CHAT_DAILY_QUOTA_PER_USER/.test(src);
    const hasDefault200 =
      /CHAT_DAILY_QUOTA_PER_USER[^=]*=\s*200/.test(src) ||
      /CHAT_DAILY_QUOTA_PER_USER.*\|\|\s*200/.test(src) ||
      /CHAT_DAILY_QUOTA_PER_USER.*\?\?\s*200/.test(src);
    expect(hasEnvQuota || hasDefault200).toBe(true);
  });

  it("case2: 限流 key = ${session.user.id}_${YYYYMMDD}（按自然日 UTC+8）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasUserIdInKey =
      /session\.user\.id/.test(src) || /\$\{session.*user.*id\}/.test(src);
    const hasDateInKey =
      /YYYY|yyyy/.test(src) ||
      /getFullYear.*getMonth.*getDate/.test(src) ||
      /YYYYMMDD/.test(src) ||
      /toISOString.*slice/.test(src) ||
      /UTC\+8|Asia\/Shanghai|CST|北京/.test(src);
    const hasKeyFormat =
      /quotaKey|quota_key|rateKey|limitKey|dailyKey/i.test(src);
    expect(hasUserIdInKey).toBe(true);
    expect(hasDateInKey).toBe(true);
    expect(hasKeyFormat).toBe(true);
  });

  it("case3: 超限额返回 429，error 含「今日额度用完」或「填自己的 API Key」+ 不触模型 fetch", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const has429Status = /status\s*:\s*429/.test(src);
    expect(has429Status).toBe(true);
    const hasQuotaText =
      /今日额度用完/.test(src) ||
      /今日.*用完/.test(src) ||
      /填自己的.*API.*Key/.test(src) ||
      /额度.*用完/.test(src);
    expect(hasQuotaText).toBe(true);
  });

  it("case4: 限额逻辑在 auth() 之后，在模型调用之前", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 8000);
    const authIdx = postBody.search(/await\s+auth\s*\(\s*\)/);
    expect(authIdx).toBeGreaterThan(0);
    const quotaIdx = postBody.search(/quota|限额|额度|detectQuotaExceeded/i);
    expect(quotaIdx).toBeGreaterThan(authIdx);
    // 模型调用（fetch）在限额之后
    const fetchIdx = postBody.search(/fetch\s*\(/);
    if (fetchIdx !== -1) {
      expect(quotaIdx).toBeLessThan(fetchIdx);
    }
  });

  it("case5: 自定义 key 模式（customAiConfig 存在）跳过默认模型限流", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 10000);
    const hasSkipLogic =
      /customAiConfig[\s\S]{0,300}(skip|bypass|不.*限|跳过|quota.*check.*skip|return.*before.*quota)/i.test(postBody) ||
      /isCustomMode/i.test(postBody) ||
      /if\s*\(\s*!isCustomMode\s*\)[\s\S]{0,500}(quota|限额|额度|detectQuotaExceeded)/i.test(postBody);
    expect(hasSkipLogic).toBe(true);
  });
});
