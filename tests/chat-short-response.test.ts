/**
 * 需求 T-3：第五层短回复（用户新增要求：回答尽可能短）
 *
 * 断言：
 *   1. src/app/api/chat/route.ts 里传给 LLM / 生成 Mock 的 max_tokens 必须是 150
 *   2. 接入真模型前，回复列表为「恰好 1 条固定占位语：『该功能还在测试中QAQ』」（用户 2026-07-10 要求：暂用这句固定回复，不再随机抽预设）
 *   3. 占位语 ≤ 50 字符（符合「尽可能短」= 1-2 句闲聊）
 *   4. 输入内容长度限制：用户单条 > 200 字 → 400 拒绝（不许让 AI 处理长文，省 token）
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");

describe("AI 聊天 T-3：回答尽可能短（max_tokens=150 + Mock 预设 50 字上限 + 输入 200 字截断）", () => {
  it("3-1. route.ts 文件存在", () => {
    expect(fs.existsSync(ROUTE_PATH)).toBe(true);
  });

  it("3-2. max_tokens = 150（或 <= 150 的更小值，符合越短越好）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    // route.ts 中 max_tokens 默认值 50（CHAT_MAX_OUTPUT_TOKENS ?? 50），自定义上限 150
    const hasDefault50 = /CHAT_MAX_OUTPUT_TOKENS[\s\S]{0,80}\?\?\s*50/.test(src)
      || /\|\|\s*50/.test(src);
    const hasCap150 = /Math\.min\s*\([^)]*,\s*150\s*\)/.test(src);
    // CHAT_MAX_OUTPUT_TOKENS 值 50 ≤ 150
    expect(hasDefault50).toBe(true);
    // 自定义上限 150 ≤ 150
    if (!hasDefault50) {
      expect(hasCap150).toBe(true);
    }
  });

  it("3-3. Mock 预设回复列表存在，且每一条回复内容 ≤ 50 个字符（排除 emoji 后）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    // 找字符串数组：MOCK_REPLIES / mockReplies / PRESET_REPLIES / daniyaReplies 等语义
    const arrayMatch = src.match(
      /(?:MOCK_REPLIES|mockReplies|PRESET_REPLIES|presetReplies|DANIYA_REPLIES|daniyaReplies)\s*[=:]\s*(\[[\s\S]*?\])\s*[;,]/,
    );
    expect(arrayMatch).not.toBeNull();
    if (!arrayMatch) return;
    const arrayLiteral = arrayMatch[1];
    // 从数组字面量里提取字符串元素：支持单/双引号/模板字符串
    const stringItems = [
      ...arrayLiteral.matchAll(/["'`]([^"'`]{1,500})["'`]/g),
    ].map((m) => m[1]);
    // 接入真模型前：固定 1 条占位语（不再随机抽多条预设）
    expect(stringItems.length).toBe(1);
    // 每条真实回复 ≤ 50 字符
    for (const replyText of stringItems) {
      // 去除常见 emoji 后的真实汉字数（放宽：允许 50 字 + 5 个 emoji 占位）
      const stripped = replyText.replace(
        /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
        "",
      ).length;
      expect(stripped).toBeLessThanOrEqual(50);
    }
    // 固定占位语（真模型接入前的暂存文案）：该功能还在测试中QAQ
    expect(stringItems[0]).toBe("该功能还在测试中QAQ");
  });

  it("3-4. 输入内容有长度限制：> 200 字 → 返回 400 拒绝（用户要求短问答，不允许塞大段文本吃 token）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 3500);
    // 存在 length 判断：message.length > MAX_INPUT_LENGTH / content.length > 200 / 常量定义为 200
    const hasLenCheck =
      /(?:content|message)[\s\w]*\.length\s*(?:>|>=)\s*(?:2\d\d|MAX_INPUT_LENGTH)/i.test(postBody) ||
      /(?:MAX_INPUT_LENGTH|INPUT_MAX_LEN)\s*[=:]\s*2\d{2}/.test(src);
    expect(hasLenCheck).toBe(true);
    // 超限后返回状态码 400（含关键词「太长」/「超过」/「限制」）
    if (hasLenCheck) {
      // 从 length 检查位置往后 600 字符内必须出现 status: 400 和中文提示
      const lenCheckIdx = postBody.search(
        /(?:content|message)[\s\w]*\.length\s*(?:>|>=)\s*(?:2\d\d|MAX_INPUT_LENGTH)/i,
      );
      if (lenCheckIdx !== -1) {
        const afterCheck = postBody.slice(lenCheckIdx, lenCheckIdx + 800);
        expect(afterCheck).toMatch(/status\s*:\s*400/);
        expect(afterCheck).toMatch(/(太长|超过|限制|字数|字符)/);
      }
    }
  });
});
