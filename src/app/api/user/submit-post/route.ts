import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { submitPostSchema, type SubmitPostInput } from "@/lib/validators/submit-post-schema";
import { slugifyWithSuffix } from "@/lib/slugify";
import { getPostBySlug } from "@/lib/posts";
import { createPostMdx } from "@/lib/posts-io";
import { postMetaSchema } from "@/lib/validators/post-schema";
import type { PostType, SourcePlatform } from "@/types/post";

/**
 * 用户提交待审核作品
 * - 登录（401 拦截）
 * - 字段通过 submitPostSchema（含 zod refine 互斥关系）
 * - slug 冲突检查（与现有作品 + 审核队列中任何状态对比）
 * - 站长（ADMIN_USER_ID）投稿：直接生成 MDX 发布，返回 publishedSlug，不走审核
 * - 普通用户：写入 PendingPost(status=PENDING) + 站内通知站长
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

  // slug 由标题自动生成（带随机后缀防冲突），先与已发布作品对比
  let slug = slugifyWithSuffix(data.title);
  const publishedExisting = getPostBySlug(slug);
  if (publishedExisting) {
    return NextResponse.json({ error: "此标识已被已发布作品占用，请重试" }, { status: 409 });
  }
  // 与审核队列中任何状态对比，撞了则重试一次（加更长随机后缀）并二次检查
  const pendingExisting = await prisma.pendingPost.findUnique({ where: { slug }, select: { id: true } });
  if (pendingExisting) {
    slug = slugifyWithSuffix(data.title, 8);
    const retryExisting = await prisma.pendingPost.findUnique({ where: { slug }, select: { id: true } });
    if (retryExisting) {
      return NextResponse.json({ error: "自动生成标识冲突，请稍后重试" }, { status: 409 });
    }
  }

  // ===== 站长直发：不写 PendingPost，直接生成 MDX 发布 =====
  const isAdmin = userId === process.env.ADMIN_USER_ID;
  if (isAdmin) {
    // 补全 postMetaSchema 需要的字段（与审核通过时的默认值保持一致）
    const publishedAt = new Date().toISOString().slice(0, 10);
    const originalCreator = (data.originalCreator ?? "站长投稿").slice(0, 60);
    const sourcePlatform = (data.sourcePlatform ?? "other") as SourcePlatform;
    const sourceUrl = data.sourceUrl ?? `https://example.com/admin-post/${slug}`;

    const metaPayload = {
      title: data.title,
      description: data.description,
      type: data.type as PostType,
      character: (data.character ?? undefined) as "DANIYA" | undefined,
      originalCreator,
      sourcePlatform,
      sourceUrl,
      tags: data.tags,
      publishedAt,
      draft: false,
      images: data.images,
      updatedAt: undefined,
    };
    const parsedMeta = postMetaSchema.safeParse(metaPayload);
    if (!parsedMeta.success) {
      return NextResponse.json(
        { error: "生成作品时字段校验失败", details: parsedMeta.error.flatten() },
        { status: 422 },
      );
    }

    try {
      const mdxResult = createPostMdx({ slug, ...parsedMeta.data }, mdxContent);
      revalidatePath("/");
      revalidatePath(`/post/${mdxResult.slug}`);
      return NextResponse.json({ success: true, publishedSlug: mdxResult.slug });
    } catch (err) {
      console.error("[user] admin direct publish failed:", err);
      return NextResponse.json({ error: "发布失败，请稍后重试" }, { status: 500 });
    }
  }

  // ===== 普通用户：写入 PendingPost 等待审核 =====
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
        tags: data.tags,
        originalCreator: data.originalCreator ?? null,
        sourcePlatform: data.sourcePlatform ?? null,
        sourceUrl: data.sourceUrl ?? null,
        content: mdxContent,
        status: "PENDING",
      },
      select: { id: true, slug: true, createdAt: true },
    });

    // 通知站长（失败不影响投稿本身）
    if (process.env.ADMIN_USER_ID) {
      try {
        await prisma.notification.create({
          data: {
            userId: process.env.ADMIN_USER_ID,
            type: "SUBMISSION",
            title: `新的投稿：《${data.title.slice(0, 30)}》`,
            body: `${session.user?.name ?? "一位访客"} 提交了作品，等待审核`,
            link: "/dashboard/moderation",
          },
        });
      } catch (err) {
        console.error("[user] notify admin failed:", err);
      }
    }

    return NextResponse.json({ success: true, id: created.id, slug: created.slug });
  } catch (err) {
    console.error("[user] submit-post create failed:", err);
    return NextResponse.json({ error: "提交失败，请稍后重试" }, { status: 500 });
  }
}
