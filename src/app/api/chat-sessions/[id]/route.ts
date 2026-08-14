/**
 * GET/PATCH/DELETE /api/chat-sessions/[id] — 会话消息读取 / 标题与摘要更新 / 删除
 * 401 拦截：未登录一律拒绝；404：会话不存在或不属于本人
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  const row = await prisma.chatSession.findFirst({
    where: { id, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!row) return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  return NextResponse.json({
    messages: row.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(
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

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    data.title = body.title.trim().slice(0, 50) || "新会话";
  }
  if (typeof body.summary === "string") {
    data.summary = body.summary.slice(0, 8000);
  }
  if (typeof body.summaryCount === "number" && Number.isFinite(body.summaryCount)) {
    data.summaryCount = Math.max(0, Math.floor(body.summaryCount));
  }
  const updated = await prisma.chatSession.update({
    where: { id },
    data,
    select: { id: true, title: true, summary: true, summaryCount: true, updatedAt: true },
  });
  return NextResponse.json({ session: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  const owned = await prisma.chatSession.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  await prisma.chatSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
