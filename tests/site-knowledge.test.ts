/**
 * 需求：站内内容库检索（服务端 2-gram，作品集 / 角色档案语料）
 *
 * 断言：
 *   1. toBigrams 字符 2-gram（与客户端知识库同款）
 *   2. 真实语料构建：角色档案（五篇故事 + 共鸣报告）标签齐全
 *   3. 命中：查询角色关键内容 → 返回对应出处的资料片段
 *   4. 不命中：问候语 / 无关词 → null（阈值过滤）
 *   5. 得分阈值：命中数低于 SITE_MIN_SCORE 视为弱相关 → null
 *   6. 预算上限：输出不超过 SITE_KNOWLEDGE_MAX_LEN
 *   7. 条数上限：最多 SITE_MAX_TOP_CHUNKS 个出处，同出处只标注一次
 *   8. buildSiteKnowledgeContext 带【站内内容库检索片段】前缀
 *
 * 风格：真实 import 单元测试（语料用 override 参数构造，阈值断言确定性优先）
 */
import { describe, it, expect } from "vitest";
import {
  toBigrams,
  buildSiteCorpus,
  searchSiteKnowledge,
  buildSiteKnowledgeContext,
  SITE_MIN_HITS,
  SITE_MIN_SCORE,
  SITE_KNOWLEDGE_MAX_LEN,
  SITE_MAX_TOP_CHUNKS,
  type SiteCorpusItem,
} from "@/lib/site-knowledge";

describe("站内内容库：2-gram 与语料", () => {
  it("toBigrams 产出字符 2-gram（去空白、去重）", () => {
    expect([...toBigrams("达妮娅")].sort()).toEqual(["妮娅", "达妮"]);
    expect([...toBigrams("a b")].sort()).toEqual(["ab"]);
    expect(toBigrams("哈哈哈").size).toBe(1);
  });

  it("真实语料可构建，包含角色档案全部出处标签", () => {
    const corpus = buildSiteCorpus();
    expect(corpus.length).toBeGreaterThan(0);
    const labels = new Set(corpus.map((c) => c.label));
    expect(labels.has("角色档案「礼物」")).toBe(true);
    expect(labels.has("角色档案「荒芜」")).toBe(true);
    expect(labels.has("角色档案「明昼」")).toBe(true);
    expect(labels.has("角色档案「群魔」")).toBe(true);
    expect(labels.has("角色档案「谎言」")).toBe(true);
    expect(labels.has("角色档案「共鸣报告」")).toBe(true);
    expect(labels.has("角色档案「角色故事」")).toBe(true);
    // 所有条目都非空且不含占位符
    for (const item of corpus) {
      expect(item.content.trim().length).toBeGreaterThan(0);
      expect(item.content).not.toMatch(/⏳|待补充/);
    }
  });
});

describe("站内内容库：检索命中与阈值", () => {
  it("命中：真实语料查询「阿列夫一」返回荒芜/群魔段落", () => {
    const ctx = searchSiteKnowledge("阿列夫一");
    expect(ctx).not.toBeNull();
    expect(ctx!.length).toBeLessThanOrEqual(SITE_KNOWLEDGE_MAX_LEN);
    // 荒芜篇明确包含「阿列夫一力量」段落
    expect(ctx).toContain("阿列夫一");
  });

  it("命中：真实语料查询「西格莉卡」返回明昼篇相关段落", () => {
    const ctx = searchSiteKnowledge("西格莉卡是谁");
    expect(ctx).not.toBeNull();
    expect(ctx).toContain("西格莉卡");
  });

  it("不命中：问候语（你好）不触发检索", () => {
    expect(searchSiteKnowledge("你好")).toBeNull();
    expect(searchSiteKnowledge("晚安")).toBeNull();
  });

  it("不命中：无关词返回 null", () => {
    expect(searchSiteKnowledge("qqqqqq")).toBeNull();
  });

  it("得分阈值：命中数足够但占比低于 SITE_MIN_SCORE → null", () => {
    // 「达妮娅」2-gram 全命中（hit=2 ≥ MIN_HITS），但 query 共 10 个 2-gram，score=0.2 < 0.3
    const corpus: SiteCorpusItem[] = [{ label: "x", content: "达妮娅" }];
    expect(searchSiteKnowledge("达妮娅今天天气真不错啊", corpus)).toBeNull();
    // 同一语料短查询命中即返回
    expect(searchSiteKnowledge("达妮娅", corpus)).toContain("达妮娅");
  });

  it("阈值常量：MIN_HITS=2 / MIN_SCORE=0.3", () => {
    expect(SITE_MIN_HITS).toBe(2);
    expect(SITE_MIN_SCORE).toBe(0.3);
  });
});

describe("站内内容库：预算与条数上限", () => {
  it("输出不超过 SITE_KNOWLEDGE_MAX_LEN", () => {
    const corpus: SiteCorpusItem[] = Array.from({ length: 8 }, (_, i) => ({
      label: `出处${i}`,
      content: "阿列夫一的力量。" .repeat(60), // ~300 字，全部命中
    }));
    const ctx = searchSiteKnowledge("阿列夫一", corpus);
    expect(ctx).not.toBeNull();
    expect(ctx!.length).toBeLessThanOrEqual(SITE_KNOWLEDGE_MAX_LEN);
  });

  it("最多 SITE_MAX_TOP_CHUNKS 个出处（超出按得分截断）", () => {
    const corpus: SiteCorpusItem[] = Array.from({ length: 10 }, (_, i) => ({
      label: `出处${i}`,
      content: "阿列夫一与残星会的容器计划",
    }));
    const ctx = searchSiteKnowledge("阿列夫一", corpus);
    const headers = (ctx!.match(/^## /gm) ?? []).length;
    expect(headers).toBeLessThanOrEqual(SITE_MAX_TOP_CHUNKS);
    expect(headers).toBe(SITE_MAX_TOP_CHUNKS);
  });

  it("同出处多段只标注一次（分组输出）", () => {
    const corpus: SiteCorpusItem[] = [
      { label: "同组", content: "阿列夫一的故事一" },
      { label: "同组", content: "阿列夫一的故事二" },
    ];
    const ctx = searchSiteKnowledge("阿列夫一", corpus);
    const headers = (ctx!.match(/^## /gm) ?? []).length;
    expect(headers).toBe(1);
    expect(ctx).toContain("故事一");
    expect(ctx).toContain("故事二");
  });
});

describe("站内内容库：context 构建", () => {
  it("buildSiteKnowledgeContext 命中时带【站内内容库检索片段】前缀", () => {
    const ctx = buildSiteKnowledgeContext("阿列夫一");
    expect(ctx).not.toBeNull();
    expect(ctx!.startsWith("【站内内容库检索片段】")).toBe(true);
  });

  it("buildSiteKnowledgeContext 不命中时返回 null", () => {
    expect(buildSiteKnowledgeContext("你好")).toBeNull();
  });
});
