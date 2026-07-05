/**
 * 根布局 — 所有页面的外层容器
 * 包裹 ThemeProvider、Header、Footer
 * 全局 metadata 定义站点 SEO 信息
 *
 * 修改方式：
 * - metadata 中的 title/description 决定浏览器标签页标题和搜索引擎摘要
 * - 替换 Header/Footer 组件可改变全站布局
 */
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { SessionProvider } from "@/components/auth/session-provider";
import { StatusModalProvider } from "@/components/ui/status-modal";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

/** 站点全局 SEO 元数据 */
export const metadata: Metadata = {
  title: {
    default: "达妮娅的瞌睡小屋",
    template: "%s | 达妮娅的瞌睡小屋",
  },
  description: "《鸣潮》角色达妮娅的同人二创作品 curation 站点，精选搬运优质二创内容。",
  keywords: ["鸣潮", "达妮娅", "同人", "二创", "fanart", "Wuthering Waves"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning — next-themes 在 <html> 上注入 class，需抑制水合警告
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 预加载 JetBrains Mono 等宽字体（用于代码块） */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <SessionProvider>
          <ThemeProvider>
            <StatusModalProvider>
              <Header />
              {/* flex-1 让 main 撑满剩余空间，把 footer 推到底部 */}
              <main className="flex-1">{children}</main>
              <Footer />
            </StatusModalProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
