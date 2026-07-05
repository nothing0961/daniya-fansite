/**
 * 写 MDX 作品文件到本地 content/posts/ 目录
 * - 从 admin/posts API 与 moderation 审核通过逻辑中抽出来复用
 * - 不做权限校验（调用方负责）
 */
import matter from "gray-matter";
import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { PostMetaInput } from "@/lib/validators/post-schema";

const CONTENT_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "posts");

interface CreatePostResult {
  slug: string;
  /** 生成的作品目录绝对路径 */
  dirPath: string;
  /** index.mdx 绝对路径 */
  filePath: string;
  /** 写入的 frontmatter（实际写入的，便于返回前端预览）*/
  frontmatter: Record<string, unknown>;
}

/**
 * 根据字段创建 MDX 文件
 * @param meta 前台作品 frontmatter（已经通过 postMetaSchema 校验的合法结构）
 * @param mdxBody MDX 正文（不含 frontmatter 三条杠）
 * @returns slug、路径、实际 frontmatter
 */
export function createPostMdx(
  meta: PostMetaInput & { slug: string },
  mdxBody: string,
): CreatePostResult {
  const { slug, ...frontmatterMeta } = meta;
  const rawFrontmatter: Record<string, unknown> = {
    title: frontmatterMeta.title,
    description: frontmatterMeta.description,
    type: frontmatterMeta.type,
    originalCreator: frontmatterMeta.originalCreator,
    sourceUrl: frontmatterMeta.sourceUrl,
    sourcePlatform: frontmatterMeta.sourcePlatform,
    tags: frontmatterMeta.tags,
    publishedAt: frontmatterMeta.publishedAt,
    draft: frontmatterMeta.draft ?? false,
    images: frontmatterMeta.images ?? [],
  };
  if (frontmatterMeta.updatedAt) rawFrontmatter.updatedAt = frontmatterMeta.updatedAt;
  if (frontmatterMeta.videoId) rawFrontmatter.videoId = frontmatterMeta.videoId;

  const fileContent = matter.stringify((mdxBody || "").trim(), rawFrontmatter);
  const dirPath = path.join(CONTENT_DIR, `${frontmatterMeta.publishedAt}-${slug}`);
  const filePath = path.join(dirPath, "index.mdx");

  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(filePath, fileContent, "utf-8");

  // 同步刷新首页、作品详情页缓存（Next.js ISR）
  revalidatePath("/");
  revalidatePath(`/post/${slug}`);

  return { slug, dirPath, filePath, frontmatter: rawFrontmatter };
}
