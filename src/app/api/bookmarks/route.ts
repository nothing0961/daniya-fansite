/**
 * 收藏 API — /api/bookmarks
 * GET  — 获取当前用户的收藏列表
 * POST — 添加收藏（body: { postSlug }）
 * DELETE — 取消收藏（body: { postSlug } 或 query ?postSlug=xxx）
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** 获取当前用户的所有收藏 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookmarks });
}

/** 添加收藏 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { postSlug } = await request.json();
  if (!postSlug) {
    return NextResponse.json({ error: "缺少 postSlug" }, { status: 400 });
  }

  try {
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        postSlug,
      },
    });
    return NextResponse.json({ bookmark });
  } catch {
    // 重复收藏（unique 约束冲突）
    return NextResponse.json({ error: "已收藏" }, { status: 409 });
  }
}

/** 取消收藏 */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  // 支持 query 参数和 body 两种方式
  const { searchParams } = new URL(request.url);
  let postSlug = searchParams.get("postSlug");

  if (!postSlug) {
    try {
      const body = await request.json();
      postSlug = body.postSlug;
    } catch {
      // body 为空或不是 JSON
    }
  }

  if (!postSlug) {
    return NextResponse.json({ error: "缺少 postSlug" }, { status: 400 });
  }

  await prisma.bookmark.deleteMany({
    where: {
      userId: session.user.id,
      postSlug,
    },
  });

  return NextResponse.json({ success: true });
}
