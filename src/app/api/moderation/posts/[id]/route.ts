import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPostMdx } from "@/lib/posts-io";
import { getPostBySlug } from "@/lib/posts";
import { postMetaSchema } from "@/lib/validators/post-schema";
import type { PostType } from "@/types/post";

/**
 * GET 管理员查看单条投稿详情
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const post = await prisma.pendingPost.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true, image: true, createdAt: true } } },
  });
  if (!post) {
    return NextResponse.json({ error: "投稿不存在" }, { status: 404 });
  }
  return NextResponse.json(post);
}

type ModerationAction = "approve" | "reject";

interface ModerationBody {
  action: ModerationAction;
  /** approve 时可以覆盖这些字段（因为投稿里可能 originalCreator/sourcePlatform 是空的，人工审核时补全）*/
  overrides?: {
    title?: string;
    description?: string;
    originalCreator?: string;
    sourcePlatform?: string;
    sourceUrl?: string;
    tags?: string[];
    publishedAt?: string; // ISO 日期字符串
    draft?: boolean;
  };
  /** reject 时必填 */
  rejectReason?: string;
}

/**
 * PUT 管理员操作：审核通过 / 驳回
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  if (!session?.user?.id) return NextResponse.json({ error: "缺少管理员 ID" }, { status: 400 });

  const { id } = await params;

  let body: ModerationBody;
  try {
    body = (await request.json()) as ModerationBody;
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }
  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "action 必须是 approve 或 reject" }, { status: 400 });
  }

  const existing = await prisma.pendingPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "投稿不存在" }, { status: 404 });
  }
  if (existing.status !== "PENDING") {
    return NextResponse.json({ error: `此投稿已被处理（${existing.status}），请刷新页面` }, { status: 409 });
  }

  const reviewedAt = new Date();

  if (body.action === "reject") {
    if (!body.rejectReason || body.rejectReason.trim().length < 2) {
      return NextResponse.json({ error: "驳回必须填写理由（≥2 字符）" }, { status: 400 });
    }
    const updated = await prisma.pendingPost.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: session.user.id,
        reviewedAt,
        rejectReason: body.rejectReason.trim().slice(0, 500),
      },
      select: { id: true, status: true, rejectReason: true, reviewedAt: true },
    });
    return NextResponse.json({ success: true, action: "reject", data: updated });
  }

  // ============================
  // action === "approve"：转 MDX 发布
  // ============================
  const ov = body.overrides ?? {};

  // publishedAt 默认当天；管理员可 override
  const publishedAt =
    ov.publishedAt || new Date().toISOString().slice(0, 10);

  // 补全 admin 要求的 originalCreator / sourcePlatform / sourceUrl —— 如果投稿没填、管理员也没 override，设默认占位
  const originalCreator = (ov.originalCreator ?? existing.originalCreator ?? "匿名投稿").slice(0, 60);
  const sourcePlatform =
    (ov.sourcePlatform ?? existing.sourcePlatform ?? "other") as "weibo" | "pixiv" | "twitter" | "lofter" | "bilibili" | "xiaohongshu" | "other";
  const sourceUrl =
    ov.sourceUrl ?? existing.sourceUrl ?? `https://example.com/user-submission/${existing.slug}`;
  const title = (ov.title ?? existing.title).slice(0, 120);
  const description = (ov.description ?? existing.description).slice(0, 300);
  const tags = (ov.tags ?? existing.tags).slice(0, 8);
  const draft = ov.draft ?? false;

  // 再次 slug 冲突检查：审核期间可能有同名发布产生
  const publishedExisting = getPostBySlug(existing.slug);
  if (publishedExisting) {
    return NextResponse.json({ error: "审核通过时发现 slug 已被前台占用，请管理员修改后再通过" }, { status: 409 });
  }

  // 用 admin 端的 postMetaSchema 做最后一次强校验（保证生成的 MDX 合法）
  const metaPayload = {
    title,
    description,
    type: existing.type as PostType, // PendingPost.type 是 submit 枚举，PostType 已统一包含 screenshot
    character: existing.character ?? undefined,
    originalCreator,
    sourcePlatform,
    sourceUrl,
    tags,
    publishedAt,
    draft,
    images: existing.images,
    videoId: existing.videoId ?? undefined,
    updatedAt: undefined,
  };
  const parsedMeta = postMetaSchema.safeParse(metaPayload);
  if (!parsedMeta.success) {
    return NextResponse.json(
      { error: "生成作品时字段校验失败，请管理员检查原作者/来源链接等必填项是否填写", details: parsedMeta.error.flatten() },
      { status: 422 },
    );
  }

  // 写 MDX
  try {
    const mdxResult = createPostMdx(
      { slug: existing.slug, ...parsedMeta.data },
      existing.content || "",
    );

    // 更新 PendingPost 状态
    const updated = await prisma.pendingPost.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedBy: session.user.id,
        reviewedAt,
        publishedSlug: mdxResult.slug,
      },
      select: { id: true, status: true, publishedSlug: true, reviewedAt: true },
    });

    return NextResponse.json({
      success: true,
      action: "approve",
      data: updated,
      post: {
        slug: mdxResult.slug,
        dirPath: mdxResult.dirPath,
        frontmatter: mdxResult.frontmatter,
      },
    });
  } catch (err) {
    console.error("[moderation] approve create MDX failed:", err);
    return NextResponse.json({ error: "写文件失败，请检查服务器文件系统权限" }, { status: 500 });
  }
}
