"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteButtonProps {
  slug: string;
  title: string;
}

export function DeleteButton({ slug, title }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`确定要删除「${title}」吗？此操作不可撤销。`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "删除失败");
        return;
      }
      router.refresh();
    } catch {
      alert("删除失败，请检查网络");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
      删除
    </button>
  );
}
