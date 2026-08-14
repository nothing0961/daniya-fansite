/**
 * 需求：聊天工具层（站内事务，聊天机器人定位）
 *
 * 断言：
 *   1. 工具清单齐全（10 个，三类：站内只读 / 个人数据 / 写入 + 导航）
 *   2. CHAT_TOOLS_SCHEMAS 为 OpenAI 风格 function schema
 *   3. 未知工具名 → 失败结果
 *   4. 站内只读：站点统计 / 作品检索（含过滤）/ 作品详情 / 角色档案
 *   5. 导航：navigateTo 合法页面 → navPage + 成功文案；未知页面 → 失败
 *   6. 个人数据 / 写入类工具走 DB（真实数据由浏览器端到端验证，单测不触碰数据库）
 *
 * 风格：真实 import 单元测试
 */
import { describe, it, expect } from "vitest";
import {
  CHAT_TOOLS,
  CHAT_TOOLS_SCHEMAS,
  CHAT_TOOL_RESULT_MAX_LEN,
  executeChatTool,
} from "@/lib/chat-tools";

const CTX = { userId: "test-user", username: "tester", quotaLimit: 200 };

describe("聊天工具层：清单与 schema", () => {
  it("10 个工具齐全（只读 4 + 个人 3 + 写入 2 + 导航 1）", () => {
    const names = CHAT_TOOLS.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        "getSiteStats",
        "searchWorks",
        "getWorkDetail",
        "getCharacterProfile",
        "getMyFavorites",
        "getMySubmissions",
        "getMyQuota",
        "toggleFavorite",
        "likeWork",
        "navigateTo",
      ].sort(),
    );
  });

  it("每个工具都有描述与参数 schema", () => {
    for (const t of CHAT_TOOLS) {
      expect(t.description.length).toBeGreaterThan(10);
      expect(t.parameters).toBeTruthy();
      expect(t.parameters.type).toBe("object");
    }
  });

  it("CHAT_TOOLS_SCHEMAS 为 OpenAI 风格 function schema", () => {
    expect(CHAT_TOOLS_SCHEMAS.length).toBe(CHAT_TOOLS.length);
    for (const s of CHAT_TOOLS_SCHEMAS) {
      expect(s.type).toBe("function");
      expect(typeof s.function.name).toBe("string");
      expect(typeof s.function.description).toBe("string");
      expect(s.function.parameters.type).toBe("object");
    }
  });

  it("未知工具名 → 失败结果", async () => {
    const res = await executeChatTool("notATool", {}, CTX);
    expect(res.ok).toBe(false);
    expect(res.content).toContain("未知工具");
  });
});

describe("聊天工具层：站内只读", () => {
  it("getSiteStats：站点统计（作品总数）", async () => {
    const res = await executeChatTool("getSiteStats", {}, CTX);
    expect(res.ok).toBe(true);
    expect(res.content).toMatch(/作品共 \d+ 篇/);
  });

  it("searchWorks：按关键词检索（真实语料命中样本作品）", async () => {
    const res = await executeChatTool("searchWorks", { query: "达妮娅" }, CTX);
    expect(res.ok).toBe(true);
    expect(res.content).toContain("测试");
  });

  it("searchWorks：无结果返回空态文案", async () => {
    const res = await executeChatTool("searchWorks", { query: "zzzzzz" }, CTX);
    expect(res.ok).toBe(true);
    expect(res.content).toContain("没有找到匹配的作品");
  });

  it("searchWorks：type 过滤（video 类型当前无作品）", async () => {
    const res = await executeChatTool("searchWorks", { type: "video" }, CTX);
    expect(res.ok).toBe(true);
    expect(res.content).toContain("没有找到匹配的作品");
  });

  it("getWorkDetail：已知 slug 返回作品详情", async () => {
    const res = await executeChatTool("getWorkDetail", { slug: "sample-illustration" }, CTX);
    expect(res.ok).toBe(true);
    expect(res.content).toContain("《测试》");
    expect(res.content).toContain("illustration");
  });

  it("getWorkDetail：未知 slug 返回失败", async () => {
    const res = await executeChatTool("getWorkDetail", { slug: "no-such-work" }, CTX);
    expect(res.ok).toBe(false);
    expect(res.content).toContain("没有找到");
  });

  it("getCharacterProfile：包含共鸣能力与故事章节", async () => {
    const res = await executeChatTool("getCharacterProfile", {}, CTX);
    expect(res.ok).toBe(true);
    expect(res.content).toContain("泡影视阈");
    expect(res.content).toContain("礼物");
    expect(res.content).toContain("荒芜");
    expect(res.content).toContain("角色档案");
  });
});

describe("聊天工具层：导航", () => {
  it("navigateTo：合法页面 → navPage + 成功文案", async () => {
    const res = await executeChatTool("navigateTo", { page: "works" }, CTX);
    expect(res.ok).toBe(true);
    expect(res.navPage).toBe("works");
    expect(res.content).toContain("作品集");
  });

  it("navigateTo：未知页面 → 失败", async () => {
    const res = await executeChatTool("navigateTo", { page: "nowhere" }, CTX);
    expect(res.ok).toBe(false);
  });
});

describe("聊天工具层：结果上限", () => {
  it("CHAT_TOOL_RESULT_MAX_LEN 常量存在且大于 0", () => {
    expect(CHAT_TOOL_RESULT_MAX_LEN).toBeGreaterThan(0);
    expect(CHAT_TOOL_RESULT_MAX_LEN).toBeLessThanOrEqual(2000);
  });
});
