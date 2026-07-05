/**
 * 作品评论列表 & 发表评论 API
 * 路由：/api/posts/[slug]/comments
 *
 * 权限：
 *  - GET：任何人（未登录也可）可读评论列表
 *  - POST：必须登录（否则 401），且评论内容通过 commentSchema 校验
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validators/comment-schema";

/** 获取某篇作品的评论列表（按发表时间正序排列，带作者信息） */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "缺少 slug 参数" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { postSlug: slug },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });

  // 数量统计（前端可单独展示"X 条评论"）
  const count = await prisma.comment.count({ where: { postSlug: slug } });

  return NextResponse.json({ comments, count });
}

/** 发表评论 — 登录用户可用；内容 1-1000 字 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  // ===== 1. 登录守卫（未登录 → 401） =====
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后再发表评论" }, { status: 401 });
  }

  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "缺少 slug 参数" }, { status: 400 });
  }

  // ===== 2. 解析 body & Zod 校验（content 1-1000 字，trim 去前后空白） =====
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是合法 JSON" }, { status: 400 });
  }

  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join("；");
    return NextResponse.json(
      { error: `评论内容不合法：${issues}` },
      { status: 400 }
    );
  }

  // ===== 3. 入库 =====
  const comment = await prisma.comment.create({
    data: {
      userId: session.user.id,
      postSlug: slug,
      content: parsed.data.content,
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
