import { requireAdmin } from "@/lib/admin";
import { getPostContent, getPostBySlug } from "@/lib/posts";
import { postMetaSchema } from "@/lib/validators/post-schema";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content", "posts");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { slug } = await params;
  const content = getPostContent(slug);
  if (!content) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  const parsed = matter(content.rawContent);
  return NextResponse.json({ meta: content.meta, body: parsed.content });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { slug: oldSlug } = await params;

  try {
    const body = await request.json();
    const { slug: newSlug, body: mdxBody, ...frontmatter } = body;

    if (!newSlug || typeof newSlug !== "string") {
      return NextResponse.json({ error: "缺少文章标识 (slug)" }, { status: 400 });
    }

    const parsed = postMetaSchema.safeParse(frontmatter);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "数据校验失败", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check slug collision if slug changed and new slug already exists
    if (newSlug !== oldSlug) {
      const existing = getPostBySlug(newSlug);
      if (existing) {
        return NextResponse.json(
          { error: "此标识已存在，请修改 slug" },
          { status: 409 }
        );
      }
    }

    const validated = parsed.data;

    // Delete old post if slug changed
    if (newSlug !== oldSlug) {
      const oldMeta = getPostBySlug(oldSlug);
      const oldPublishedAt = oldMeta?.publishedAt || validated.publishedAt;
      const oldDirPath = path.join(CONTENT_DIR, `${oldPublishedAt}-${oldSlug}`);
      if (fs.existsSync(oldDirPath)) {
        fs.rmSync(oldDirPath, { recursive: true, force: true });
      } else {
        const oldFilePath = path.join(CONTENT_DIR, `${oldPublishedAt}-${oldSlug}.mdx`);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    const rawFrontmatter: Record<string, unknown> = {
      title: validated.title,
      description: validated.description,
      type: validated.type,
      originalCreator: validated.originalCreator,
      sourceUrl: validated.sourceUrl,
      sourcePlatform: validated.sourcePlatform,
      tags: validated.tags,
      publishedAt: validated.publishedAt,
      draft: validated.draft,
      images: validated.images,
    };
    if (validated.updatedAt) rawFrontmatter.updatedAt = validated.updatedAt;
    if (validated.videoId) rawFrontmatter.videoId = validated.videoId;

    const fileContent = matter.stringify((mdxBody || "").trim(), rawFrontmatter);

    const dirPath = path.join(CONTENT_DIR, `${validated.publishedAt}-${newSlug}`);
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(path.join(dirPath, "index.mdx"), fileContent, "utf-8");

    revalidatePath("/");
    revalidatePath(`/post/${newSlug}`);
    if (newSlug !== oldSlug) {
      revalidatePath(`/post/${oldSlug}`);
    }

    return NextResponse.json({ success: true, slug: newSlug });
  } catch (err) {
    console.error("[admin] Update post failed:", err);
    return NextResponse.json({ error: "更新文章失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { slug } = await params;

  try {
    const content = getPostContent(slug);
    if (!content) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const entries = fs.readdirSync(CONTENT_DIR);
    let deleted = false;

    for (const entry of entries) {
      const name = entry.replace(/\.mdx$/, "");
      const match = name.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
      if (match && match[1] === slug) {
        const fullPath = path.join(CONTENT_DIR, entry);
        if (fs.statSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return NextResponse.json({ error: "删除失败：文件不存在" }, { status: 404 });
    }

    revalidatePath("/");
    revalidatePath(`/post/${slug}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin] Delete post failed:", err);
    return NextResponse.json({ error: "删除文章失败" }, { status: 500 });
  }
}
