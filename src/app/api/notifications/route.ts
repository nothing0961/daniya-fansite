import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 站内通知（仅站长）
 * GET — 通知列表（最新 50 条）
 * PUT — 全部标记已读
 */
export async function GET() {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const notifications = await prisma.notification.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ notifications });
}

export async function PUT() {
  const { error, session } = await requireAdmin();
  if (error) return error;

  await prisma.notification.updateMany({
    where: { userId: session!.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
