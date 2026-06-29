/**
 * 搜索 API — GET /api/search?q=关键词
 * 返回匹配作品的 JSON 数组
 *
 * 使用方式：fetch("/api/search?q=达妮娅")
 * 返回格式：{ results: PostMeta[] }
 */
import { NextResponse } from "next/server";
import { searchPosts } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const results = searchPosts(query, limit);

  return NextResponse.json({ results });
}
