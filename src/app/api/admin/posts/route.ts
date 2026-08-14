import { requireAdmin } from "@/lib/admin";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { postMetaSchema } from "@/lib/validators/post-schema";
import { slugifyWithSuffix } from "@/lib/slugify";
import { NextResponse } from "next/server";
import { createPostMdx } from "@/lib/posts-io";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const posts = getAllPosts({ includeDrafts: true });
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { slug: customSlug, body: mdxBody, ...frontmatter } = body;

    // slug 可选：未传则由标题自动生成（带随机后缀防冲突）
    const slug = typeof customSlug === "string" && customSlug.trim()
      ? customSlug.trim()
      : slugifyWithSuffix(frontmatter.title ?? "untitled");

    // 防止路径遍历和非法字符
    const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/;
    if (!SLUG_RE.test(slug)) {
      return NextResponse.json({ error: "slug 格式不合法（仅允许小写字母、数字、连字符，3-60 字符）" }, { status: 400 });
    }

    // Validate frontmatter
    const parsed = postMetaSchema.safeParse(frontmatter);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "数据校验失败", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check slug collision
    const existing = getPostBySlug(slug);
    if (existing) {
      return NextResponse.json(
        { error: "此标识已存在，请修改标题后重试" },
        { status: 409 }
      );
    }

    const result = createPostMdx({ slug, ...parsed.data }, (mdxBody || "").trim());

    return NextResponse.json({ success: true, slug: result.slug });
  } catch (err) {
    console.error("[admin] Create post failed:", err);
    return NextResponse.json({ error: "创建文章失败" }, { status: 500 });
  }
}
