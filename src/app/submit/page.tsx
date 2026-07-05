/**
 * /submit — 用户投稿页面
 *  - 需要登录（未登录 → /login）
 *  - 复用 PostForm，隐藏管理员专用字段（draft、publishedAt、原作者、来源平台、原帖链接）
 *  - 图片上传走 /api/user/upload-image（带限流）
 *  - 提交走 /api/user/submit-post（写入 PendingPost，等待站长审核）
 *  - 驳回后重提：/submit?resubmit=<pendingPostId> → 查询本人该条 REJECTED 投稿，prefill 回填表单（slug 强制空，防唯一冲突）
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PostForm } from "@/components/admin/post-form";
import {
  USER_DAILY_LIMIT,
  SITE_DAILY_LIMIT,
  getUserTodayUploadCount,
  getSiteTodayUploadCount,
} from "@/lib/upload-rate-limit";
import type { PostType, SourcePlatform } from "@/types/post";

export const metadata = {
  title: "投稿作品 - 达妮娅的瞌睡小屋",
  description: "向站长投稿您的作品，审核通过后将出现在首页",
};

interface PageProps {
  searchParams: Promise<{ resubmit?: string }>;
}

export default async function SubmitPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/submit");
  }
  const userId = session.user.id;

  const params = await searchParams;

  // 计算今日额度（Server 直接读进程内 Map，上传成功后 router.refresh() 会重跑这里）
  const userUsed = getUserTodayUploadCount(userId);
  const siteUsed = getSiteTodayUploadCount();
  const userRemaining = Math.max(0, USER_DAILY_LIMIT - userUsed);
  const siteRemaining = Math.max(0, SITE_DAILY_LIMIT - siteUsed);
  const userPct = Math.min(100, Math.round((userUsed / USER_DAILY_LIMIT) * 100));
  const sitePct = Math.min(100, Math.round((siteUsed / SITE_DAILY_LIMIT) * 100));

  // --- 驳回后修改重提：?resubmit=<pendingPostId> ---
  // 权限：必须本用户 + 状态=REJECTED，否则静默忽略（不报错，让用户当普通新建）
  let prefill: NonNullable<Parameters<typeof PostForm>[0]["prefill"]> | undefined;
  if (params.resubmit) {
    const rec = await prisma.pendingPost.findUnique({
      where: { id: String(params.resubmit) },
    });
    if (rec && rec.userId === userId && rec.status === "REJECTED") {
      prefill = {
        meta: {
          title: rec.title,
          description: rec.description,
          type: (rec.type as PostType) || "illustration",
          tags: rec.tags,
          images: rec.images,
          videoId: rec.videoId ?? undefined,
          originalCreator: rec.originalCreator ?? undefined,
          sourcePlatform: (rec.sourcePlatform as SourcePlatform) ?? undefined,
          sourceUrl: rec.sourceUrl ?? undefined,
          // 关键：slug 强制留空，让 PostForm 按新标题自动生成新 slug，避免和原投稿的 UNIQUE 索引冲突
          slug: "",
        },
        body: rec.content ?? "",
      };
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)]/50 p-4 text-sm text-[var(--muted-foreground)]">
        <p className="font-medium text-[var(--foreground)] mb-1">
          投稿须知
        </p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>投稿后不会立即显示，需要站长人工审核通过才会出现在首页</li>
          <li>图片上传额度：单用户每日 3 张，全站每日 8 张（ImgURL 免费版限制，站长没米呜呜呜呜呜QAQ）</li>
          <li>请确保您投稿的内容不侵犯他人版权，违规内容将被驳回</li>
          <li>如果您填写了原作者 / 来源平台 / 原帖链接，将在审核时被采纳</li>
        </ul>
      </div>

      {/* 今日额度卡片（方案A：Server 直读，上传成功后 router.refresh 重渲染此处） */}
      <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)]/50 p-4">
        <p className="font-medium text-[var(--foreground)] mb-3">
          📊 今日额度（每日会刷新）
        </p>
        <div className="space-y-3 text-sm">
          {/* 全站剩余 */}
          <div>
            <div className="flex justify-between text-[var(--muted-foreground)] mb-1">
              <span>全站剩余可上传</span>
              <span className="text-[var(--foreground)] font-medium">
                {siteRemaining} / {SITE_DAILY_LIMIT} 张
                {siteRemaining === 0 && (
                  <span className="ml-2 text-red-500">（已用完，明天再来QAQ）</span>
                )}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--muted)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all"
                style={{ width: `${sitePct}%` }}
              />
            </div>
          </div>
          {/* 我的剩余 */}
          <div>
            <div className="flex justify-between text-[var(--muted-foreground)] mb-1">
              <span>我的剩余可上传</span>
              <span className="text-[var(--foreground)] font-medium">
                {userRemaining} / {USER_DAILY_LIMIT} 张
                {userRemaining === 0 && (
                  <span className="ml-2 text-red-500">（今日额度已用完）</span>
                )}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--muted)] overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${userPct}%` }}
              />
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          上传成功后额度数字会自动刷新
        </p>
      </div>

      {prefill && (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-300">
          💡 您正在根据一条之前被驳回的投稿进行修改后重新提交，系统已为您自动回填了原内容。修改完毕后请点击提交。
        </div>
      )}

      <PostForm
        mode="submit"
        uploadEndpoint="/api/user/upload-image"
        uploadHint="上传到 ImgURL 图床（每用户每日 3 张 / 全站每日 8 张）"
        submitEndpoint="/api/user/submit-post"
        successRedirect="/"
        hiddenFields={["draft", "publishedAt", "originalCreator", "sourcePlatform", "sourceUrl"]}
        pageTitle={{ new: prefill ? "修改重提（待审核）" : "投稿作品（待审核）", edit: "编辑投稿" }}
        submitButtonText={{ new: prefill ? "重新提交审核" : "提交审核", edit: "保存修改" }}
        refreshQuotaOnUpload={true}
        prefill={prefill}
      />
    </div>
  );
}
