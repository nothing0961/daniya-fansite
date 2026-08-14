/**
 * POST /api/chat-sessions/[id]/messages — 整表替换会话消息（幂等追加）
 * 客户端以 DB 为源时用它落盘最新消息列表；401/404 同上
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const owned = await prisma.chatSession.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "会话不存在" }, { status: 404 });

  const rawMsgs = Array.isArray(body.messages) ? body.messages : [];
  // id 由服务端生成（客户端固定 id 会跨会话撞 ChatMessage 唯一键 P2002）；
  // createdAt 按序递增，保证 orderBy createdAt 与数组顺序一致
  const now = Date.now();
  const messages = rawMsgs
    .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-200)
    .map((m: any, i: number) => ({
      sessionId: id,
      role: m.role,
      content: m.content.slice(0, 10000),
      createdAt: new Date(now + i),
    }));

  await prisma.$transaction([
    prisma.chatMessage.deleteMany({ where: { sessionId: id } }),
    prisma.chatMessage.createMany({ data: messages }),
  ]);
  return NextResponse.json({ ok: true, count: messages.length });
}
