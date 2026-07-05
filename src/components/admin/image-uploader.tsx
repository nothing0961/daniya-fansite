"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { useStatusModal } from "@/components/ui/status-modal";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  /** 上传接口 URL，可覆盖，如 "/api/user/upload-image" */
  uploadEndpoint?: string;
  /** 文案中显示的图床说明，默认 "上传到 ImgURL 图床" */
  hint?: string;
  /** 上传成功后触发（可选，用于触发 router.refresh 刷新额度卡片等）*/
  onUploadSuccess?: () => void;
}

export function ImageUploader({
  images,
  onChange,
  uploadEndpoint = "/api/admin/upload-image",
  hint = "上传到 ImgURL 图床",
  onUploadSuccess,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const { showSuccess, showError } = useStatusModal();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        onChange([...images, data.data.url]);
        showSuccess("上传成功");
        onUploadSuccess?.();
      } else {
        // 两种错误格式兼容：
        // - admin: { success: false, message: "..." }
        // - user 限流/拒绝: { error: "...", meta: {...} }
        showError("上传失败", {
          detail: data.message || data.error || data.msg || "上传失败",
        });
      }
    } catch {
      showError("上传失败", { detail: "请检查网络" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "上传中..." : "上传图片"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <span className="text-xs text-[var(--muted-foreground)]">
          {hint}
        </span>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((url, i) => (
            <div key={url} className="relative group aspect-video rounded-md overflow-hidden border border-[var(--border)] bg-[var(--muted)]">
              <img
                src={url}
                alt={`配图 ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
