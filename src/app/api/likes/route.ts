/**
 * 点赞 API — /api/likes
 * GET  — 获取点赞数和当前用户点赞状态 (?postSlug=xxx)
 * POST — 点赞/取消点赞切换（body: { postSlug }）
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** 获取点赞数和用户点赞状态 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postSlug = searchParams.get("postSlug");

  if (!postSlug) {
    return NextResponse.json({ error: "缺少 postSlug" }, { status: 400 });
  }

  // 总点赞数
  const count = await prisma.postLike.count({
    where: { postSlug },
  });

  // 当前用户是否已点赞
  const session = await auth();
  let liked = false;
  if (session?.user?.id) {
    const existing = await prisma.postLike.findUnique({
      where: {
        userId_postSlug: {
          userId: session.user.id,
          postSlug,
        },
      },
    });
    liked = !!existing;
  }

  return NextResponse.json({ count, liked });
}

/** 切换点赞状态 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { postSlug } = await request.json();
  if (!postSlug) {
    return NextResponse.json({ error: "缺少 postSlug" }, { status: 400 });
  }

  // 检查是否已点赞
  const existing = await prisma.postLike.findUnique({
    where: {
      userId_postSlug: {
        userId: session.user.id,
        postSlug,
      },
    },
  });

  if (existing) {
    // 取消点赞
    await prisma.postLike.delete({
      where: { id: existing.id },
    });
    const count = await prisma.postLike.count({ where: { postSlug } });
    return NextResponse.json({ liked: false, count });
  } else {
    // 点赞
    await prisma.postLike.create({
      data: {
        userId: session.user.id,
        postSlug,
      },
    });
    const count = await prisma.postLike.count({ where: { postSlug } });
    return NextResponse.json({ liked: true, count });
  }
}
