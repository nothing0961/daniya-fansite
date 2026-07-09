/**
 * /api/user/submissions/[id] — 用户投稿单条操作 API
 * 权限：必须本人（session.user.id === PendingPost.userId），他人访问 403
 *
 *   GET  — 读取本人一条投稿详情（用于驳回修改后重新提交时回填表单）
 *   DELETE — 取消一条投稿（仅 PENDING 状态允许；非 PENDING 返回 409 幂等保护）
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ---------- 读取详情（本人 + 任意状态）----------
export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  const rec = await prisma.pendingPost.findUnique({ where: { id } });
  if (!rec) {
    return NextResponse.json({ error: "投稿不存在" }, { status: 404 });
  }
  if (rec.userId !== userId) {
    return NextResponse.json({ error: "无权查看他人投稿" }, { status: 403 });
  }
  return NextResponse.json({ data: rec });
}

// ---------- 删除（取消投稿）：本人 + PENDING 状态才能删 ----------
export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  const rec = await prisma.pendingPost.findUnique({ where: { id } });
  if (!rec) {
    return NextResponse.json({ error: "投稿不存在" }, { status: 404 });
  }
  if (rec.userId !== userId) {
    return NextResponse.json(
      { error: "无权操作他人投稿" },
      { status: 403 },
    );
  }
  // 幂等保护：已通过 / 已驳回 的投稿不允许删除（保留历史留痕）
  if (rec.status !== "PENDING") {
    return NextResponse.json(
      { error: `当前状态为 ${rec.status}，仅 PENDING 待审核投稿允许取消` },
      { status: 409 },
    );
  }
  await prisma.pendingPost.delete({ where: { id } });
  return NextResponse.json({ success: true, deletedId: id });
}
