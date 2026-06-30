/**
 * 作品内容读取工具
 * 扫描 content/posts/ 目录下的 MDX 文件，解析 frontmatter
 * 提供 getAllPosts / getPostBySlug / getPostsByType / getPostsByTag 等函数
 *
 * 内容架构：
 * content/posts/<YYYY>-<MM>-<DD>-<slug>/index.mdx  → 目录形式（可含配图）
 * content/posts/<YYYY>-<MM>-<DD>-<slug>.mdx         → 单文件形式
 *
 * 修改方式：
 * - 修改 CONTENT_DIR 可改变内容目录位置
 * - 新增查询函数参考现有模式：读文件 → 解析 frontmatter → 过滤返回
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { postMetaSchema, type PostMetaInput } from "@/lib/validators/post-schema";

/** 内容目录路径 — 相对于项目根目录 */
const CONTENT_DIR = path.join(process.cwd(), "content", "posts");

/** 导出的作品元数据类型 */
export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  type: PostMetaInput["type"];
  originalCreator: string;
  sourceUrl: string;
  sourcePlatform: PostMetaInput["sourcePlatform"];
  tags: string[];
  publishedAt: string;
  updatedAt?: string;
  draft: boolean;
  images: string[];
  videoId?: string;
}

/**
 * 解析单个 post 的文件路径
 * 文件命名格式为 YYYY-MM-DD-slug(.mdx 或 目录)
 * 扫描 CONTENT_DIR 找到匹配 slug 的条目
 * 目录形式（slug/index.mdx）优先于单文件形式（slug.mdx）
 */
function resolvePostPath(slug: string): { file: string; dir: string } | null {
  if (!fs.existsSync(CONTENT_DIR)) return null;

  const entries = fs.readdirSync(CONTENT_DIR);
  let fileResult: string | null = null;
  let dirResult: string | null = null;

  for (const entry of entries) {
    // 去掉 .mdx 后缀获取名称部分
    const name = entry.replace(/\.mdx$/, "");
    // 匹配 YYYY-MM-DD-slug 格式，提取 slug 部分
    const match = name.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
    if (match && match[1] === slug) {
      const fullPath = path.join(CONTENT_DIR, entry);
      // 目录形式优先
      if (fs.statSync(fullPath).isDirectory()) {
        const indexFile = path.join(fullPath, "index.mdx");
        if (fs.existsSync(indexFile)) {
          return { file: indexFile, dir: fullPath };
        }
      } else if (!fileResult) {
        // 单文件形式作为备选
        dirResult = path.dirname(fullPath);
        fileResult = fullPath;
      }
    }
  }

  if (fileResult) {
    return { file: fileResult, dir: dirResult! };
  }

  return null;
}

/**
 * 从文件名解析发布时间和 slug
 * 文件名格式：YYYY-MM-DD-slug(.mdx 或目录)
 * 例如：2026-06-15-daniya-fanart → slug="daniya-fanart"
 */
function parseFileName(entryName: string): {
  slug: string;
  publishedAt: string;
} | null {
  // 去掉 .mdx 后缀（如果是单文件形式）
  const name = entryName.replace(/\.mdx$/, "");

  // 匹配 YYYY-MM-DD-slug 格式
  const match = name.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  if (!match) return null;

  return {
    publishedAt: match[1],
    slug: match[2],
  };
}

/**
 * 读取并解析单个 MDX 文件的 frontmatter
 * 返回经过 Zod 校验的元数据，校验失败时返回 null
 */
function readPostMeta(
  filePath: string,
  slug: string,
  dir: string,
  fileNameDate?: string
): PostMeta | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);

    // 如果文件名包含日期，优先使用文件名的日期
    const frontmatterInput = {
      ...data,
      publishedAt: data.publishedAt || fileNameDate,
    };

    // Zod 校验 frontmatter
    const parsed = postMetaSchema.safeParse(frontmatterInput);
    if (!parsed.success) {
      console.warn(
        `[posts] Frontmatter validation failed for "${slug}":`,
        parsed.error.flatten()
      );
      return null;
    }

    return {
      slug,
      ...parsed.data,
    };
  } catch (err) {
    console.error(`[posts] Failed to read post "${slug}":`, err);
    return null;
  }
}

/**
 * 获取所有作品元数据（按发布日期倒序）
 * 草稿仅在开发环境显示
 * 每个 post slug 只保留一个版本（优先目录形式）
 */
export function getAllPosts(): PostMeta[] {
  // 确保目录存在
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(CONTENT_DIR);
  const seenSlugs = new Set<string>();
  const posts: PostMeta[] = [];

  for (const entry of entries) {
    // 跳过非相关文件（如 .DS_Store）
    if (entry.startsWith(".")) continue;

    const parsed = parseFileName(entry);
    if (!parsed) continue;

    const { slug, publishedAt: fileNameDate } = parsed;

    // 去重：同一个 slug 的目录和单文件同时存在时，优先目录
    if (seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const resolved = resolvePostPath(slug);
    if (!resolved) continue;

    const meta = readPostMeta(resolved.file, slug, resolved.dir, fileNameDate);
    if (!meta) continue;

    // 草稿仅在开发环境显示
    if (meta.draft && process.env.NODE_ENV === "production") continue;

    posts.push(meta);
  }

  // 按发布日期倒序排列
  posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return posts;
}

/**
 * 根据 slug 获取单篇作品元数据
 * 返回 null 表示未找到或校验失败
 */
export function getPostBySlug(slug: string): PostMeta | null {
  const resolved = resolvePostPath(slug);
  if (!resolved) return null;

  return readPostMeta(resolved.file, slug, resolved.dir);
}

/**
 * 按作品类型筛选
 */
export function getPostsByType(type: string): PostMeta[] {
  const all = getAllPosts();
  return all.filter((post) => post.type === type);
}

/**
 * 按标签筛选
 */
export function getPostsByTag(tag: string): PostMeta[] {
  const all = getAllPosts();
  return all.filter((post) => post.tags.includes(tag));
}

/**
 * 获取所有标签及其作品数量（用于标签云/侧边栏）
 */
export function getAllTags(): { tag: string; count: number }[] {
  const all = getAllPosts();
  const tagMap = new Map<string, number>();

  for (const post of all) {
    for (const tag of post.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 获取所有作品类型及其数量
 */
export function getAllTypes(): { type: string; count: number }[] {
  const all = getAllPosts();
  const typeMap = new Map<string, number>();

  for (const post of all) {
    typeMap.set(post.type, (typeMap.get(post.type) || 0) + 1);
  }

  return Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 读取 MDX 原始内容（用于详情页渲染）
 * 返回 { meta, rawContent } — meta 是校验后的元数据，rawContent 是 MDX 原始文本
 */
export function getPostContent(
  slug: string
): { meta: PostMeta; rawContent: string } | null {
  const resolved = resolvePostPath(slug);
  if (!resolved) return null;

  const meta = getPostBySlug(slug);
  if (!meta) return null;

  try {
    const rawContent = fs.readFileSync(resolved.file, "utf-8");
    return { meta, rawContent };
  } catch {
    return null;
  }
}
