/**
 * 需求：SSRF 防护（拒绝所有内网 / 云元数据 / ULA 地址）
 *
 * 断言（7 cases）：route.ts 中存在拒绝逻辑（搜拒绝函数 / 正则 / 每种内网段）
 *   1. 127.0.0.1 / localhost / ::1 拒绝
 *   2. 10.0.0.0/8 拒绝
 *   3. 172.16.0.0/12（172.16~31）拒绝
 *   4. 192.168.0.0/16 拒绝
 *   5. 169.254.0.0/16（云元数据）拒绝
 *   6. RFC4193 ULA fc00::/7 拒绝
 *   7. 拒绝后 status=400 / code=SSRF_FORBIDDEN
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");

describe("AI 聊天：SSRF 防护（拒绝内网 / 云元数据 / ULA 地址）", () => {
  it("case1: 127.0.0.1 / localhost / ::1 拒绝", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasUnsafeHostFn =
      /isUnsafeHost|isSSRF|checkSSRF|blockSSRF|ssrfBlock|ssrfCheck/i.test(src);
    const hasLoopback =
      /127\.0\.0\.1/.test(src) ||
      /localhost/.test(src) ||
      /::1/.test(src) ||
      /loopback/i.test(src);
    expect(hasUnsafeHostFn || hasLoopback).toBe(true);
  });

  it("case2: 10.0.0.0/8（搜 10. 判断）拒绝", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasUnsafeHostFn =
      /isUnsafeHost|isSSRF|checkSSRF|blockSSRF|ssrfBlock|ssrfCheck/i.test(src);
    const has10Net =
      /10\./.test(src) && /startsWith.*10\./.test(src) ||
      /\b10\.\d+\.\d+\.\d+\b/.test(src) ||
      /10\.0\.0\.0.*8/.test(src);
    expect(hasUnsafeHostFn || has10Net).toBe(true);
  });

  it("case3: 172.16.0.0/12（172.16~31）拒绝", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasUnsafeHostFn =
      /isUnsafeHost|isSSRF|checkSSRF|blockSSRF|ssrfBlock|ssrfCheck/i.test(src);
    const has172Net =
      /172\.1[6-9]/.test(src) ||
      /172\.2[0-9]/.test(src) ||
      /172\.3[01]/.test(src) ||
      /172\.16.*31/.test(src) ||
      /172\.16\.0\.0.*12/.test(src);
    expect(hasUnsafeHostFn || has172Net).toBe(true);
  });

  it("case4: 192.168.0.0/16 拒绝", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasUnsafeHostFn =
      /isUnsafeHost|isSSRF|checkSSRF|blockSSRF|ssrfBlock|ssrfCheck/i.test(src);
    const has192Net =
      /192\.168\./.test(src) ||
      /192\.168\.0\.0.*16/.test(src);
    expect(hasUnsafeHostFn || has192Net).toBe(true);
  });

  it("case5: 169.254.0.0/16（云元数据）拒绝", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasUnsafeHostFn =
      /isUnsafeHost|isSSRF|checkSSRF|blockSSRF|ssrfBlock|ssrfCheck/i.test(src);
    const hasMetaNet =
      /169\.254\./.test(src) ||
      /metadata|云元|IMDS/.test(src) ||
      /169\.254\.0\.0.*16/.test(src);
    expect(hasUnsafeHostFn || hasMetaNet).toBe(true);
  });

  it("case6: RFC4193 ULA fc00::/7 拒绝", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasUnsafeHostFn =
      /isUnsafeHost|isSSRF|checkSSRF|blockSSRF|ssrfBlock|ssrfCheck/i.test(src);
    const hasULA =
      /fc[0-9a-fA-F]|fd[0-9a-fA-F]/.test(src) ||
      /fc00.*7/.test(src) ||
      /ULA|unique.*local/i.test(src) ||
      /RFC4193/i.test(src);
    expect(hasUnsafeHostFn || hasULA).toBe(true);
  });

  it("case7: 拒绝后 status=400 / code=SSRF_FORBIDDEN", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 8000);
    const ssrfBlockIdx = postBody.search(
      /isUnsafeHost|isSSRF|checkSSRF|blockSSRF|ssrfBlock|ssrfCheck/i,
    );
    expect(ssrfBlockIdx).toBeGreaterThan(0);
    const ssrfBlock = postBody.slice(ssrfBlockIdx, ssrfBlockIdx + 2000);
    expect(ssrfBlock).toMatch(/status\s*:\s*400/);
    expect(ssrfBlock).toMatch(/SSRF_FORBIDDEN/);
    expect(ssrfBlock).toMatch(/Response\.json/);
  });
});
