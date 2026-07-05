import { requireAdmin } from "@/lib/admin";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { postMetaSchema } from "@/lib/validators/post-schema";
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
    const { slug, body: mdxBody, ...frontmatter } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "缺少文章标识 (slug)" }, { status: 400 });
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
        { error: "此标识已存在，请修改 slug" },
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
