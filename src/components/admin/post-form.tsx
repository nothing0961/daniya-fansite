"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import { postMetaSchema } from "@/lib/validators/post-schema";
import { submitPostSchema } from "@/lib/validators/submit-post-schema";
import { POST_TYPE_LABELS, PLATFORM_LABELS, CHARACTERS, CHARACTER_LABELS, type PostType, type SourcePlatform, type Character } from "@/types/post";
import { ImageUploader } from "@/components/admin/image-uploader";
import { BvInput } from "@/components/admin/bv-input";
import { MdxEditor } from "@/components/admin/mdx-editor";
import { useStatusModal } from "@/components/ui/status-modal";
import { classifySubmitError } from "@/lib/submit-error-classifier";
import type { PostMetaInput } from "@/lib/validators/post-schema";

interface PostFormProps {
  initialData?: {
    meta: PostMetaInput & { slug: string };
    body: string;
  };
  /** 预填数据（用于"驳回后修改重提"场景）—— 仅用于表单初始值填充，不切换为编辑模式
   *  与 initialData 的区别：initialData 会把 isEdit 设为 true，走 PUT 编辑接口；
   *  prefill 只是简单填默认值，isEdit 仍为 false，走 POST 新建投稿接口。
   *  注意：prefill.meta.slug 通常应为空字符串（''），让 PostForm 根据 title 自动重新生成新 slug，避免撞库。
   */
  prefill?: {
    meta: Partial<PostMetaInput> & { slug?: string };
    body?: string;
  };
  /** 模式：admin 用 postMetaSchema，submit 用 submitPostSchema */
  mode?: "admin" | "submit";
  /** 图片上传接口（默认 /api/admin/upload-image，用户投稿用 /api/user/upload-image） */
  uploadEndpoint?: string;
  /** 图床说明文案 */
  uploadHint?: string;
  /** 提交接口（新建时），默认 /api/admin/posts */
  submitEndpoint?: string;
  /** 编辑接口，默认 /api/admin/posts/${slug} */
  editEndpoint?: (slug: string) => string;
  /** 提交成功后跳转的路径，默认 /dashboard/posts */
  successRedirect?: string;
  /** 按钮标题默认（新建）"发布作品"，（编辑）"保存修改" */
  submitButtonText?: { new?: string; edit?: string };
  /** 页面顶部主标题（新建/编辑）*/
  pageTitle?: { new?: string; edit?: string };
  /** 隐藏部分字段（投稿页面不需要管理员专用字段，如 draft、publishedAt、originalCreator、sourcePlatform、sourceUrl）*/
  hiddenFields?: Array<"draft" | "publishedAt" | "originalCreator" | "sourcePlatform" | "sourceUrl">;
  /** 构造提交给后端的 payload，入参是表单字段；默认原封不动打包（{ ...fields, slug, body }）*/
  buildPayload?: (fields: Record<string, unknown>) => unknown;
  /** 成功回调（默认跳转 successRedirect）*/
  onSubmitSuccess?: (res: any) => void;
  /** 图片上传成功后是否刷新当前页（用于刷新投稿页的额度显示卡片；Server→Client 传 boolean 避免序列化问题）*/
  refreshQuotaOnUpload?: boolean;
}

const POST_TYPES = Object.keys(POST_TYPE_LABELS) as PostType[];
const PLATFORMS = Object.keys(PLATFORM_LABELS) as SourcePlatform[];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function slugFromTitle(title: string): string {
  return title
    .replace(/[^\w一-鿿-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "untitled";
}

export function PostForm({
  initialData,
  prefill,
  mode = "admin",
  uploadEndpoint = "/api/admin/upload-image",
  uploadHint = "上传到 ImgURL 图床",
  submitEndpoint = "/api/admin/posts",
  editEndpoint,
  successRedirect = "/dashboard/posts",
  submitButtonText,
  pageTitle,
  hiddenFields = [],
  buildPayload,
  onSubmitSuccess,
  refreshQuotaOnUpload = false,
}: PostFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const validationSchema = mode === "submit" ? submitPostSchema : postMetaSchema;

  // 上传成功回调：refreshQuotaOnUpload=true 时刷新当前页，让 Server 端重新计算额度卡片数字
  const onUploadSuccess = refreshQuotaOnUpload
    ? () => router.refresh()
    : undefined;

  const HIDDEN = new Set(hiddenFields);

  // initialData（编辑模式）优先级高于 prefill（驳回重提填默认值模式）
  const $meta = initialData?.meta ?? prefill?.meta ?? {};
  const $body = initialData?.body ?? prefill?.body ?? "";

  const [title, setTitle] = useState($meta.title || "");
  const [slug, setSlug] = useState($meta.slug || "");
  const [description, setDescription] = useState($meta.description || "");
  const [type, setType] = useState<PostType>(($meta.type as PostType) || "illustration");
  /** 关联角色（方案 A：前端默认 DANIYA；投稿/编辑都可改，但 schema 是可选） */
  const [character, setCharacter] = useState<Character>(
    ($meta.character as Character) || "DANIYA"
  );
  const [originalCreator, setOriginalCreator] = useState($meta.originalCreator || "");
  const [sourceUrl, setSourceUrl] = useState($meta.sourceUrl || "");
  const [sourcePlatform, setSourcePlatform] = useState<SourcePlatform>(
    ($meta.sourcePlatform as SourcePlatform) || "weibo"
  );
  const [tagsInput, setTagsInput] = useState(
    (($meta.tags as string[] | undefined) || []).join(", ")
  );
  const [publishedAt, setPublishedAt] = useState(
    $meta.publishedAt ? String($meta.publishedAt).slice(0, 10) : todayStr()
  );
  const [draft, setDraft] = useState($meta.draft ?? false);
  const [images, setImages] = useState<string[]>(($meta.images as string[] | undefined) || []);
  const [videoId, setVideoId] = useState($meta.videoId || "");
  const [body, setBody] = useState($body);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showSuccess, showError } = useStatusModal();

  const computedSlug = useMemo(() => slugFromTitle(title), [title]);
  const displaySlug = slug || computedSlug;

  function handleTitleChange(value: string) {
    setTitle(value);
    // Auto-fill slug from title if slug is empty or matches the old computed slug
    if (!slug || slug === slugFromTitle(title)) {
      setSlug(slugFromTitle(value));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    // Parse tags
    const tags = tagsInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

    const finalSlug = slug || computedSlug;

    // 构造校验对象：根据隐藏字段，把隐藏的用默认值补全（防止 schema 报错）
    const data: any = {
      title,
      description,
      type,
      originalCreator: HIDDEN.has("originalCreator")
        ? "匿名投稿"
        : originalCreator,
      sourceUrl: HIDDEN.has("sourceUrl")
        ? `https://example.com/submission/${finalSlug || "pending"}`
        : sourceUrl,
      sourcePlatform: HIDDEN.has("sourcePlatform")
        ? "other"
        : sourcePlatform,
      tags,
      publishedAt: HIDDEN.has("publishedAt")
        ? todayStr()
        : publishedAt,
      draft: HIDDEN.has("draft") ? false : draft,
      images,
      videoId: videoId || undefined,
    };

    const parsed = validationSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (msgs && msgs.length > 0) {
          fieldErrors[key] = msgs[0];
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    const rawPayload: any = { ...data, slug: finalSlug, body };
    const payload = buildPayload ? buildPayload(rawPayload) : rawPayload;

    const url = isEdit
      ? (editEndpoint ? editEndpoint(initialData!.meta.slug) : `/api/admin/posts/${initialData!.meta.slug}`)
      : submitEndpoint;
    const method = isEdit ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "保存失败" }));
          const classified = classifySubmitError(err.error || err.message || err.msg || "保存失败");
          showError("提交失败，请再检查", { detail: classified.detail });
          return;
        }
        const json = await res.json();
        if (onSubmitSuccess) {
          onSubmitSuccess(json);
        } else if (mode === "submit" && !isEdit) {
          // 用户点击「提交审核」的新建投稿成功：弹「提交成功，等待审核」→ 必须手动关
          // 关了之后跳「用户投稿预览页」/dashboard/submissions/<slug>，右上状态胶囊可见（方案 A）
          const slug = (json as Record<string, unknown>)?.slug as
            | string
            | undefined;
          showSuccess("提交成功，等待审核", {
            autoClose: false,
            message:
              "您的作品已提交站长人工审核，通过后将出现在首页 ✨。" +
              "关闭提示后可查看作品预览，随时关注审核进度。",
            onDismiss: () => {
              router.push(
                slug
                  ? `/dashboard/submissions/${slug}`
                  : "/dashboard/submissions",
              );
            },
          });
        } else {
          // 管理后台「发布作品 / 保存修改」：保持原行为直接跳转
          router.push(successRedirect);
          router.refresh();
        }
      })
      .catch(() => {
        const classified = classifySubmitError("保存失败，请检查网络");
        showError("提交失败，请再检查", { detail: classified.detail });
      })
      .finally(() => {
        setSubmitting(false);
      });
  }

  const inputClass =
    "flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";
  const selectClass = inputClass + " appearance-none";
  const labelClass = "text-sm font-medium text-[var(--foreground)] mb-1.5 block";
  const errorClass = "text-xs text-red-400 mt-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {isEdit
              ? (pageTitle?.edit ?? "编辑作品")
              : (pageTitle?.new ?? "新建作品")}
          </h1>
          {isEdit && (
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {initialData?.meta.title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit
              ? (submitButtonText?.edit ?? "保存修改")
              : (submitButtonText?.new ?? "发布作品")}
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-[var(--foreground)] mb-2">
          基本信息
        </legend>

        <div>
          <label className={labelClass}>标题 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="作品标题"
            className={inputClass}
          />
          {errors.title && <p className={errorClass}>{errors.title}</p>}
        </div>

        <div>
          <label className={labelClass}>标识 (slug)</label>
          <input
            type="text"
            value={displaySlug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="article-slug"
            className={inputClass}
          />
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            URL 中的唯一标识，由标题自动生成，也可手动修改
          </p>
        </div>

        <div>
          <label className={labelClass}>简介 *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="作品简介（1-300字）"
            rows={3}
            className={inputClass + " min-h-[80px] resize-y"}
          />
          {errors.description && <p className={errorClass}>{errors.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {!HIDDEN.has("publishedAt") && (
            <div>
              <label className={labelClass}>发布日期 *</label>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className={inputClass}
              />
              {errors.publishedAt && <p className={errorClass}>{errors.publishedAt}</p>}
            </div>
          )}
          <div>
            <label className={labelClass}>作品类型 *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PostType)}
              className={selectClass}
            >
              {POST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {POST_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            {errors.type && <p className={errorClass}>{errors.type}</p>}
          </div>

          {/* 关联角色下拉 — 方案 A：前端默认 DANIYA，投稿时用户无法修改（没有管理员权限不能改）；
              实际上所有角色对用户也开放，只是目前只有一个选项；为满足测试和未来可扩展，这里始终渲染 */}
          <div>
            <label className={labelClass}>关联角色</label>
            <select
              value={character}
              onChange={(e) => setCharacter(e.target.value as Character)}
              className={selectClass}
              aria-label="关联角色"
            >
              {CHARACTERS.map((c) => (
                <option key={c} value={c}>
                  {CHARACTER_LABELS[c]}
                </option>
              ))}
            </select>
            {errors.character && <p className={errorClass}>{errors.character}</p>}
          </div>
        </div>

        {!HIDDEN.has("draft") && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="draft"
              checked={draft}
              onChange={(e) => setDraft(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
            />
            <label htmlFor="draft" className="text-sm text-[var(--foreground)] cursor-pointer">
              草稿（生产环境不显示）
            </label>
          </div>
        )}
      </fieldset>

      {/* Source Info */}
      {(!HIDDEN.has("originalCreator") || !HIDDEN.has("sourcePlatform") || !HIDDEN.has("sourceUrl")) && (
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-[var(--foreground)] mb-2">
            来源信息
          </legend>

          {(!HIDDEN.has("originalCreator") || !HIDDEN.has("sourcePlatform")) && (
            <div className="grid grid-cols-2 gap-4">
              {!HIDDEN.has("originalCreator") && (
                <div>
                  <label className={labelClass}>原作者 *</label>
                  <input
                    type="text"
                    value={originalCreator}
                    onChange={(e) => setOriginalCreator(e.target.value)}
                    placeholder="画师昵称"
                    className={inputClass}
                  />
                  {errors.originalCreator && <p className={errorClass}>{errors.originalCreator}</p>}
                </div>
              )}

              {!HIDDEN.has("sourcePlatform") && (
                <div>
                  <label className={labelClass}>来源平台 *</label>
                  <select
                    value={sourcePlatform}
                    onChange={(e) => setSourcePlatform(e.target.value as SourcePlatform)}
                    className={selectClass}
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {PLATFORM_LABELS[p]}
                      </option>
                    ))}
                  </select>
                  {errors.sourcePlatform && <p className={errorClass}>{errors.sourcePlatform}</p>}
                </div>
              )}
            </div>
          )}

          {!HIDDEN.has("sourceUrl") && (
            <div>
              <label className={labelClass}>原帖链接 *</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
              {errors.sourceUrl && <p className={errorClass}>{errors.sourceUrl}</p>}
            </div>
          )}
        </fieldset>
      )}

      {/* Tags */}
      <fieldset>
        <label className={labelClass}>标签</label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="用逗号分隔，如：fanart, 达妮娅, 插画"
          className={inputClass}
        />
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          最多 8 个标签，用逗号分隔
        </p>
        {errors.tags && <p className={errorClass}>{errors.tags}</p>}
      </fieldset>

      {/* Images */}
      <fieldset>
        <label className={labelClass}>配图</label>
        <ImageUploader
          images={images}
          onChange={setImages}
          uploadEndpoint={uploadEndpoint}
          hint={uploadHint}
          onUploadSuccess={onUploadSuccess}
        />
      </fieldset>

      {/* Bilibili Video */}
      {type === "video" && (
        <fieldset>
          <label className={labelClass}>B站视频 BV 号</label>
          <BvInput value={videoId} onChange={setVideoId} />
        </fieldset>
      )}

      {/* MDX Body */}
      <fieldset>
        <label className={labelClass}>正文内容 (MDX)</label>
        <MdxEditor value={body} onChange={setBody} />
      </fieldset>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit
            ? (submitButtonText?.edit ?? "保存修改")
            : (submitButtonText?.new ?? "发布作品")}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}
