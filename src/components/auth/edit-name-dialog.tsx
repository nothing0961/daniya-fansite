"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPen, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EditNameDialogProps {
  /** 当前昵称，用于初始化输入框默认值；传 null/undefined 则为空 */
  currentName: string | null | undefined;
  /** 提交成功后额外回调（可选） */
  onNameUpdated?: (newName: string) => void;
}

/**
 * 「编辑ID / 修改昵称」对话框
 * - 点击"编辑ID"按钮 → 弹窗 → input 输入昵称（2-20 字符）→ 提交 PATCH /api/user/profile { name } → router.refresh()
 * - 复用 AvatarUploadDialog 同款 Dialog UI 风格
 */
export function EditNameDialog({
  currentName,
  onNameUpdated,
}: EditNameDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(currentName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 打开弹窗时重置为当前昵称（防止父组件刷新后 props 更新没同步）
  function handleOpenChange(next: boolean) {
    if (next) {
      setInputValue(currentName ?? "");
      setError("");
    }
    setOpen(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();

    // 前端同步校验（与后端保持一致：2-20 字符）
    if (trimmed.length < 2) {
      setError("昵称至少 2 个字符");
      return;
    }
    if (trimmed.length > 20) {
      setError("昵称不能超过 20 个字符");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "保存失败，请稍后再试");
        return;
      }

      onNameUpdated?.(trimmed);
      setOpen(false);
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        <Button variant="outline" size="sm">
          <UserPen className="mr-2 h-4 w-4" />
          编辑ID
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle>修改昵称（编辑ID）</DialogTitle>
        <DialogDescription>
          昵称长度 2-20 个字符，修改后全站显示会同步更新。
        </DialogDescription>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--foreground)]">
              新昵称
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="请输入 2-20 字符的昵称"
              maxLength={24}
              autoFocus
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
            <p className="text-xs text-[var(--muted-foreground)]">
              当前已输入 {inputValue.trim().length}/20 字符
            </p>
          </div>

          {error && (
            <p className="text-sm text-[var(--destructive)]">{error}</p>
          )}

          {submitting && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在保存...
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={submitting || inputValue.trim().length < 2}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPen className="mr-2 h-4 w-4" />
              )}
              保存
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
