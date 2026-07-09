/**
 * 删除评论 API
 * 路由：/api/comments/[id]
 *
 * 权限（二者满足其一即可）：
 *  - 作者本人（session.user.id === comment.userId）
 *  - 站长（session.user.id === process.env.ADMIN_USER_ID）
 *
 * 未登录 → 401；登录但不满足 → 403；评论不存在 → 404
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后再操作" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "缺少评论 id" }, { status: 400 });
  }

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json({ error: "评论不存在或已被删除" }, { status: 404 });
  }

  // 作者本人 或 ADMIN 才能删
  const adminUserId = process.env.ADMIN_USER_ID;
  const isOwner = comment.userId === session.user.id;
  const isAdmin = !!adminUserId && session.user.id === adminUserId;

  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: "无权限删除此评论（仅作者本人或站长可删除）" },
      { status: 403 }
    );
  }

  await prisma.comment.delete({ where: { id } });

  return NextResponse.json({ success: true, deletedId: id });
}
