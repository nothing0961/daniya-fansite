import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许 MDX 文件作为页面
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // 鸣潮图片资源来源域名（后续如果引用外部图片需要添加）
  images: {
    remotePatterns: [
      // SM.MS 图床
      { protocol: "https", hostname: "s2.loli.net" },
      { protocol: "https", hostname: "s1.loli.net" },
      { protocol: "https", hostname: "i.loli.net" },
      // B站封面图
      { protocol: "https", hostname: "api.bilibili.com" },
    ],
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
