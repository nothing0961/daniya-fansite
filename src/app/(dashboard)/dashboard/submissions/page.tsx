/**
 * /dashboard/submissions — 我的投稿页（用户视角投稿列表，MVP 纯展示+取消+重提）
 *
 * Server Component（直接 prisma 查询 + searchParams.status 做 Tab 软导航切换）
 *   - auth() 守卫：未登录 401 重定向 login
 *   - Tab：全部 / 待审核 / 已通过 / 已驳回（URL query ?status= 控制，<a href> 切换，Next 软导航）
 *   - 每条一个垂直卡片：
 *       · PENDING：琥珀色左边框 + 💡 站长审核中提示 + 取消投稿（Server Action，仅PENDING可删）
 *       · APPROVED：绿色左边框 + ✅ 已发布 /post/xxx 跳转
 *       · REJECTED：红色左边框 + 🚫 驳回理由红框 + 修改后重新提交（跳 /submit?resubmit=id）
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { PendingPostStatus } from "@prisma/client";
import { POST_TYPE_LABELS } from "@/types/post";

type TabKey = "ALL" | PendingPostStatus;

const TABS: Array<{ key: TabKey; label: string; color: string }> = [
  { key: "ALL", label: "全部", color: "text-[var(--muted-foreground)]" },
  { key: "PENDING", label: "待审核", color: "text-amber-400" },
  { key: "APPROVED", label: "已通过", color: "text-emerald-400" },
  { key: "REJECTED", label: "已驳回", color: "text-red-400" },
];

const STATUS_LABEL_ZH: Record<PendingPostStatus, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "已驳回",
};

interface PageProps {
  searchParams: { status?: string };
}

export const metadata = {
  title: "我的投稿 - 达妮娅的瞌睡小屋",
  description: "查看您向站长提交的所有作品及审核状态",
};

// ---------- 取消投稿 Server Action（仅 PENDING 本人可删）----------
async function cancelSubmissionAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !id) return;
  const rec = await prisma.pendingPost.findUnique({ where: { id }, select: { userId: true, status: true } });
  // 本人 + PENDING 才允许删（幂等保护）
  if (!rec || rec.userId !== userId) return;
  if (rec.status !== "PENDING") return; // 非 PENDING 409 风格静默忽略
  await prisma.pendingPost.delete({ where: { id } });
  revalidatePath("/dashboard/submissions");
}

export default async function MySubmissionsPage({ searchParams }: PageProps) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login?callbackUrl=/dashboard/submissions");
  }

  // --- Tab 过滤 ---
  const rawStatus = (searchParams.status ?? "ALL").toUpperCase();
  const tab: TabKey = (["ALL", "PENDING", "APPROVED", "REJECTED"].includes(rawStatus)
    ? rawStatus
    : "ALL") as TabKey;

  // --- 状态计数（Tab 数量 badge）---
  const statusCounts = await prisma.pendingPost.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  });
  const counts: Record<string, number> = {};
  for (const g of statusCounts) counts[g.status] = g._count.status;
  const totalAll = (counts.PENDING || 0) + (counts.APPROVED || 0) + (counts.REJECTED || 0);

  // --- 按过滤条件查询列表 ---
  const list = await prisma.pendingPost.findMany({
    where: tab === "ALL" ? { userId } : { userId, status: tab as PendingPostStatus },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // ---------- 渲染 ----------
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* 标题 */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">我的投稿</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            查看您向站长提交过的所有作品及审核状态 · 共 <span className="text-[var(--foreground)] font-medium">{totalAll}</span> 篇
          </p>
        </div>
        <Link
          href="/submit"
          className="text-sm px-3 py-1.5 rounded-md bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
        >
          + 新投稿
        </Link>
      </div>

      {/* Tabs （<a href> 跳 ?status= 实现软导航切换，无刷新）*/}
      <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto mb-6">
        {TABS.map((t) => {
          const n = t.key === "ALL" ? totalAll : counts[t.key] ?? 0;
          const active = tab === t.key;
          const href = t.key === "ALL"
            ? "/dashboard/submissions"
            : `/dashboard/submissions?status=${t.key}`;
          return (
            <Link
              key={t.key}
              href={href}
              className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className={active ? "" : t.color}>{t.label}</span>
              <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">({n})</span>
            </Link>
          );
        })}
      </div>

      {/* 列表 */}
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
          <p className="text-[var(--muted-foreground)] mb-4">当前筛选下还没有投稿</p>
          <Link href="/submit" className="text-sm text-[var(--primary)] hover:underline">
            去提交第一篇作品 →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((item) => {
            const typeLabel = POST_TYPE_LABELS[
              (item.type as keyof typeof POST_TYPE_LABELS) ?? "illustration"
            ] ?? item.type;
            const borderClass =
              item.status === "PENDING"
                ? "border-l-4 border-l-amber-400"
                : item.status === "APPROVED"
                ? "border-l-4 border-l-emerald-400"
                : "border-l-4 border-l-red-400";
            const badgeClass =
              item.status === "PENDING"
                ? "bg-amber-500/15 text-amber-400"
                : item.status === "APPROVED"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400";
            const thumb = item.images?.[0] ?? null;
            return (
              <article
                key={item.id}
                className={`rounded-xl border border-[var(--border)] bg-[var(--card)]/30 overflow-hidden ${borderClass}`}
              >
                <div className="flex gap-4 p-4">
                  {/* 缩略图 / 视频占位 */}
                  <div className="w-28 h-24 shrink-0 rounded-md bg-[var(--muted)]/40 border border-[var(--border)] overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : item.videoId ? (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted-foreground)] bg-[var(--muted)]/50">
                        🎬 视频
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted-foreground)]">
                        无图
                      </div>
                    )}
                  </div>

                  {/* 主体 */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* 第一行：标题 + 状态徽章 + 时间 */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-base font-semibold text-[var(--foreground)] line-clamp-1 flex-1">
                        {item.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium shrink-0 ${badgeClass}`}
                      >
                        {STATUS_LABEL_ZH[item.status]}
                      </span>
                    </div>

                    {/* 简介 */}
                    <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-2">
                      {item.description}
                    </p>

                    {/* 类型标签 + 时间 */}
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mb-2 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--muted)]/50 text-[var(--foreground)]">
                        {typeLabel}
                      </span>
                      {item.tags.length > 0 && (
                        <span className="text-[var(--muted-foreground)] line-clamp-1">
                          {item.tags.slice(0, 4).map((t) => `#${t}`).join(" ")}
                          {item.tags.length > 4 && ` +${item.tags.length - 4}`}
                        </span>
                      )}
                      <span className="ml-auto">
                        {new Date(item.createdAt).toLocaleString("zh-CN", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* 状态专属信息条 + 按钮 */}
                    <div className="mt-auto pt-2 space-y-2">
                      {/* PENDING：站长审核中 + 取消投稿 */}
                      {item.status === "PENDING" && (
                        <>
                          <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-400">
                            💡 站长审核中，通常 24 小时内处理，通过后会自动发布
                          </div>
                          <div className="flex justify-end">
                            {/* Server Action 表单：取消投稿（仅本人 + status===PENDING 双重守卫） */}
                            <form action={cancelSubmissionAction}>
                              <input type="hidden" name="id" value={item.id} />
                              <button
                                type="submit"
                                formAction={cancelSubmissionAction}
                                onClick={(e) => {
                                  if (
                                    !window.confirm("确定要取消这篇投稿吗？站长将不再看到它。")
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                                className="text-xs px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-red-500/50 hover:text-red-400 transition-colors"
                              >
                                取消投稿
                              </button>
                            </form>
                          </div>
                        </>
                      )}

                      {/* APPROVED：已发布 + 跳前台 */}
                      {item.status === "APPROVED" && item.publishedSlug && (
                        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs flex items-center justify-between gap-3">
                          <span className="text-emerald-400">✅ 已发布，感谢您的投稿！</span>
                          <Link
                            href={`/post/${item.publishedSlug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--primary)] underline underline-offset-2 whitespace-nowrap"
                          >
                            /post/{item.publishedSlug.slice(0, 24)}
                            {item.publishedSlug.length > 24 ? "…" : ""} ↗
                          </Link>
                        </div>
                      )}
                      {item.status === "APPROVED" && !item.publishedSlug && (
                        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs text-emerald-400">
                          ✅ 审核已通过，作品正在生成中…请稍后刷新
                        </div>
                      )}

                      {/* REJECTED：驳回理由（红框） + 修改后重新提交按钮 */}
                      {item.status === "REJECTED" && (
                        <>
                          <div className="rounded-md bg-red-500/10 border border-red-500/30 p-3 text-xs">
                            <p className="font-medium text-red-400 mb-1">🚫 驳回理由：</p>
                            <p className="text-[var(--foreground)] whitespace-pre-wrap">
                              {item.rejectReason ?? "未填写驳回理由"}
                            </p>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/submit?resubmit=${item.id}`}
                              className="text-xs px-3 py-1.5 rounded-md bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
                            >
                              修改后重新提交
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
