import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许 MDX 文件作为页面
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // 鸣潮图片资源来源域名（后续如果引用外部图片需要添加）
  images: {
    remotePatterns: [
      // SM.MS 图床 (legacy)
      { protocol: "https", hostname: "s2.loli.net" },
      { protocol: "https", hostname: "s1.loli.net" },
      { protocol: "https", hostname: "i.loli.net" },
      // ImgURL 图床 CDN
      { protocol: "https", hostname: "s3.bmp.ovh" },
      // B站封面图
      { protocol: "https", hostname: "api.bilibili.com" },
    ],
  },
  // 禁止 Turbopack NFT 追踪器把 next.config.mjs 打入 serverless 函数包
  outputFileTracingExcludes: {
    "*": ["./next.config.mjs"],
  },
  /**
   * HTTP 安全响应头（严格区分生产/开发）
   *  · 生产环境：注入 5 条安全头（HSTS/CSP/X-Frame/X-Content-Type/Referrer）
   *  · 开发环境：返回空数组 —— 零安全限制，HMR / iframe 调试 0 影响
   *
   *  NOTE：isProd 在函数内部读取，不能写在模块顶层。
   *  - 模块顶层的 NODE_ENV 会在文件 import 时快照（vitest / 部分部署平台会踩坑）
   *  - 函数内每次调用重读，配合「测试 beforeEach 先改 NODE_ENV 再调用」才能生效
   */
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    if (!isProd) return [];
    return [
      {
        source: "/:path*",
        headers: [
          // HSTS：强制 HTTPS 1 年（浏览器记住；仅 HTTPS 响应才生效，本地 http 开发会被浏览器自动忽略）
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // 防 iframe 点击劫持：只允许本站同源嵌套
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // 防 MIME 嗅探：浏览器不得猜资源类型，必须严格按 Content-Type
          { key: "X-Content-Type-Options", value: "nosniff" },
          // 隐私+防盗链平衡：跨域只发送 origin，不发完整路径；降级到 HTTP 时不发送 HTTPS 页面的 referer
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // CSP 防 XSS 核心：白名单逐项对齐项目真实外联
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "img-src 'self' https: data: blob:",
              "media-src 'self' https: data: blob:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "script-src 'self' 'unsafe-eval'",
              "connect-src 'self' https://*.imgurl.org",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  // MDX 插件配置 — 代码高亮、GFM 表格等
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
