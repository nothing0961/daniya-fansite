"use client";

/**
 * ModerationPanel — 站长审核面板（客户端组件）
 * 左侧：投稿列表（可按状态筛选）
 * 右侧抽屉：投稿详情 + 审核操作（通过 / 驳回）
 *
 * 仅 ADMIN_USER_ID 能进入此页面（父服务端组件已做守卫）。
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Clock, Eye, X, ChevronRight, AlertTriangle } from "lucide-react";
import type { PendingPostStatus } from "@prisma/client";
import { POST_TYPE_LABELS, PLATFORM_LABELS } from "@/types/post";
import "./../postal.css";

const STATUS_TABS: Array<{ key: PendingPostStatus | "ALL"; label: string; color: string }> = [
  { key: "ALL", label: "全部", color: "text-[var(--muted-foreground)]" },
  { key: "PENDING", label: "待审核", color: "text-amber-400" },
  { key: "APPROVED", label: "已通过", color: "text-emerald-400" },
  { key: "REJECTED", label: "已驳回", color: "text-red-400" },
];

const STATUS_ICON = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
} as const;

const STATUS_LABEL: Record<PendingPostStatus, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "已驳回",
};

/** 邮戳映射 — 分拣台：待投递 / 已抵达 / 已退回 */
const POSTMARK: Record<PendingPostStatus, { cls: string; label: string; sub: string }> = {
  PENDING: { cls: "postmark--pending", label: "待投递", sub: "分拣中" },
  APPROVED: { cls: "postmark--approved", label: "已抵达", sub: "已寄达" },
  REJECTED: { cls: "postmark--rejected", label: "已退回", sub: "可重提" },
};

/** 小邮戳（左侧列表单字） */
const POSTMARK_MINI: Record<PendingPostStatus, { cls: string; word: string }> = {
  PENDING: { cls: "postmark--pending", word: "待" },
  APPROVED: { cls: "postmark--approved", word: "达" },
  REJECTED: { cls: "postmark--rejected", word: "退" },
};

interface PendingPostListItem {
  id: string;
  userId: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  images: string[];
  tags: string[];
  originalCreator: string | null;
  sourcePlatform: string | null;
  sourceUrl: string | null;
  content: string;
  status: PendingPostStatus;
  rejectReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  publishedSlug: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; email: string | null; image: string | null };
}

interface ListResponse {
  list: PendingPostListItem[];
  meta: {
    statusCounts: Record<string, number>;
    limit: number;
    filter: PendingPostStatus | null;
  };
}

export function ModerationPanel() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const [tab, setTab] = useState<PendingPostStatus | "ALL">("PENDING");
  const [list, setList] = useState<PendingPostListItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PendingPostListItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 驳回表单
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // 通过表单（可补全来源信息）
  const [approveOverride, setApproveOverride] = useState<{
    title: string;
    description: string;
    originalCreator: string;
    sourcePlatform: string;
    sourceUrl: string;
    tags: string;
    publishedAt: string;
  }>({
    title: "",
    description: "",
    originalCreator: "",
    sourcePlatform: "other",
    sourceUrl: "",
    tags: "",
    publishedAt: new Date().toISOString().slice(0, 10),
  });
  const [approving, setApproving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // 加载列表
  async function loadList() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab !== "ALL") params.set("status", tab);
      params.set("limit", "50");
      const res = await fetch(`/api/moderation/posts?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ListResponse = await res.json();
      setList(data.list);
      setCounts(data.meta.statusCounts || {});
    } catch (e) {
      console.error("load list failed:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, [tab]);

  // 选中变更 → 加载详情
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    (async () => {
      setDetailLoading(true);
      setFormError("");
      setFormSuccess("");
      try {
        const res = await fetch(`/api/moderation/posts/${selectedId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d: PendingPostListItem = await res.json();
        setDetail(d);
        // 预填 override 表单
        setApproveOverride({
          title: d.title,
          description: d.description.slice(0, 300),
          originalCreator: d.originalCreator ?? "匿名投稿",
          sourcePlatform: d.sourcePlatform ?? "other",
          sourceUrl: d.sourceUrl ?? `https://example.com/user-submission/${d.slug}`,
          tags: (d.tags || []).join(", "),
          publishedAt: new Date().toISOString().slice(0, 10),
        });
        setRejectReason("");
      } catch (e) {
        console.error("load detail failed:", e);
      } finally {
        setDetailLoading(false);
      }
    })();
  }, [selectedId]);

  async function handleApprove() {
    if (!detail) return;
    setFormError("");
    setFormSuccess("");
    setApproving(true);
    try {
      const tagsArr = approveOverride.tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean);
      const body = {
        action: "approve" as const,
        overrides: {
          title: approveOverride.title,
          description: approveOverride.description,
          originalCreator: approveOverride.originalCreator,
          sourcePlatform: approveOverride.sourcePlatform,
          sourceUrl: approveOverride.sourceUrl,
          tags: tagsArr,
          publishedAt: approveOverride.publishedAt,
          draft: false,
        },
      };
      const res = await fetch(`/api/moderation/posts/${detail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "审核失败");
        return;
      }
      setFormSuccess(`✅ 已通过，作品已发布：${json.data?.publishedSlug || detail.slug}`);
      setTimeout(() => {
        setSelectedId(null);
        loadList();
        router.refresh();
      }, 1200);
    } catch {
      setFormError("网络错误，请重试");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!detail) return;
    if (rejectReason.trim().length < 2) {
      setFormError("驳回理由至少 2 个字符");
      return;
    }
    setFormError("");
    setFormSuccess("");
    setRejecting(true);
    try {
      const res = await fetch(`/api/moderation/posts/${detail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectReason: rejectReason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "驳回失败");
        return;
      }
      setFormSuccess("❌ 已驳回此投稿");
      setTimeout(() => {
        setSelectedId(null);
        loadList();
      }, 800);
    } catch {
      setFormError("网络错误，请重试");
    } finally {
      setRejecting(false);
    }
  }

  const inputClass =
    "flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-1.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";
  const labelClass = "text-xs font-medium text-[var(--foreground)] mb-1 block";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-[var(--muted-foreground)] mb-1">
            ✦ 分拣台
          </p>
          <h1 className="text-xl font-bold text-[var(--foreground)]">投稿审核</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            仅站长可访问 · 通过后盖章投递，自动生成 MDX 并发布到首页
          </p>
        </div>
        <button
          onClick={loadList}
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          刷新列表
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
        {STATUS_TABS.map((t) => {
          const count = t.key === "ALL"
            ? Object.values(counts).reduce((a, b) => a + (b || 0), 0)
            : counts[t.key] || 0;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className={active ? "" : t.color}>{t.label}</span>
              <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* 列表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[60vh]">
        {/* 左侧：列表 */}
        <div className="lg:col-span-2 space-y-2 overflow-y-auto max-h-[75vh] pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[var(--muted-foreground)]">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> 加载中...
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">
              当前筛选下没有待分拣的信
            </div>
          ) : (
            list.map((item) => {
              const pmMini = POSTMARK_MINI[item.status];
              const selected = selectedId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { if (isMobile) { router.push(`/dashboard/submissions/${item.slug}`); } else { setSelectedId(item.id); } }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selected
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--border)] bg-[var(--card)]/30 hover:border-[var(--primary)]/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-medium text-[var(--foreground)] line-clamp-1 flex-1">
                      {item.title}
                    </h3>
                    <span
                      className={`postmark postmark-mini ${pmMini.cls}`}
                      aria-label={`状态：${pmMini.word}`}
                    >
                      <span className="postmark-label">{pmMini.word}</span>
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mb-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--foreground)]">
                      {POST_TYPE_LABELS[item.type as keyof typeof POST_TYPE_LABELS] || item.type}
                    </span>
                    <span>{item.user.name || item.user.email || "匿名用户"}</span>
                    <ChevronRight className="h-3 w-3 ml-auto" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* 右侧：详情抽屉（信纸展开） */}
        <div className="letter-sheet lg:col-span-3 rounded-xl border border-[var(--border)] bg-[var(--card)]/30 overflow-hidden">
          {!selectedId ? (
            <div className="h-full flex items-center justify-center p-8 text-center text-sm text-[var(--muted-foreground)]">
              <div>
                <Eye className="h-10 w-10 mx-auto mb-3 opacity-30" />
                点击左侧任意一封信查看详情
              </div>
            </div>
          ) : detailLoading ? (
            <div className="h-full flex items-center justify-center py-20 text-[var(--muted-foreground)]">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> 展开信件中...
            </div>
          ) : detail ? (
            <div className="flex flex-col h-[75vh]">
              {/* 详情 header */}
              <div className="p-4 border-b border-[var(--border)] flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={`postmark ${POSTMARK[detail.status].cls}`}
                      aria-label={POSTMARK[detail.status].label}
                    >
                      <span className="postmark-label">{POSTMARK[detail.status].label}</span>
                      <span className="postmark-sub">{POSTMARK[detail.status].sub}</span>
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {new Date(detail.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)] line-clamp-1">
                    {detail.title}
                  </h2>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    投稿人：{detail.user.name || detail.user.email || "匿名"}
                    {detail.user.email ? ` · ${detail.user.email}` : ""}
                    {" · slug: "}
                    <code className="px-1 py-0.5 rounded bg-[var(--muted)] text-[10px]">
                      {detail.slug}
                    </code>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                  aria-label="关闭"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 详情内容 可滚动 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* 状态信息：退回批注 / 已发布 slug */}
                {detail.status === "REJECTED" && detail.rejectReason && (
                  <div className="return-note p-3 text-xs">
                    <p className="return-note-title mb-0.5">退回批注：</p>
                    <p className="text-[var(--foreground)]">{detail.rejectReason}</p>
                  </div>
                )}
                {detail.status === "APPROVED" && detail.publishedSlug && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">
                    <p className="font-medium text-emerald-400 mb-0.5">已发布：</p>
                    <a
                      href={`/post/${detail.publishedSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--foreground)] underline underline-offset-2 break-all"
                    >
                      /post/{detail.publishedSlug} ↗
                    </a>
                  </div>
                )}

                {/* 简介 */}
                <section>
                  <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-1">简介</h4>
                  <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                    {detail.description}
                  </p>
                </section>

                {/* 类型 / 标签 */}
                <section className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-[var(--muted-foreground)]">类型：</span>
                    <span className="text-[var(--foreground)] font-medium">
                      {POST_TYPE_LABELS[detail.type as keyof typeof POST_TYPE_LABELS] || detail.type}
                    </span>
                  </div>
                  {detail.tags.length > 0 && (
                    <div>
                      <span className="text-[var(--muted-foreground)]">标签：</span>
                      <span className="text-[var(--foreground)]">
                        {detail.tags.map((t) => `#${t}`).join(" ")}
                      </span>
                    </div>
                  )}
                </section>

                {/* 来源信息（投稿自带的，仅供参考）*/}
                {(detail.originalCreator || detail.sourcePlatform || detail.sourceUrl) && (
                  <section className="rounded-lg bg-[var(--muted)]/30 p-3 text-xs space-y-1">
                    <p className="text-[var(--muted-foreground)] font-medium mb-1">投稿者填写的来源（仅供参考）：</p>
                    {detail.originalCreator && (
                      <p>原作者：<span className="text-[var(--foreground)]">{detail.originalCreator}</span></p>
                    )}
                    {detail.sourcePlatform && (
                      <p>
                        来源平台：
                        <span className="text-[var(--foreground)]">
                          {PLATFORM_LABELS[detail.sourcePlatform as keyof typeof PLATFORM_LABELS] || detail.sourcePlatform}
                        </span>
                      </p>
                    )}
                    {detail.sourceUrl && (
                      <p>
                        原帖链接：
                        <a
                          href={detail.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--primary)] underline underline-offset-2 break-all"
                        >
                          {detail.sourceUrl} ↗
                        </a>
                      </p>
                    )}
                  </section>
                )}

                {/* 图片 */}
                {detail.images.length > 0 ? (
                  <section>
                    <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                      配图（{detail.images.length} 张）
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {detail.images.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block aspect-video rounded-md overflow-hidden border border-[var(--border)] bg-[var(--muted)] hover:opacity-90 transition-opacity"
                        >
                          <img src={url} alt={`配图 ${i + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </section>
                ) : null}

                {/* MDX 正文 */}
                {detail.content.trim() && (
                  <section>
                    <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-1">正文 (MDX)</h4>
                    <pre className="text-xs bg-[var(--muted)]/40 border border-[var(--border)] rounded-md p-3 overflow-x-auto whitespace-pre-wrap text-[var(--foreground)] max-h-64">
{detail.content}
                    </pre>
                  </section>
                )}

                {/* 仅 PENDING 状态显示审核操作 */}
                {detail.status === "PENDING" && (
                  <section className="border-t border-[var(--border)] pt-5 space-y-5">
                    {formError && (
                      <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400">
                        <AlertTriangle className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                        {formError}
                      </div>
                    )}
                    {formSuccess && (
                      <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                        {formSuccess}
                      </div>
                    )}

                    {/* 通过表单：补全来源信息 */}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                      <h4 className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        通过并发布
                      </h4>
                      <p className="text-xs text-[var(--muted-foreground)] -mt-1">
                        以下字段将作为正式作品的 frontmatter 写入 MDX。可根据原作者/来源平台信息修改。
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>发布日期</label>
                          <input
                            type="date"
                            value={approveOverride.publishedAt}
                            onChange={(e) => setApproveOverride({ ...approveOverride, publishedAt: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>来源平台 *</label>
                          <select
                            value={approveOverride.sourcePlatform}
                            onChange={(e) => setApproveOverride({ ...approveOverride, sourcePlatform: e.target.value })}
                            className={inputClass + " appearance-none"}
                          >
                            {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>原作者 * <span className="text-[10px] text-[var(--muted-foreground)]">(最多 60 字)</span></label>
                        <input
                          type="text"
                          maxLength={60}
                          value={approveOverride.originalCreator}
                          onChange={(e) => setApproveOverride({ ...approveOverride, originalCreator: e.target.value })}
                          className={inputClass}
                          placeholder="画师昵称 / 匿名投稿"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>原帖链接 *</label>
                        <input
                          type="url"
                          value={approveOverride.sourceUrl}
                          onChange={(e) => setApproveOverride({ ...approveOverride, sourceUrl: e.target.value })}
                          className={inputClass}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className={labelClass}>标题 <span className="text-[10px] text-[var(--muted-foreground)]">(最多 120 字)</span></label>
                        <input
                          type="text"
                          maxLength={120}
                          value={approveOverride.title}
                          onChange={(e) => setApproveOverride({ ...approveOverride, title: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>简介 <span className="text-[10px] text-[var(--muted-foreground)]">(最多 300 字)</span></label>
                        <textarea
                          maxLength={300}
                          value={approveOverride.description}
                          onChange={(e) => setApproveOverride({ ...approveOverride, description: e.target.value })}
                          rows={2}
                          className={inputClass + " min-h-[56px] resize-y"}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>标签（逗号分隔，最多 8 个）</label>
                        <input
                          type="text"
                          maxLength={200}
                          value={approveOverride.tags}
                          onChange={(e) => setApproveOverride({ ...approveOverride, tags: e.target.value })}
                          className={inputClass}
                          placeholder="fanart, 达妮娅, 插画"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={approving}
                        className="stamp-btn stamp-btn--approve"
                      >
                        {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        {approving ? "正在盖章投递..." : "盖邮戳 · 通过并投递到首页"}
                      </button>
                    </div>

                    {/* 驳回表单 */}
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
                      <h4 className="text-sm font-medium text-red-400 flex items-center gap-1.5">
                        <XCircle className="h-4 w-4" />
                        驳回
                      </h4>
                      <div>
                        <label className={labelClass}>驳回理由 *（投稿者将看到此理由）</label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={2}
                          placeholder="例如：图片质量过低 / 版权信息不明确 / 内容不适合本社区 等"
                          className={inputClass + " min-h-[56px] resize-y"}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={rejecting}
                        className="stamp-btn stamp-btn--reject"
                      >
                        {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        {rejecting ? "正在盖章退回..." : "盖邮戳 · 退回这封信"}
                      </button>
                    </div>
                  </section>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
