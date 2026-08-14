/**
 * 站内通知列表 — /dashboard/notifications
 * 目前仅站长有收件通知（投稿通知 / 审核结果反向通知）
 * 进入页面自动全部已读（铃铛红点清零）
 */
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MarkReadOnMount } from "./mark-read-on-mount";

const TYPE_META: Record<string, { label: string; dot: string }> = {
  SUBMISSION: { label: "投稿通知", dot: "bg-[var(--primary)]" },
  APPROVED: { label: "审核通过", dot: "bg-[#7bd88f]" },
  REJECTED: { label: "审核驳回", dot: "bg-[#e88080]" },
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

export default async function NotificationsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold tracking-wide text-[var(--foreground)] mb-6">
        站内通知
      </h1>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            还没有通知，小屋安安静静的 ✦
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => {
            const meta =
              TYPE_META[n.type] ?? { label: "通知", dot: "bg-[var(--muted-foreground)]" };
            const unread = !n.readAt;
            return (
              <li key={n.id}>
                <Link
                  href={n.link ?? "#"}
                  className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                    unread
                      ? "border-[rgba(231,155,190,0.35)] bg-[color-mix(in_oklch,var(--primary)_8%,var(--card))]"
                      : "border-[var(--border)] bg-[var(--card)] opacity-75"
                  } hover:border-[var(--primary)]/40`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xs font-medium text-[var(--primary)]">
                        {meta.label}
                      </span>
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        {n.title}
                      </span>
                      <span className="ml-auto text-xs text-[var(--muted-foreground)]">
                        {formatRelative(n.createdAt.toISOString())}
                      </span>
                    </div>
                    {n.body && (
                      <p className="mt-1 text-xs text-[var(--muted-foreground)] break-words">
                        {n.body}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <MarkReadOnMount />
    </div>
  );
}
