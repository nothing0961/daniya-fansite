/**
 * 飞讯知识库 — 本地明文存储 + 轻量检索
 *
 * 设计：
 * - 文档明文存 localStorage（key: daniya:ai:knowledge:v1），不加密（用户自选）
 * - 总开关单独存（key: daniya:ai:knowledge:enabled，默认开）
 * - 发送消息前客户端分块 + 2-gram 检索，top 块拼成 knowledgeContext 随请求体发送
 * - 分块：markdown 标题（#~###）硬切，空行软切，超 800 字按句号续切
 */
export interface KnowledgeDoc {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
  createdAt: number;
}

const STORAGE_KEY = "daniya:ai:knowledge:v1";
const ENABLED_KEY = "daniya:ai:knowledge:enabled";

/** 分块参数 */
const CHUNK_TARGET = 500; // 空行软切的目标字数
const CHUNK_MAX = 800; // 块长上限，超出按句号续切
/** 检索参数 */
const MAX_TOP_CHUNKS = 5; // 最多取几块
const MAX_CONTEXT_LEN = 2000; // knowledgeContext 总字数上限

function generateId(): string {
  return `kd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ========================================================================
// 存储
// ========================================================================

export function loadKnowledgeDocs(): KnowledgeDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (d): d is KnowledgeDoc =>
        d &&
        typeof d === "object" &&
        typeof d.id === "string" &&
        typeof d.name === "string" &&
        typeof d.content === "string",
    );
  } catch {
    return [];
  }
}

export function saveKnowledgeDocs(docs: KnowledgeDoc[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch {
    // localStorage 超限或不可用时静默失败
  }
}

export function createKnowledgeDoc(name: string, content: string): KnowledgeDoc {
  return {
    id: generateId(),
    name: name.trim() || "未命名资料",
    content,
    enabled: true,
    createdAt: Date.now(),
  };
}

export function isKnowledgeEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setKnowledgeEnabled(on: boolean): void {
  try {
    localStorage.setItem(ENABLED_KEY, on ? "1" : "0");
  } catch {
    // noop
  }
}

// ========================================================================
// 分块
// ========================================================================

function splitLong(text: string): string[] {
  if (text.length <= CHUNK_MAX) return [text.trim()];
  const parts: string[] = [];
  let rest = text;
  while (rest.length > CHUNK_MAX) {
    let cut = rest.lastIndexOf("。", CHUNK_MAX);
    if (cut < CHUNK_TARGET) cut = rest.lastIndexOf("！", CHUNK_MAX);
    if (cut < CHUNK_TARGET) cut = rest.lastIndexOf("？", CHUNK_MAX);
    if (cut < CHUNK_TARGET) cut = rest.lastIndexOf("\n", CHUNK_MAX);
    if (cut < CHUNK_TARGET) cut = CHUNK_MAX;
    parts.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1);
  }
  if (rest.trim()) parts.push(rest.trim());
  return parts;
}

export function chunkDocument(content: string): string[] {
  const chunks: string[] = [];
  let current = "";
  const flush = () => {
    const t = current.trim();
    if (t) for (const c of splitLong(t)) chunks.push(c);
    current = "";
  };
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      // 空行：软分隔，达到目标长度才切
      if (current.trim().length >= CHUNK_TARGET) flush();
      else current += "\n";
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      // markdown 标题：硬切，新块开始
      flush();
      current = line + "\n";
      continue;
    }
    current += raw + "\n";
    if (current.length >= CHUNK_MAX) flush();
  }
  flush();
  return chunks;
}

// ========================================================================
// 检索（字符 2-gram 重叠度，无需分词库）
// ========================================================================

function toBigrams(text: string): Set<string> {
  const s = text.replace(/\s+/g, "");
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

export function searchKnowledge(
  query: string,
  docs: KnowledgeDoc[],
): string | null {
  const enabled = docs.filter((d) => d.enabled && d.content.trim());
  if (enabled.length === 0) return null;
  const q = query.trim();
  const qGrams = toBigrams(q);
  if (qGrams.size === 0) return null;

  const scored: { name: string; chunk: string; score: number }[] = [];
  for (const doc of enabled) {
    const chunkGramsCache = new Map<string, Set<string>>();
    for (const chunk of chunkDocument(doc.content)) {
      let grams = chunkGramsCache.get(chunk);
      if (!grams) {
        grams = toBigrams(chunk);
        chunkGramsCache.set(chunk, grams);
      }
      let hit = 0;
      for (const g of qGrams) if (grams.has(g)) hit++;
      if (hit > 0) scored.push({ name: doc.name, chunk, score: hit / qGrams.size });
    }
  }
  if (scored.length === 0) return null;

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, MAX_TOP_CHUNKS);

  // 按文档分组，保证出处标注只出现一次
  const byDoc = new Map<string, string[]>();
  for (const item of top) {
    const arr = byDoc.get(item.name) ?? [];
    arr.push(item.chunk);
    byDoc.set(item.name, arr);
  }

  let out = "";
  for (const [name, chunks] of byDoc) {
    if (out.length >= MAX_CONTEXT_LEN) break;
    out += `\n## 出自《${name}》\n${chunks.join("\n\n")}`;
  }
  return out.slice(0, MAX_CONTEXT_LEN).trim();
}

/** 发送消息前调用：总开关开启时返回检索片段，否则 null */
export function buildKnowledgeContext(
  query: string,
  docs: KnowledgeDoc[],
): string | null {
  if (!isKnowledgeEnabled()) return null;
  const ctx = searchKnowledge(query, docs);
  return ctx ? `【知识库检索片段】\n${ctx}` : null;
}
