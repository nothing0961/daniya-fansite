import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PendingPostStatus } from "@prisma/client";

/**
 * 管理员：获取投稿审核列表
 * - 支持 ?status=PENDING|APPROVED|REJECTED 过滤（默认 PENDING，这样后台默认显示待审）
 * - 支持 ?limit=20 分页上限
 */
export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as PendingPostStatus | null;
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);

  const where = status ? { status } : undefined;
  // select 精简：列表不渲染正文 content（MDX 可能很大），避免每次切 tab 传输几十 KB 冗余 payload；详情接口才返回全文
  const list = await prisma.pendingPost.findMany({
    take: limit,
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      type: true,
      images: true,
      tags: true,
      status: true,
      rejectReason: true,
      publishedSlug: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });
  const counts = await prisma.pendingPost.groupBy({
    by: ["status"],
    _count: { status: true },
  });
  const statusCounts: Record<string, number> = Object.fromEntries(
    counts.map((c) => [c.status, c._count.status]),
  );

  return NextResponse.json({ list, meta: { statusCounts, limit, filter: status ?? null } });
}
