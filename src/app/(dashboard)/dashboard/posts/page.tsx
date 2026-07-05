import Link from "next/link";
import { auth } from "@/auth";
import { getAllPosts } from "@/lib/posts";
import { POST_TYPE_LABELS } from "@/types/post";
import { DeleteButton } from "./delete-button";
import { Plus, Edit3 } from "lucide-react";

export default async function PostsPage() {
  const session = await auth();
  if (!session?.user) {
    return null; // 父 layout 已经 redirect 到 login
  }
  // 仅站长可访问作品管理（防止普通用户直接输 URL 看到后台）
  if (session.user.id !== process.env.ADMIN_USER_ID) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-8 text-center">
        <h1 className="text-xl font-bold text-red-400 mb-2">403 无权限</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          作品管理仅站长可访问。
        </p>
      </div>
    );
  }

  const posts = getAllPosts({ includeDrafts: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">作品管理</h1>
        <Link
          href="/dashboard/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          新建作品
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <p className="text-[var(--muted-foreground)]">暂无作品</p>
          <Link
            href="/dashboard/posts/new"
            className="text-sm text-[var(--primary)] hover:underline mt-2 inline-block"
          >
            创建第一篇作品
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)]">
                  标题
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)]">
                  类型
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)]">
                  日期
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)]">
                  状态
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.slug}
                  className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--muted)]/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <Link
                        href={`/post/${post.slug}`}
                        className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                      >
                        {post.title}
                      </Link>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate max-w-xs">
                        {post.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--foreground)]">
                      {POST_TYPE_LABELS[post.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                    {post.publishedAt}
                  </td>
                  <td className="px-4 py-3">
                    {post.draft ? (
                      <span className="text-xs text-amber-500">草稿</span>
                    ) : (
                      <span className="text-xs text-emerald-500">已发布</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/posts/${post.slug}/edit`}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                      >
                        <Edit3 className="h-3 w-3" />
                        编辑
                      </Link>
                      <DeleteButton slug={post.slug} title={post.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
