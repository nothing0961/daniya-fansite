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
import "./submit.css";

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
  const isAdmin = userId === process.env.ADMIN_USER_ID;

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
          originalCreator: rec.originalCreator ?? undefined,
          sourcePlatform: (rec.sourcePlatform as SourcePlatform) ?? undefined,
          sourceUrl: rec.sourceUrl ?? undefined,
        },
        body: rec.content ?? "",
      };
    }
  }

  const siteExhausted = siteRemaining === 0;
  const userExhausted = userRemaining === 0;

  return (
    <div className="sb-page">
      {/* Hero：信件投递台 + 金色邮戳章 */}
      <header className="sb-hero sb-rise">
        <div>
          <span className="sb-hero-eyebrow">✦ 小屋信箱</span>
          <h1 className="sb-hero-title">投稿作品</h1>
          <p className="sb-hero-sub">审核通过后将在小屋首页展出</p>
        </div>
        <div className="sb-stamp" aria-hidden="true">
          <div className="sb-stamp-inner">
            <span className="sb-stamp-word">投稿</span>
            <span className="sb-stamp-sub">SUBMIT</span>
          </div>
        </div>
      </header>

      <div className="sb-grid">
        {/* 投稿须知 */}
        <section className="sb-card sb-rise sb-rise-1">
          <h2 className="sb-card-head">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            投稿须知
          </h2>
          <ul className="sb-rules">
            <li>投稿后不会立即显示，需要站长人工审核通过才会出现在首页</li>
            <li>
              图片上传额度：<b>单用户每日 3 张，全站每日 8 张</b>
              （ImgURL 免费版限制，站长没米呜呜呜呜呜QAQ）
            </li>
            <li>请确保您投稿的内容不侵犯他人版权，违规内容将被驳回</li>
            <li>如果您填写了原作者 / 来源平台 / 原帖链接，将在审核时被采纳</li>
          </ul>
        </section>

        {/* 今日额度卡片（方案A：Server 直读，上传成功后 router.refresh 重渲染此处） */}
        <section className="sb-card sb-rise sb-rise-2">
          <h2 className="sb-card-head">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            今日额度
          </h2>

          {/* 全站剩余 */}
          <div className="sb-quota-row">
            <div className="sb-quota-meta">
              <span>全站剩余可上传</span>
              <span className="sb-quota-num">
                {siteRemaining} / {SITE_DAILY_LIMIT} 张
                {siteExhausted && <span className="ml-2 text-[#e88080]">（已用完，明天再来QAQ）</span>}
              </span>
            </div>
            <div className="sb-quota-track">
              <div
                className={`sb-quota-fill ${siteExhausted ? "sb-quota-fill--gold" : ""}`}
                style={{ width: `${sitePct}%` }}
              />
            </div>
          </div>

          {/* 我的剩余 */}
          <div className="sb-quota-row">
            <div className="sb-quota-meta">
              <span>我的剩余可上传</span>
              <span className="sb-quota-num">
                {userRemaining} / {USER_DAILY_LIMIT} 张
                {userExhausted && <span className="ml-2 text-[#e88080]">（今日额度已用完）</span>}
              </span>
            </div>
            <div className="sb-quota-track">
              <div
                className={`sb-quota-fill ${userExhausted ? "sb-quota-fill--gold" : ""}`}
                style={{ width: `${userPct}%` }}
              />
            </div>
          </div>

          <p className="sb-quota-note">每日会刷新 · 上传成功后额度数字会自动更新</p>
        </section>
      </div>

      {prefill && (
        <div className="sb-resubmit sb-rise sb-rise-3">
          💡 您正在根据一条之前被驳回的投稿进行<strong>修改后重新提交</strong>，系统已为您自动回填了原内容。修改完毕后请点击提交。
        </div>
      )}

      {isAdmin && (
        <div className="sb-admin-publish sb-rise sb-rise-3">
          ✦ 站长投稿将<strong>直接发布</strong>到小屋首页，无需经过审核队列。
        </div>
      )}

      {/* 表单玻璃容器 */}
      <div className="sb-form-shell sb-rise sb-rise-4">
        <PostForm
          mode="submit"
          uploadEndpoint="/api/user/upload-image"
          uploadHint="上传到 ImgURL 图床（每用户每日 3 张 / 全站每日 8 张）"
          submitEndpoint="/api/user/submit-post"
          successRedirect="/"
          hiddenFields={["draft", "publishedAt", "originalCreator", "sourcePlatform", "sourceUrl"]}
          pageTitle={{ new: prefill ? "修改重提（待审核）" : isAdmin ? "站长投稿（直接发布）" : "投稿作品（待审核）", edit: "编辑投稿" }}
          submitButtonText={{ new: prefill ? "重新提交审核" : isAdmin ? "直接发布" : "提交审核", edit: "保存修改" }}
          refreshQuotaOnUpload={true}
          prefill={prefill}
        />
      </div>
    </div>
  );
}
