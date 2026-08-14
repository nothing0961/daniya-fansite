/**
 * GET/POST /api/chat-sessions — 登录用户的聊天会话列表 / 新建
 * 401 拦截：未登录一律拒绝；查询仅限本人数据
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const rows = await prisma.chatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    sessions: rows.map((s) => ({
      id: s.id,
      title: s.title,
      summary: s.summary,
      summaryCount: s.summaryCount,
      updatedAt: s.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 50)
      : "新会话";
  const summary = typeof body.summary === "string" ? body.summary.slice(0, 8000) : null;
  const summaryCount =
    typeof body.summaryCount === "number" && Number.isFinite(body.summaryCount)
      ? Math.max(0, Math.floor(body.summaryCount))
      : 0;
  const created = await prisma.chatSession.create({
    data: { userId: session.user.id, title, summary, summaryCount },
  });
  return NextResponse.json({ session: { id: created.id } }, { status: 201 });
}
