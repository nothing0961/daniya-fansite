import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitPostSchema, type SubmitPostInput } from "@/lib/validators/submit-post-schema";
import { slugifyWithSuffix } from "@/lib/slugify";
import { getPostBySlug } from "@/lib/posts";

/**
 * 用户提交待审核作品
 * - 登录（401 拦截）
 * - 字段通过 submitPostSchema（含 zod refine 互斥关系）
 * - slug 冲突检查（与现有作品 + 审核队列中任何状态对比）
 * - 写入 PendingPost(status=PENDING)
 */
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }

  const parsed = submitPostSchema.safeParse(rawBody as SubmitPostInput);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const fieldMsgs = Object.entries(flat.fieldErrors)
      .map(([k, msgs]) => `${k}: ${(msgs as string[]).join("；")}`)
      .join(" | ");
    const allMsgs = [fieldMsgs, ...flat.formErrors].filter(Boolean).join(" | ");
    return NextResponse.json(
      { error: `数据校验失败：${allMsgs || "未知错误"}`, details: flat },
      { status: 400 },
    );
  }

  const data = parsed.data;
  // MDX 正文从原始请求体读取（Zod 默认 strip 未知字段，submitPostSchema 未定义 body，因此必须从 rawBody 取）
  const rawBodyField = (rawBody as Record<string, unknown>)?.body;
  const mdxContent = typeof rawBodyField === "string" ? rawBodyField.trim() : "";

  let slug: string;
  if (data.slug) {
    slug = data.slug;
  } else {
    slug = slugifyWithSuffix(data.title);
  }

  // 防止两个投稿撞 slug
  const publishedExisting = getPostBySlug(slug);
  if (publishedExisting) {
    return NextResponse.json({ error: "此 slug 已被已发布作品占用，请修改" }, { status: 409 });
  }
  const pendingExisting = await prisma.pendingPost.findUnique({ where: { slug }, select: { id: true } });
  if (pendingExisting) {
    if (data.slug) {
      return NextResponse.json({ error: "此 slug 已被他人投稿占用，请修改" }, { status: 409 });
    }
    // 自动生成的 → 重试一次（加更长随机后缀），并二次检查防止仍冲突
    slug = slugifyWithSuffix(data.title, 8);
    const retryExisting = await prisma.pendingPost.findUnique({ where: { slug }, select: { id: true } });
    if (retryExisting) {
      return NextResponse.json({ error: "自动生成 slug 冲突，请稍后重试" }, { status: 409 });
    }
  }

  try {
    const created = await prisma.pendingPost.create({
      data: {
        userId,
        slug,
        title: data.title,
        description: data.description,
        type: data.type,
        /** 关联角色（方案 A：可空，前端默认传 DANIYA；未传时写 null 避免隐式 any） */
        character: (data.character ?? null) as "DANIYA" | null,
        images: data.images,
        videoId: data.videoId ?? null,
        tags: data.tags,
        originalCreator: data.originalCreator ?? null,
        sourcePlatform: data.sourcePlatform ?? null,
        sourceUrl: data.sourceUrl ?? null,
        content: mdxContent,
        status: "PENDING",
      },
      select: { id: true, slug: true, createdAt: true },
    });

    return NextResponse.json({ success: true, id: created.id, slug: created.slug });
  } catch (err) {
    console.error("[user] submit-post create failed:", err);
    return NextResponse.json({ error: "提交失败，请稍后重试" }, { status: 500 });
  }
}
