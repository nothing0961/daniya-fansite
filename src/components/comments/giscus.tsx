/**
 * Giscus — GitHub Discussions 评论组件
 * 基于 giscus.app，使用 GitHub Discussions 作为评论后端
 * 免费、无需自建后端、支持暗色模式
 *
 * 配置步骤：
 * 1. 在 https://giscus.app 填写 GitHub 仓库信息
 * 2. 确保仓库是公开的，且安装了 Giscus App
 * 3. 开启 Discussions 功能
 * 4. 将生成的环境变量填入 .env.local
 *
 * 修改方式：修改 .env.local 中的 NEXT_PUBLIC_GISCUS_* 变量
 */
"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export function GiscusComments() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // 避免重复加载
    const container = containerRef.current;
    if (!container || container.querySelector("iframe")) return;

    // 加载 Giscus 脚本
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";

    // Giscus 配置 — 从环境变量读取
    const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
    const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
    const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "Announcements";
    const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

    script.setAttribute("data-repo", repo || "");
    script.setAttribute("data-repo-id", repoId || "");
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId || "");
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-lang", "zh-CN");
    // 跟随网站主题
    script.setAttribute(
      "data-theme",
      resolvedTheme === "light" ? "light" : "dark_dimmed"
    );
    script.setAttribute("data-loading", "lazy");

    container.appendChild(script);
  }, [resolvedTheme]);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
        评论
      </h3>
      <div ref={containerRef} className="giscus" />
    </div>
  );
}
