/**
 * 飞讯知识库核心逻辑单测
 *
 * 覆盖：
 *   1. 存取：load/save 往返、坏数据容错、总开关默认开
 *   2. 分块：markdown 标题硬切、空行软切、超长句号续切、空块丢弃
 *   3. 检索：相关文档得分靠前、无关查询返回 null、块数上限、字数上限、停用文档不参与
 *
 * 风格：纯函数 + jsdom localStorage
 */
/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadKnowledgeDocs,
  saveKnowledgeDocs,
  createKnowledgeDoc,
  isKnowledgeEnabled,
  setKnowledgeEnabled,
  chunkDocument,
  searchKnowledge,
  buildKnowledgeContext,
  type KnowledgeDoc,
} from "../src/lib/knowledge-base";

function makeDoc(name: string, content: string, enabled = true): KnowledgeDoc {
  return { id: `id_${name}`, name, content, enabled, createdAt: 1 };
}

describe("知识库：存取与开关", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("case1: 无数据时返回空数组，总开关默认开启", () => {
    expect(loadKnowledgeDocs()).toEqual([]);
    expect(isKnowledgeEnabled()).toBe(true);
  });

  it("case2: save/load 往返一致，坏 JSON 容错为空数组", () => {
    const docs = [makeDoc("剧情设定", "达妮娅是星炬学院学生。")];
    saveKnowledgeDocs(docs);
    expect(loadKnowledgeDocs()).toEqual(docs);

    localStorage.setItem("daniya:ai:knowledge:v1", "not-json{{{");
    expect(loadKnowledgeDocs()).toEqual([]);
  });

  it("case3: 总开关写入 0 后为 false，恢复 1 后为 true", () => {
    setKnowledgeEnabled(false);
    expect(isKnowledgeEnabled()).toBe(false);
    setKnowledgeEnabled(true);
    expect(isKnowledgeEnabled()).toBe(true);
  });

  it("case4: createKnowledgeDoc 生成合法文档（默认启用、名称兜底）", () => {
    const doc = createKnowledgeDoc("", "内容");
    expect(doc.id).toMatch(/^kd_/);
    expect(doc.name).toBe("未命名资料");
    expect(doc.enabled).toBe(true);
  });
});

describe("知识库：分块", () => {
  it("case1: markdown 标题硬切分块", () => {
    const chunks = chunkDocument("# 卷一\n内容甲\n## 卷二\n内容乙");
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toContain("卷一");
    expect(chunks[1]).toContain("卷二");
  });

  it("case2: 空行在达到目标长度后软切", () => {
    const para = "字".repeat(600);
    const chunks = chunkDocument(`${para}\n\n${para}`);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.every((c) => c.length <= 800)).toBe(true);
  });

  it("case3: 超长无分隔文本按句号续切，每块不超过 800 字", () => {
    const long = "这是一个很长很长的句子。".repeat(200);
    const chunks = chunkDocument(long);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length <= 800)).toBe(true);
  });

  it("case4: 空白内容返回空数组", () => {
    expect(chunkDocument("")).toEqual([]);
    expect(chunkDocument("  \n\n  ")).toEqual([]);
  });
});

describe("知识库：检索", () => {
  const docs = [
    makeDoc("角色设定", "达妮娅是星炬学院虚质科学部的学生，粉发蓝眸。"),
    makeDoc("剧情考据", "达妮娅与残星会会长有很深的牵连，也与阿列夫一有关。"),
    makeDoc("停用文档", "达妮娅的生日是蛋糕味的。", false),
  ];

  it("case1: 相关文档得分靠前且包含命中片段", () => {
    const ctx = searchKnowledge("达妮娅和残星会会长是什么关系", docs);
    expect(ctx).not.toBeNull();
    expect(ctx).toContain("出自《剧情考据》");
    // 首个命中的应是「剧情考据」（与查询重叠度最高）
    expect(ctx!.indexOf("剧情考据")).toBeLessThan(ctx!.indexOf("角色设定"));
  });

  it("case2: 停用文档不参与检索", () => {
    const ctx = searchKnowledge("达妮娅的生日", docs);
    expect(ctx).not.toContain("停用文档");
  });

  it("case3: 完全无关的查询返回 null", () => {
    expect(searchKnowledge("今天天气怎么样", docs)).toBeNull();
  });

  it("case4: 空查询或空文档列表返回 null", () => {
    expect(searchKnowledge("   ", docs)).toBeNull();
    expect(searchKnowledge("达妮娅", [])).toBeNull();
  });

  it("case5: 检索结果总字数不超过 2000", () => {
    const big = Array.from({ length: 20 }, (_, i) =>
      makeDoc(`文档${i}`, `关于达妮娅的故事第${i}卷。${"达妮娅".repeat(400)}`),
    );
    const ctx = searchKnowledge("达妮娅的故事", big);
    expect(ctx).not.toBeNull();
    expect(ctx!.length).toBeLessThanOrEqual(2000);
  });

  it("case6: buildKnowledgeContext 受总开关控制", () => {
    expect(buildKnowledgeContext("达妮娅", docs)).toContain("【知识库检索片段】");
    setKnowledgeEnabled(false);
    expect(buildKnowledgeContext("达妮娅", docs)).toBeNull();
  });
});
