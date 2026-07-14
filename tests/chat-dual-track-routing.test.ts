/**
 * 需求：双轨路由（默认模式 ZHIPU / 自定义模式 customAiConfig）
 *
 * 断言：
 *   1. body.customAiConfig 不存在/为空 → 走默认模式（ZHIPU fetch，有分支判断 customAiConfig）
 *   2. body.customAiConfig 有 baseURL+apiKey+model → 走自定义 fetch(customAiConfig.baseURL + "/chat/completions")
 *   3. 默认模式和自定义模式都先过 auth → 超长 → 合规 → 人设注入 → 才 fetch（order assert：4 个 index 比较）
 *   4. 自定义 fetch header Authorization: Bearer ${customAiConfig.apiKey} 用用户自己的 key，不是 ZHIPU_API_KEY
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");

describe("AI 聊天：双轨路由（默认 ZHIPU / 自定义 customAiConfig）", () => {
  it("case1: customAiConfig 不存在/为空 → 走默认模式（ZHIPU fetch，有分支判断 customAiConfig）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 10000);
    const hasCustomBranch =
      /if\s*\(\s*!customAiConfig\s*\)/.test(postBody) ||
      /if\s*\(\s*customAiConfig\s*\?\?/.test(postBody) ||
      /if\s*\([^)]*customAiConfig[^)]*===\s*undefined/.test(postBody) ||
      /if\s*\([^)]*customAiConfig[^)]*===\s*null/.test(postBody) ||
      /if\s*\([^)]*customAiConfig[^)]*&&/.test(postBody) ||
      /customAiConfig\s*[?!]/.test(postBody);
    expect(hasCustomBranch).toBe(true);
    const hasZhipuInDefault =
      /ZHIPU|zhipu|智谱/.test(postBody);
    expect(hasZhipuInDefault).toBe(true);
  });

  it("case2: customAiConfig 有 baseURL+apiKey+model → 走自定义 fetch（handleCustomProvider 用 cfg.baseURL + '/chat/completions'）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    // handleCustomProvider 在 POST 外部，需搜全量源码
    const hasCustomFetch =
      /handleCustomProvider/.test(src) &&
      (/normUrl\s*\([^)]*\.baseURL[^)]*\)\s*\+\s*["']\/chat\/completions["']/.test(src) ||
       /\.baseURL.*\+.*["']\/chat\/completions["']/.test(src));
    expect(hasCustomFetch).toBe(true);
  });

  it("case3: 默认 & 自定义都先过 auth → 超长 → 合规 → 人设注入 → 才 fetch（order assert：4 个 index 比较）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 10000);
    const authIdx = postBody.search(/await\s+auth\s*\(\s*\)/);
    expect(authIdx).toBeGreaterThan(0);
    const longIdx = postBody.search(
      /\.length\s*>\s*.*MAX_INPUT|input.*too.*long|INPUT_TOO_LONG|超长|超过.*200/i,
    );
    expect(longIdx).toBeGreaterThan(authIdx);
    const complianceIdx = postBody.search(/COMPLIANCE_BLOCK_REGEX|COMPLIANCE_BLOCKED|合规/);
    expect(complianceIdx).toBeGreaterThan(longIdx);
    const personaIdx = postBody.search(/sanitizeMessages\s*\(rawMsgs\)/);
    expect(personaIdx).toBeGreaterThan(complianceIdx);
    const fetchIdx = postBody.search(/fetch\s*\(/);
    expect(fetchIdx).toBeGreaterThan(personaIdx);
  });

  it("case4: handleCustomProvider 用 cfg.apiKey（用户自己的 key），不用 ZHIPU_API_KEY", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    // handleCustomProvider 函数体内用 cfg.apiKey 做 Authorization
    const hcpStart = src.indexOf("async function handleCustomProvider");
    expect(hcpStart).toBeGreaterThan(0);
    const hcpBody = src.slice(hcpStart, hcpStart + 3000);
    const usesCustomApiKey =
      /cfg\.apiKey/.test(hcpBody) &&
      /Authorization.*Bearer/.test(hcpBody);
    expect(usesCustomApiKey).toBe(true);
    const notUsesZhipuKeyInCustom = !/ZHIPU_API_KEY/.test(hcpBody);
    expect(notUsesZhipuKeyInCustom).toBe(true);
  });

  it("case5: isCustomMode 必须 baseURL && apiKey && model 三字段齐全，缺一即走默认模式（不能只看 apiKey）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 8000);
    // isCustomMode 定义/赋值附近，必须同时出现 baseURL + apiKey + model
    const hasTripleCheck =
      /isCustomMode[\s\S]{0,200}\.baseURL[\s\S]{0,200}\.apiKey[\s\S]{0,200}\.model/.test(
        postBody,
      ) ||
      /isCustomMode[\s\S]{0,200}\.model[\s\S]{0,200}\.baseURL[\s\S]{0,200}\.apiKey/.test(
        postBody,
      ) ||
      /\bcustomAiConfig\s*\?\s*\.baseURL\s*&&[\s\S]{0,100}\.apiKey\s*&&[\s\S]{0,100}\.model/.test(
        postBody,
      ) ||
      /customAiConfig\.[a-zA-Z]+.*&&.*customAiConfig\.[a-zA-Z]+.*&&.*customAiConfig\.[a-zA-Z]+/.test(
        postBody,
      );
    expect(hasTripleCheck).toBe(true);
    // 排除只查 apiKey 的旧写法：`&& customAiConfig.apiKey)`（孤立形式）后面没有 && model && baseURL
    const idx = postBody.search(/isCustomMode\s*=\s*!!\(customAiConfig[\s\S]{0,200}\.apiKey\s*\)/);
    if (idx !== -1) {
      const snippet = postBody.slice(Math.max(0, idx - 50), idx + 300);
      // 若命中这种简化写法，同时必须在 500 字符内再次出现 &&.baseURL &&.model
      const alsoChecksOthers =
        /\.baseURL\s*(&&|\?\?)/.test(snippet) && /\.model\s*(&&|\?\?)/.test(snippet);
      expect(alsoChecksOthers).toBe(true);
    }
  });
});
