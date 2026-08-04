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
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChatDrawerProvider } from "@/components/chat/chat-drawer-context";
import { GlobalChatDrawer } from "@/components/chat/global-chat-drawer";
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
        {/* 预加载字体 */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        {/* 暗色文学叙事风格所需衬线字体 */}
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Noto+Sans+SC:wght@400;500&family=JetBrains+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
        {/* 背景图初始化：在首次绘制前从 localStorage 读取，防止闪烁 */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var s=localStorage.getItem('daniya-bg-src');var b=parseFloat(localStorage.getItem('daniya-bg-blur')||'0');if(s){document.documentElement.style.setProperty('--bg-image-url','url("'+s+'")')}document.documentElement.style.setProperty('--bg-blur-opacity',Math.min(Math.max(b/30,0),1))}catch(e){}})();`
        }} />
      </head>
      <body className="h-screen flex flex-col overflow-hidden">
        {/* 全站背景图层 — 由 BgSwitcher 通过 CSS 变量控制 */}
        {/* 双层：清晰层 + 模糊层（交叉淡入淡出，避免实时 blur 计算卡顿） */}
        <div className="hp-bg-image" aria-hidden="true" />
        <div className="hp-bg-image-blur" aria-hidden="true" />
        <SessionProvider>
          <ThemeProvider>
            <StatusModalProvider>
              <ChatDrawerProvider>
                <Header />
                {/* flex-1 让 main 撑满剩余空间，overflow-y-auto 允许子页面内容滚动 */}
                <main className="flex-1 overflow-y-auto">{children}</main>
                <Footer />
                {/* 全局聊天抽屉 — 由导航栏"飞讯"触发 */}
                <GlobalChatDrawer />
                {/* 全局 Toast 通知 — 在任意组件中调用 toast.success() / toast.error() */}
                <Toaster position="top-center" />
              </ChatDrawerProvider>
            </StatusModalProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
