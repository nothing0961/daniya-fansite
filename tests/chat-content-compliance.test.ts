/**
 * 需求 T-2：第四层合规过滤（用户新增要求：符合法律法规）
 *
 * 必须拦截的关键词大类（中国大陆法律合规要求）：
 *   - 涉政敏感词（政党/领导人/分裂/颠覆）
 *   - 色情/低俗内容
 *   - 赌博/博彩/棋牌诈骗
 *   - 毒品/违禁药品/易制毒
 *   - 恐怖主义/极端主义/暴力/管制刀具枪支
 *   - 自杀/自伤/自残/教唆轻生
 *   - 电信诈骗/杀猪盘/非法集资/传销
 *   - 代孕/买卖人口
 *
 * 断言：
 *   1. src/app/api/chat/route.ts 里必须存在「合规关键词正则」
 *   2. POST 函数体内，合规匹配在 Mock/LLM 调用之前
 *   3. 命中关键词后返回 400 + 中文合规拒绝文案（含「合规」或「违反」或「违法」关键词）
 *
 * 风格：源码字符串正则断言
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_PATH = path.join(ROOT, "src/app/api/chat/route.ts");

// 所有要求拦截的大类，每一类至少给一个示例关键词的正则匹配锚点
const REQUIRED_KEYWORD_CLASSES: { label: string; anchorWords: string[] }[] = [
  {
    label: "自杀自伤类（自杀/自残/轻生）",
    anchorWords: ["自杀", "自残", "轻生", "割腕"],
  },
  {
    label: "毒品违禁药品类",
    anchorWords: ["毒品", "冰毒", "海洛因", "大麻", "K粉"],
  },
  {
    label: "赌博博彩类",
    anchorWords: ["赌博", "博彩", "菠菜", "棋牌", "网赌"],
  },
  {
    label: "色情低俗类",
    anchorWords: ["色情", "黄片", "裸聊", "嫖娼"],
  },
  {
    label: "枪支爆炸恐怖类",
    anchorWords: ["手枪", "步枪", "炸弹", "爆炸", "恐怖"],
  },
  {
    label: "诈骗传销非法集资类",
    anchorWords: ["杀猪盘", "刷单", "诈骗", "传销", "非法集资"],
  },
];

describe("AI 聊天 T-2：合规关键词前置拦截（违反法律法规内容 400 拒绝）", () => {
  it("2-1. route.ts 文件存在", () => {
    expect(fs.existsSync(ROUTE_PATH)).toBe(true);
  });

  it("2-2. 存在合规关键词正则列表（命名如 COMPLIANCE_BLOCK_REGEX / complianceKeywords / 违禁词 等语义变量）", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const hasRegexVar =
      /(COMPLIANCE|合规|违禁|敏感词)[A-Z0-9_]*\s*[=:]\s*(\/(?!\/)|RegExp\(|new\s+Set\(|Array\.isArray|\[)/i.test(
        src,
      );
    expect(hasRegexVar).toBe(true);
  });

  it.each(REQUIRED_KEYWORD_CLASSES.map((c) => [c.label, c.anchorWords]))(
    "2-3. 必含拦截大类：%s — 至少命中 anchorWords 中的 1 个示例关键词",
    (_label, anchors) => {
      if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
      const src = fs.readFileSync(ROUTE_PATH, "utf-8");
      const atLeastOne = anchors.some((w) =>
        // 词必须出现在字符串/正则字面量里（不能只出现在注释里，允许注释但至少也要在正则里）
        // 匹配策略：找该词出现在 "xxx" 或 /xxx/ 字面量中
        new RegExp(`["'\`/][^"'\\\`/]*${w}[^"'\\\`/]*["'\`/]`).test(src),
      );
      expect(atLeastOne).toBe(true);
    },
  );

  it("2-4. POST 函数体内：合规拦截（if (关键词匹配)）必须位于 Mock/LLM 调用之前，返回 400 含「合规/违反/违法」文案", () => {
    if (!fs.existsSync(ROUTE_PATH)) return expect(true).toBe(false);
    const src = fs.readFileSync(ROUTE_PATH, "utf-8");
    const postStart = src.indexOf("async function POST");
    expect(postStart).toBeGreaterThan(0);
    const postBody = src.slice(postStart, postStart + 3500);

    // 合规拦截分支存在性
    const hasComplianceCheck =
      /(if\s*\([^)]*?(compliance|违禁|敏感|违规|违法)[^)]*?\))/i.test(postBody) ||
      /(return\s+(blocked)?|throw\s+new\s+Error\s*\(\s*["'][^"']*?(合规|违法|违规)[^"']*?["']\s*\))/i.test(
        postBody,
      );
    expect(hasComplianceCheck).toBe(true);

    // 匹配块返回 400 且含中文合规关键词
    const blockMatch = postBody.match(
      /compliance|违禁|敏感|违规|违法[^}]*?Response\.json/i,
    )?.[0] ?? "";
    const blockIdx = postBody.search(
      /(if\s*\([^)]*?(compliance|违禁|违规|违法)[^)]*\)|const\s+\w+\s*=\s*.*?(compliance|违禁|违规|违法).*?(?=;|\n))/i,
    );
    if (blockIdx === -1) return; // 已在上面 hasComplianceCheck 断言

    const response400Block = postBody.slice(blockIdx, blockIdx + 1500);
    expect(response400Block).toMatch(/status\s*:\s*400/);
    // 中文合规拒绝文案
    expect(response400Block).toMatch(/(合规|违反|违法|违规|法律法规)/);

    // 合规拦截必须位于 Mock/LLM 调用之前
    const llmOrMockIdx = postBody.search(
      /(fetch\s*\(\s*[`'"][^`'"]*ASTRBOT|ASTRBOT_API|deepseek|mockReply|MockSSE|MOCK_REPLY|new\s+ReadableStream)/i,
    );
    if (llmOrMockIdx === -1) return;
    expect(blockIdx).toBeLessThan(llmOrMockIdx);
  });
});
