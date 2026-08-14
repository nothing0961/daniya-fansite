/**
 * 站内内容库检索 — 服务端 2-gram 检索（作品集 / 角色档案）
 *
 * 与客户端知识库（knowledge-base.ts）同款字符 2-gram 重叠度算法，但语料是站内内容：
 * - 角色档案：STORY_TABS 五篇故事 + 角色故事 + 共鸣报告（段落级）
 * - 作品集：content/posts 每篇的标题/描述/正文段落
 *
 * 检索结果由 route.ts 服务端注入（不进请求体、不占用户流量），带命中阈值与预算上限。
 * 语料按帖子文件 mtime 做模块级缓存（Serverless 实例存活期内有效）。
 */
import fs from "fs";
import path from "path";
import {
  STORY_TABS,
  STORY_CHAPTER,
  RESONANCE_REPORT,
} from "@/app/character/archive-data";
import { getAllPosts, getPostContent } from "@/lib/posts";

/** 站内内容库注入总字数上限（防刷屏、防超 token 预算） */
export const SITE_KNOWLEDGE_MAX_LEN = 1500 as const;
/** 命中阈值：查询 2-gram 至少命中几个才认为相关（过滤"你好"等问候语） */
export const SITE_MIN_HITS = 2 as const;
/** 得分阈值：命中数 / 查询 2-gram 总数，低于此值视为弱相关 */
export const SITE_MIN_SCORE = 0.3 as const;
/** 最多取几段资料 */
export const SITE_MAX_TOP_CHUNKS = 6 as const;

export interface SiteCorpusItem {
  label: string;
  content: string;
}

// ========================================================================
// 2-gram（与 knowledge-base.ts 保持同款实现）
// ========================================================================

export function toBigrams(text: string): Set<string> {
  const s = text.replace(/\s+/g, "");
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

// ========================================================================
// 语料构建
// ========================================================================

const PLACEHOLDER_RE = /⏳|待补充/;
const MIN_PARA_LEN = 8;

function pushParagraphs(items: SiteCorpusItem[], label: string, paras: string[]): void {
  for (const p of paras) {
    const t = p.trim();
    if (!t || t.length < MIN_PARA_LEN || PLACEHOLDER_RE.test(t)) continue;
    items.push({ label, content: t });
  }
}

/** 超长段落按句号续切，上限 800 字 */
function splitLong(text: string, max = 800): string[] {
  if (text.length <= max) return [text];
  const parts: string[] = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf("。", max);
    if (cut < 400) cut = rest.lastIndexOf("！", max);
    if (cut < 400) cut = rest.lastIndexOf("？", max);
    if (cut < 400) cut = rest.lastIndexOf("\n", max);
    if (cut < 400) cut = max;
    parts.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1);
  }
  if (rest.trim()) parts.push(rest.trim());
  return parts;
}

function splitParagraphs(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    for (const p of splitLong(line)) {
      const t = p.trim();
      if (t.length >= MIN_PARA_LEN) out.push(t);
    }
  }
  return out;
}

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---[\s\S]*?---\s*/, "");
}

function collectArchive(): SiteCorpusItem[] {
  const items: SiteCorpusItem[] = [];
  pushParagraphs(items, `角色档案「${STORY_CHAPTER.title}」`, STORY_CHAPTER.body);
  for (const tab of STORY_TABS) {
    pushParagraphs(items, `角色档案「${tab.label}」`, tab.body);
  }
  const report: string[] = [RESONANCE_REPORT.ability];
  for (const sub of RESONANCE_REPORT.subSections) {
    report.push(`${sub.title}：${sub.body.join("")}`);
    if (sub.quotes) report.push(sub.quotes.join(""));
  }
  pushParagraphs(items, "角色档案「共鸣报告」", report);
  return items;
}

function collectPosts(): SiteCorpusItem[] {
  const items: SiteCorpusItem[] = [];
  for (const post of getAllPosts()) {
    const label = `作品《${post.title}》`;
    const intro = `${post.title}。${post.description ?? ""}`.trim();
    if (intro.length >= MIN_PARA_LEN) items.push({ label, content: intro });
    const full = getPostContent(post.slug);
    if (full) {
      for (const para of splitParagraphs(stripFrontmatter(full.rawContent))) {
        items.push({ label, content: para });
      }
    }
  }
  return items;
}

// ========================================================================
// 模块级缓存（按帖子文件 mtime 指纹失效）
// ========================================================================

let cachedKey = "";
let cachedCorpus: SiteCorpusItem[] | null = null;

function postFileFingerprint(): string {
  const dir = path.join(process.cwd(), "content", "posts");
  try {
    const entries = fs.readdirSync(dir);
    const files: string[] = [];
    for (const e of entries) {
      const p = path.join(dir, e);
      if (fs.statSync(p).isDirectory()) {
        const idx = path.join(p, "index.mdx");
        if (fs.existsSync(idx)) files.push(idx);
      } else if (e.endsWith(".mdx")) {
        files.push(p);
      }
    }
    return files.map((f) => `${f}:${fs.statSync(f).mtimeMs}`).join("|");
  } catch {
    return "";
  }
}

export function buildSiteCorpus(): SiteCorpusItem[] {
  const key = postFileFingerprint();
  if (key && key === cachedKey && cachedCorpus) return cachedCorpus;
  const corpus = [...collectArchive(), ...collectPosts()];
  cachedKey = key;
  cachedCorpus = corpus;
  return corpus;
}

// ========================================================================
// 检索
// ========================================================================

export function searchSiteKnowledge(
  query: string,
  corpus?: SiteCorpusItem[],
): string | null {
  const src = corpus ?? buildSiteCorpus();
  const q = query.trim();
  const qGrams = toBigrams(q);
  if (qGrams.size === 0 || src.length === 0) return null;

  const scored: { label: string; content: string; hits: number; score: number }[] = [];
  for (const item of src) {
    const grams = toBigrams(item.content);
    let hit = 0;
    for (const g of qGrams) if (grams.has(g)) hit++;
    if (hit >= SITE_MIN_HITS) {
      scored.push({ label: item.label, content: item.content, hits: hit, score: hit / qGrams.size });
    }
  }
  if (scored.length === 0) return null;

  const top = scored
    .filter((s) => s.score >= SITE_MIN_SCORE)
    .sort((a, b) => b.score - a.score || b.hits - a.hits)
    .slice(0, SITE_MAX_TOP_CHUNKS);
  if (top.length === 0) return null;

  // 按出处分组，保证出处标注只出现一次
  const byLabel = new Map<string, string[]>();
  for (const t of top) {
    const arr = byLabel.get(t.label) ?? [];
    arr.push(t.content);
    byLabel.set(t.label, arr);
  }

  let out = "";
  for (const [label, chunks] of byLabel) {
    if (out.length >= SITE_KNOWLEDGE_MAX_LEN) break;
    out += `\n## ${label}\n${chunks.join("\n\n")}`;
  }
  const trimmed = out.slice(0, SITE_KNOWLEDGE_MAX_LEN).trim();
  return trimmed || null;
}

/** route.ts 调用：命中时返回带标识前缀的检索片段，否则 null */
export function buildSiteKnowledgeContext(query: string): string | null {
  const ctx = searchSiteKnowledge(query);
  return ctx ? `【站内内容库检索片段】\n${ctx}` : null;
}
