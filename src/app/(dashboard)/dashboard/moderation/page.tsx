/**
 * /dashboard/moderation — 站长专属审核页面
 *  - 仅 ADMIN_USER_ID 可访问
 *  - 其他人：普通用户 → 403 提示，未登录 → /login
 *  - 功能：查看投稿列表、按状态筛选、查看详情、通过（补全来源信息后写 MDX 发布）、驳回（填理由）
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ModerationPanel } from "./moderation-panel";

export const metadata = {
  title: "投稿审核 - 站长控制台",
  description: "审核用户投稿的作品，仅站长可访问",
};

export default async function ModerationPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/moderation");
  }
  if (session.user.id !== process.env.ADMIN_USER_ID) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-8">
          <h1 className="text-xl font-bold text-red-400 mb-2">403 无权限</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            投稿审核页面仅站长可访问。
          </p>
        </div>
      </div>
    );
  }

  return <ModerationPanel />;
}
