/**
 * 站长新建作品
 *  - 仅 ADMIN_USER_ID 可访问（普通用户请使用 /submit 投稿）
 *  - 直接发布，跳过审核流程
 */
import { auth } from "@/auth";
import { PostForm } from "@/components/admin/post-form";

export const metadata = {
  title: "新建作品 - 站长控制台",
};

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user) return null;
  // 仅站长可直接发布作品（普通用户只能通过 /submit 投稿，进入审核队列）
  if (session.user.id !== process.env.ADMIN_USER_ID) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-8 text-center">
        <h1 className="text-xl font-bold text-red-400 mb-2">403 无权限</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-3">
          新建作品仅站长可访问。普通用户请使用页面右上角「投稿」入口提交，审核通过后会发布。
        </p>
        <a
          href="/submit"
          className="inline-block px-4 py-2 text-sm rounded-md bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
        >
          前往投稿 →
        </a>
      </div>
    );
  }

  return <PostForm />;
}
