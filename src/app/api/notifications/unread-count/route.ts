import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/notifications/unread-count — 未读通知数（铃铛红点轮询用）
 * 仅站长可见（requireAdmin）
 */
export async function GET() {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const count = await prisma.notification.count({
    where: { userId: session!.user.id, readAt: null },
  });
  return NextResponse.json({ count });
}
