/**
 * /dashboard/submissions/[slug] — 投稿预览页（方案 A 独立路由）
 *  用户 / 管理员可查：
 *   · PENDING → 审核中：⏳ 黄胶囊 + 锁 banner（不开放互动）
 *   · REJECTED → 请重新编辑：⚠️ 红胶囊 + rejectReason 框 + "修改后重新提交"按钮跳 /submit?resubmit=<id>
 *   · APPROVED → 已通过：✅ 绿胶囊 + 顶部绿 banner + "查看正式页 → /post/<slug>
 *  权限：本人 (本人(pendingPost.userId === session.user.id) 或 管理员（ADMIN_USER_ID）
 *        否则 notFound()（不给 403，防止枚举 slug 是否存在）
 *  不预渲染 generateStaticParams — 用户私有动态页
 */
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PostMeta } from "@/components/post/post-meta";
import { PostCredit } from "@/components/post/post-credit";
import { Separator } from "@/components/ui/separator";
import { BilibiliEmbed } from "@/components/media/bilibili-embed";
import { PostGallery } from "@/components/media/post-gallery";
import type { PostType, SourcePlatform } from "@/types/post";
import type { PendingPostStatus } from "@prisma/client";

interface PreviewPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `投稿预览 · ${slug} - 达妮娅的瞌睡小屋`,
    description: "查看向站长提交的作品审核状态预览",
  };
}

// ---------- 状态胶囊样式 ----------
const STATUS_LABEL: Record<
  PendingPostStatus,
  { label: string; icon: string; badge: string; pill: string }
> = {
  PENDING: {
    label: "审核中",
    icon: "⏳",
    badge:
      "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    pill:
      "bg-amber-500 text-white",
  },
  REJECTED: {
    label: "请重新编辑",
    icon: "⚠️",
    badge:
      "bg-red-500/15 text-red-400 border border-red-500/30",
    pill:
      "bg-red-500 text-white",
  },
  APPROVED: {
    label: "已通过",
    icon: "✅",
    badge:
      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    pill:
      "bg-emerald-500 text-white",
  },
};

export default async function SubmissionPreviewPage({
  params,
}: PreviewPageProps) {
  // ---------- 1. 登录守卫 ----------
  const session = await auth();
  const { slug } = await params;
  if (!session?.user) {
    redirect(
      `/login?callbackUrl=/dashboard/submissions/${encodeURIComponent(slug)}`,
    );
  }
  const currentUserId = session.user.id;
  const isAdmin =
    !!process.env.ADMIN_USER_ID && currentUserId === process.env.ADMIN_USER_ID;

  // ---------- 2. 按 slug 查询 PendingPost ----------
  const pendingPost = await prisma.pendingPost.findUnique({
    where: { slug },
  });
  if (!pendingPost) {
    notFound();
  }

  // ---------- 3. 权限守卫：本人 或 管理员（防枚举，不给 403）----------
  const isOwner = pendingPost.userId === currentUserId;
  if (!isOwner && !isAdmin) {
    notFound();
  }

  const statusMeta = STATUS_LABEL[pendingPost.status];

  // 格式化日期：提交时间作为「发布/投稿日期」传给 PostMeta（PendingPost 没有 publishedAt）
  const submittedAt = pendingPost.createdAt.toISOString();
  const formattedSubmitDate = new Date(
    pendingPost.createdAt,
  ).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ---------- 4. 正文简单 markdown → HTML（与 /post/[slug] 同款简易渲染）----------
  const rawBody = pendingPost.content ?? "";
  // PendingPost.content 直接是 MDX 正文（不带 frontmatter），所以跳过 --- 去除段；但为了健壮性还是保留去除
  let renderedBody = rawBody
    .replace(/^---[\s\S]*?---\n*/, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  renderedBody = renderedBody
    .replace(
      /^### (.+)$/gm,
      '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>',
    )
    .replace(
      /^## (.+)$/gm,
      '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>',
    )
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(
      /^&gt; (.+)$/gm,
      '<blockquote class="border-l-2 border-[var(--primary)] pl-4 italic text-[var(--muted-foreground)]">$1</blockquote>',
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, '</p><p class="mb-3">');
  renderedBody = renderedBody.replace(/^(?!<)(.+)$/gm, '<p class="mb-3">$1</p>');

  const postType = (pendingPost.type as PostType) || "illustration";

  return (
    <article className="mx-auto max-w-2xl px-4 py-8">
      {/* ---------- APPROVED 顶部绿 banner（方案 A 默认 Q4：保留预览页，加外链）---------- */}
      {pendingPost.status === "APPROVED" && (
        <div className="mb-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 flex items-center justify-between gap-3 flex-wrap">
        <span>
          ✅ 该稿件已上线！此页保留用于查看投稿记录，点赞/收藏/评论已统一在正式页下汇总。</span>
          <Link
            href={`/post/${pendingPost.slug}`}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-500 text-white px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
          >
            前往正式页 ↗
          </Link>
        </div>
      )}

      {/* ---------- PENDING / REJECTED 互动锁 banner（方案 A 默认 Q3-a：未通过不开放互动）---------- */}
      {pendingPost.status !== "APPROVED" && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm flex items-start gap-2 ${
            pendingPost.status === "PENDING"
              ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          <span className="shrink-0 mt-0.5">🔒</span>
          <span>
            该稿件处于
            <strong className="mx-1">
              {pendingPost.status === "PENDING" ? "审核中" : "驳回"}
            </strong>
            状态，暂不开放点赞/收藏/评论。审核通过后统一在正式页开放互动。
          </span>
        </div>
      )}

      {/* ---------- 头部：返回链 + 状态胶囊 ---------- */}
      <header className="mb-8">
        {/* 第一行：返回链 + 右上状态胶囊 */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <Link
            href="/dashboard/submissions"
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline inline-flex items-center gap-1"
          >
            ← 返回我的投稿
          </Link>

          {/* 右上角状态胶囊 + APPROVED 时额外外链正式页 */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${statusMeta.pill}`}
              title={statusMeta.label}
            >
              <span aria-hidden>{statusMeta.icon}</span>
              <span>{statusMeta.label}</span>
            </span>
            {pendingPost.status === "APPROVED" && (
              <Link
                href={`/post/${pendingPost.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs px-2.5 py-1 rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors whitespace-nowrap"
                title="在正式页打开"
              >
                查看正式页 ↗
              </Link>
            )}
          </div>
        </div>

        {/* 元信息：类型 + 投稿日期 + 标签 */}
        <PostMeta
          type={postType}
          publishedAt={submittedAt}
          tags={pendingPost.tags}
          variant="detail"
        />

        {/* 标题 */}
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-[var(--foreground)] leading-tight">
          {pendingPost.title}
        </h1>

        {/* 简介 */}
        <p className="mt-3 text-[var(--muted-foreground)] leading-relaxed">
          {pendingPost.description}
        </p>

        {/* 角色字段（若有）——文案显示在简介之后）*/}
        {pendingPost.character && (
          <div className="mt-2 text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--muted)]/50 text-[var(--muted-foreground)]">
            <span>角色：</span>
            <span className="text-[var(--foreground)] font-medium">
              {pendingPost.character === "DANIYA" ? "达妮娅" : pendingPost.character}
            </span>
          </div>
        )}
      </header>

      {/* ---------- 出处标注（完整版）*/}
      <div className="mb-8">
        <PostCredit
          creator={pendingPost.originalCreator ?? ""}
          platform={(pendingPost.sourcePlatform as SourcePlatform) ?? ""}
          url={pendingPost.sourceUrl ?? ""}
          variant="full"
        />
      </div>

      {/* ---------- REJECTED：驳回理由红框 + 修改后重新提交按钮 */}
      {pendingPost.status === "REJECTED" && (
        <div className="mb-8 rounded-xl border border-red-500/40 bg-red-500/10 p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-red-400 mb-1 flex items-center gap-1">
              🚫 驳回理由：
            </p>
            <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
              {pendingPost.rejectReason ?? "未填写驳回理由"}
            </p>
          </div>
          <div className="flex justify-end">
            <Link
              href={`/submit?resubmit=${pendingPost.id}`}
              className="text-xs px-3 py-1.5 rounded-md bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
            >
              修改后重新提交 →
            </Link>
          </div>
        </div>
      )}

      {/* ---------- PENDING：审核中小字提示 */}
      {pendingPost.status === "PENDING" && (
        <div className="mb-8 rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-400">
          💡 站长审核中，通常 24 小时内处理，通过后会自动发布
        </div>
      )}

      {/* ---------- 媒体展示区：按 type 分支（与正式页同款）---------- */}
      {postType === "video" && pendingPost.videoId ? (
        <div className="mb-8">
          <BilibiliEmbed bvId={pendingPost.videoId} />
        </div>
      ) : (pendingPost.images?.length ?? 0) > 0 ? (
        <div className="mb-8">
          <PostGallery images={pendingPost.images!} />
        </div>
      ) : (
        <div className="mb-8 w-full aspect-video rounded-lg bg-[var(--muted)] flex items-center justify-center border border-[var(--border)]">
          <span className="text-[var(--muted-foreground)] text-sm">
            暂无配图
          </span>
        </div>
      )}

      <Separator className="my-8" />

      {/* ---------- MDX 正文（简易 markdown→HTML）---------- */}
      <div className="prose dark:prose-invert max-w-none">
        <div
          className="text-[var(--foreground)] leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: renderedBody }}
        />
      </div>

      <Separator className="my-8" />

      {/* ---------- 底部状态条（非 APPROVED 状态用徽章显示锁提示）---------- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/50 p-3 text-xs text-[var(--muted-foreground)] flex items-center justify-between gap-3 flex-wrap">
        <span>
          提交时间：
          <span className="text-[var(--foreground)] font-medium ml-1">
            {formattedSubmitDate}
          </span>
          <span className="mx-2 text-[var(--border)]">·</span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${statusMeta.badge}`}
          >
            {statusMeta.icon} {statusMeta.label}
          </span>
        </span>
        <Link
          href="/dashboard/submissions"
          className="text-[var(--primary)] hover:underline"
        >
          查看全部投稿 →
        </Link>
      </div>
    </article>
  );
}
