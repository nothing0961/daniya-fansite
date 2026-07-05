/**
 * Next.js Proxy（原 Middleware）— 路由保护
 * 拦截需要登录的页面，未登录重定向到 /login
 *
 * 修改方式：修改 config.matcher 可增减受保护的路由
 */
import { auth } from "@/auth";

// Next.js 16 需要导出名为 proxy 的函数
export const proxy = auth;

export const config = {
  // 需要登录才能访问的路由
  matcher: ["/dashboard/:path*", "/api/bookmarks/:path*", "/api/likes/:path*", "/api/admin/:path*"],
};
