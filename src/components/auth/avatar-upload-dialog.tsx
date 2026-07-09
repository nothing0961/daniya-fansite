"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Cropper, { Area } from "react-easy-crop";
import { Upload, Loader2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AvatarUploadDialogProps {
  currentImage: string | null | undefined;
  userName: string | null | undefined;
  onImageUpdated?: (url: string) => void;
}

/** 裁剪信息：位置 + 缩放 */
type Crop = { x: number; y: number };

export function AvatarUploadDialog({
  currentImage,
  userName,
  onImageUpdated,
}: AvatarUploadDialogProps) {
  const router = useRouter();
  const { update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const initials = userName?.charAt(0).toUpperCase() || "?";
  const displayImage = preview ?? currentImage;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("图片大小不能超过 5MB");
      return;
    }

    setError("");
    // 清理上一次的临时 URL
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
    }
    const src = URL.createObjectURL(file);
    // 设置裁剪源→进入裁剪界面（单一 Dialog 内切换 UI，避免嵌套 modal 问题
    setCropImageSrc(src);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  function handleCancelCrop() {
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(null);
    setCroppedAreaPixels(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function createImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = src;
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
    });
  }

  async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area
  ): Promise<File> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 不可用");

    // 输出尺寸：512×512 头像大小
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise<File>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas 转 Blob 失败"));
            return;
          }
          resolve(
            new File([blob], `avatar-${Date.now()}.jpg`, { type: "image/jpeg" })
          );
        },
        "image/jpeg",
        0.92
      );
    });
  }

  async function handleConfirmCrop() {
    if (!cropImageSrc || !croppedAreaPixels) {
      setError("请先调整裁剪区域");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const file = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      await upload(file);
    } catch {
      setError("裁剪失败，请重试");
    } finally {
      setUploading(false);
    }
  }

  async function upload(file: File) {
    const isDirectCall = arguments.length === 1 && uploading;
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/user/upload-image", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.success) {
        setError(uploadData.message || uploadData.error || "上传失败");
        return;
      }

      const imageUrl: string = uploadData.data.url;

      const patchRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });

      if (!patchRes.ok) {
        const patchData = await patchRes.json().catch(() => ({}));
        setError(patchData.error || "保存头像失败");
        return;
      }

      onImageUpdated?.(imageUrl);
      setPreview(imageUrl);
      await update({ image: imageUrl });

      if (cropImageSrc) {
        URL.revokeObjectURL(cropImageSrc);
      }
      setCropImageSrc(null);
      setCroppedAreaPixels(null);
      setOpen(false);
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      void isDirectCall;
    }
  }

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixelsData: Area) => {
      setCroppedAreaPixels(croppedAreaPixelsData);
    },
    []
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next && cropImageSrc) {
          URL.revokeObjectURL(cropImageSrc);
          setCropImageSrc(null);
          setCroppedAreaPixels(null);
        }
      }}
    >
      <DialogTrigger>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          更换头像
        </Button>
      </DialogTrigger>

      <DialogContent>
        {/* ========== 裁剪界面（选择文件后进入——同一 Dialog 内 UI 切换，避免嵌套 Radix Dialog 焦点陷阱） ========== */}
        {cropImageSrc ? (
          <>
            <DialogTitle>裁剪头像（1:1）</DialogTitle>
            <DialogDescription>
              拖动图片调整位置，滚轮或手势缩放，满意后点击「确认裁剪」。
            </DialogDescription>

            <div className="relative h-72 w-full mt-4 rounded-md overflow-hidden border border-[var(--border)] bg-[var(--muted)]">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                cropShape="round"
                showGrid={false}
              />
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在裁剪并上传...
              </div>
            )}

            {error && (
              <p className="text-sm text-[var(--destructive)]">{error}</p>
            )}

            <DialogFooter className="mt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelCrop}
                disabled={uploading}
              >
                <X className="mr-2 h-4 w-4" />
                取消
              </Button>
              <Button
                type="button"
                onClick={handleConfirmCrop}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                确认裁剪
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* ========== 初始界面：预览 + 选择图片按钮（未选择图片时） ========== */
          <>
            <DialogTitle>更换头像</DialogTitle>
            <DialogDescription>
              选择一张图片作为您的个人头像，支持 JPG、PNG、WebP 格式，大小不超过 5MB。选择后会弹出裁剪框（1:1 比例）。
            </DialogDescription>

            <div className="flex flex-col items-center gap-4 mt-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={displayImage || undefined}
                  alt={userName || "用户"}
                />
                <AvatarFallback className="text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {uploading && (
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在上传...
                </div>
              )}

              {error && (
                <p className="text-sm text-[var(--destructive)]">{error}</p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              <Button
                className="rounded-full border border-pink-300 bg-pink-100 text-pink-700 hover:bg-pink-200 hover:border-pink-400 dark:border-pink-500/50 dark:bg-pink-500/20 dark:text-pink-300 dark:hover:bg-pink-500/30 px-4 py-2 backdrop-blur-md transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                选择图片
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
