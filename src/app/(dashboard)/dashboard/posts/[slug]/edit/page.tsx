import { notFound, redirect } from "next/navigation";
import matter from "gray-matter";
import { auth } from "@/auth";
import { getPostContent } from "@/lib/posts";
import { PostForm } from "@/components/admin/post-form";

interface EditPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditPostPage({ params }: EditPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  // 仅站长可编辑作品（防止普通用户通过直链 URL 访问后台编辑器）
  if (session.user.id !== process.env.ADMIN_USER_ID) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-8 text-center">
        <h1 className="text-xl font-bold text-red-400 mb-2">403 无权限</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          编辑作品仅站长可访问。
        </p>
      </div>
    );
  }

  const { slug } = await params;
  const content = getPostContent(slug);
  if (!content) notFound();

  const parsed = matter(content.rawContent);
  const body = (parsed.content || "").trim();

  return (
    <PostForm
      initialData={{
        meta: { ...content.meta, slug },
        body,
      }}
    />
  );
}
