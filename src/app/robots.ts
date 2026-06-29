/**
 * robots.txt 生成
 * 允许所有爬虫，指向 sitemap
 */
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://daniya-fansite.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 禁止爬取 API 和用户中心等内部页面
      disallow: ["/api/", "/dashboard/", "/login"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
