/**
 * 作品详情页
 * 动态路由 /post/[slug] — 根据 slug 加载对应 MDX 作品
 * 包含：标题、元信息、出处标注（突出）、图片展示区、MDX 正文、点赞收藏按钮、
 *       自建评论区（UserComments，打通站内用户名+密码体系）
 *
 * 修改方式：
 * - generateMetadata 控制 SEO 标题和描述
 * - 评论区实现见 src/components/comments/user-comments.tsx
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { getPostContent, getAllPosts } from "@/lib/posts";
import { PostMeta } from "@/components/post/post-meta";
import { PostCredit } from "@/components/post/post-credit";
import { Separator } from "@/components/ui/separator";
import { LikeButton } from "@/components/interaction/like-button";
import { BookmarkButton } from "@/components/interaction/bookmark-button";
import { UserComments } from "@/components/comments/user-comments";
import { BilibiliEmbed } from "@/components/media/bilibili-embed";
import { PostGallery } from "@/components/media/post-gallery";

// ===== 类型定义 =====
interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// ===== 静态生成：构建时预渲染所有作品页 =====
export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

// ===== 动态 SEO 元数据 =====
export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = getPostContent(slug);
  if (!result) return { title: "作品未找到" };

  const { meta } = result;
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "article",
      publishedTime: meta.publishedAt,
      tags: meta.tags,
    },
  };
}

// ===== 页面组件 =====
export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  // 读取 MDX 内容
  const result = getPostContent(slug);
  if (!result) notFound();

  const { meta, rawContent } = result;

  // 取当前登录用户 + 站长判断（传给自建评论组件，用于显示"删除"按钮、已登录/未登录输入框）
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const isAdmin =
    !!currentUserId &&
    !!process.env.ADMIN_USER_ID &&
    currentUserId === process.env.ADMIN_USER_ID;

  // 格式化日期
  const formattedDate = new Date(meta.publishedAt).toLocaleDateString(
    "zh-CN",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <article className="mx-auto max-w-2xl px-4 py-8">
      {/* ===== 头部区域 ===== */}
      <header className="mb-8">
        {/* 类型徽章 + 发布日期 */}
        <PostMeta
          type={meta.type}
          publishedAt={meta.publishedAt}
          tags={meta.tags}
          variant="detail"
        />

        {/* 作品标题 */}
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-[var(--foreground)] leading-tight">
          {meta.title}
        </h1>

        {/* 简介 */}
        <p className="mt-3 text-[var(--muted-foreground)] leading-relaxed">
          {meta.description}
        </p>
      </header>

      {/* ===== 出处标注（完整版）— 突出显示 ===== */}
      <div className="mb-8">
        <PostCredit
          creator={meta.originalCreator}
          platform={meta.sourcePlatform}
          url={meta.sourceUrl}
          variant="full"
        />
      </div>

      {/* ===== 媒体展示区 ===== */}
      {meta.type === "video" && meta.videoId ? (
        <div className="mb-8">
          <BilibiliEmbed bvId={meta.videoId} />
        </div>
      ) : meta.images.length > 0 ? (
        <div className="mb-8">
          <PostGallery images={meta.images} />
        </div>
      ) : (
        <div className="mb-8 w-full aspect-video rounded-lg bg-[var(--muted)] flex items-center justify-center border border-[var(--border)]">
          <span className="text-[var(--muted-foreground)] text-sm">
            暂无配图
          </span>
        </div>
      )}

      <Separator className="my-8" />

      {/* ===== MDX 正文内容 ===== */}
      <div className="prose dark:prose-invert max-w-none">
        {/* 原始 MDX 内容（不含 frontmatter）作为纯文本展示 */}
        {/* 后续阶段可替换为 <MDXRemote> 编译渲染 */}
        <div
          className="text-[var(--foreground)] leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: (() => {
              let html = rawContent
                .replace(/^---[\s\S]*?---\n*/, "")
                // Escape HTML entities before Markdown conversion
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
              // Convert Markdown to HTML (headings, lists, blockquotes before <p> wrapping)
              html = html
                .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
                .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
                .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
                .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-2 border-[var(--primary)] pl-4 italic text-[var(--muted-foreground)]">$1</blockquote>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n\n/g, '</p><p class="mb-3">');
              // Wrap remaining lines in <p> — skip lines already converted to HTML
              html = html.replace(/^(?!<)(.+)$/gm, '<p class="mb-3">$1</p>');
              return html;
            })(),
          }}
        />
      </div>

      <Separator className="my-8" />

      {/* ===== 底部互动区 ===== */}
      <div className="flex items-center gap-4">
        <LikeButton postSlug={slug} />
        <BookmarkButton postSlug={slug} />
      </div>

      {/* ===== 自建评论区（打通站内用户名+密码体系） ===== */}
      <UserComments
        postSlug={slug}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />

      {/* 返回首页 */}
      <div className="mt-8 pt-6 border-t border-[var(--border)]">
        <Link
          href="/"
          className="text-sm text-[var(--primary)] hover:underline inline-flex items-center gap-1"
        >
          ← 返回作品列表
        </Link>
      </div>
    </article>
  );
}
