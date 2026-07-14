/**
 * RSS 2.0 订阅源 — GET /api/rss
 * 生成标准 RSS XML 格式，供 RSS 阅读器订阅
 */
import { getAllPosts } from "@/lib/posts";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdataSafe(s: string): string {
  return s.replace(/]]>/g, "]]]]><![CDATA[>");
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://daniya-fansite.vercel.app";
  const posts = getAllPosts();

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>达妮娅的瞌睡小屋</title>
    <link>${baseUrl}</link>
    <description>《鸣潮》角色达妮娅的同人二创作品 curation 站点</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml"/>
    ${posts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${cdataSafe(post.title)}]]></title>
      <link>${baseUrl}/post/${post.slug}</link>
      <description><![CDATA[${cdataSafe(post.description)}]]></description>
      <author>${xmlEscape(post.originalCreator)}</author>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <guid isPermaLink="true">${baseUrl}/post/${post.slug}</guid>
      ${post.tags.map((tag) => `<category>${xmlEscape(tag)}</category>`).join("\n      ")}
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
