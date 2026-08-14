/**
 * 聊天工具层 — 站内事务（聊天机器人定位：不联网、不执行站外操作、单轮调用）
 *
 * 工具分三类：
 * - 站内只读：站点统计 / 作品检索 / 作品详情 / 角色档案
 * - 个人数据（仅自己）：我的收藏 / 投稿状态 / 每日配额
 * - 写入（仅自己数据）：收藏切换 / 点赞切换
 * - 导航：navigateTo 执行后由 route.ts 向客户端发 SSE tool_action 事件跳转页面
 *
 * 调用约定：
 * - route.ts 首轮请求携带 CHAT_TOOLS_SCHEMAS；模型返回 tool_calls 时执行，
 *   携带结果回传一轮（无 tools 参数 = 单轮限制，模型无法再次调用工具）
 * - 工具结果统一为文本（上限 CHAT_TOOL_RESULT_MAX_LEN），模型据此自然回应
 */
import { prisma } from "@/lib/prisma";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import {
  STORY_TABS,
  PROFILE_ROWS,
  RESONANCE_REPORT,
} from "@/app/character/archive-data";

/** 单次工具结果文本上限（防超 token 预算） */
export const CHAT_TOOL_RESULT_MAX_LEN = 1200;

export interface ChatToolCtx {
  userId: string;
  username: string;
  quotaLimit: number;
}

export interface ChatToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolResult {
  ok: boolean;
  content: string;
  /** 仅 navigateTo：目标页面 key，route.ts 据此发 SSE tool_action */
  navPage?: string;
}

const NAV_PAGES: Record<string, string> = {
  home: "首页",
  works: "作品集",
  character: "角色档案",
  search: "搜索",
  submit: "投稿",
  favorites: "我的收藏",
  submissions: "我的投稿",
};

const PLACEHOLDER_RE = /⏳|待补充/;

// ========================================================================
// 工具定义（OpenAI 风格 function schema，随请求发给模型）
// ========================================================================

export const CHAT_TOOLS: ChatToolDef[] = [
  {
    name: "getSiteStats",
    description:
      "获取站点整体统计：作品总数、类型分布（插画/截图/视频）、标签数量。用户问'站里有多少作品/这个站有什么'时使用。",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "searchWorks",
    description:
      "在站内作品集中检索作品（按标题/简介/标签/类型匹配）。用户想找某类作品、某张图、某个标签的内容时使用。",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "检索关键词，如标题、画师、主题" },
        type: {
          type: "string",
          enum: ["illustration", "screenshot"],
          description: "作品类型过滤（可选）",
        },
        tag: { type: "string", description: "标签过滤（可选）" },
      },
    },
  },
  {
    name: "getWorkDetail",
    description:
      "获取单篇作品的详细信息（标题、类型、标签、发布时间、来源链接）。用户对某篇作品感兴趣时使用。",
    parameters: {
      type: "object",
      properties: {
        slug: { type: "string", description: "作品 slug（如 sample-illustration）" },
      },
      required: ["slug"],
    },
  },
  {
    name: "getCharacterProfile",
    description:
      "获取达妮娅的角色档案摘要：称号、武器、属性、所属、共鸣能力、故事章节列表。用户问'达妮娅是什么样的人/她的设定'时使用。",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "getMyFavorites",
    description:
      "获取当前用户的收藏作品列表（仅自己的数据）。用户问'我收藏了什么'时使用。",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "getMySubmissions",
    description:
      "获取当前用户的投稿及审核状态（仅自己的数据）。用户问'我投了什么/审核到哪了'时使用。",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "getMyQuota",
    description:
      "获取当前用户的今日聊天配额使用情况。用户问'今天还能聊多久/额度'时使用。",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "toggleFavorite",
    description:
      "收藏或取消收藏一篇作品（仅操作自己的收藏，切换状态）。用户说'收藏这篇/取消收藏'时使用。",
    parameters: {
      type: "object",
      properties: {
        postSlug: { type: "string", description: "作品 slug" },
      },
      required: ["postSlug"],
    },
  },
  {
    name: "likeWork",
    description:
      "点赞或取消点赞一篇作品（仅操作自己的点赞，切换状态）。用户说'给这篇点赞'时使用。",
    parameters: {
      type: "object",
      properties: {
        postSlug: { type: "string", description: "作品 slug" },
      },
      required: ["postSlug"],
    },
  },
  {
    name: "navigateTo",
    description:
      "用户明确要求打开站内某个页面（如'打开作品集''带我去投稿页'）时使用。执行后由系统完成跳转。",
    parameters: {
      type: "object",
      properties: {
        page: {
          type: "string",
          enum: Object.keys(NAV_PAGES),
          description: "目标页面：home/works/character/search/submit/favorites/submissions",
        },
      },
      required: ["page"],
    },
  },
];

/** 随请求发送的 OpenAI 风格 tools 参数 */
export const CHAT_TOOLS_SCHEMAS = CHAT_TOOLS.map((t) => ({
  type: "function",
  function: {
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  },
}));

// ========================================================================
// 工具实现
// ========================================================================

function ok(content: string): ToolResult {
  return { ok: true, content };
}

function getSiteStatsText(): string {
  const posts = getAllPosts();
  const byType = new Map<string, number>();
  const tags = new Set<string>();
  for (const p of posts) {
    byType.set(p.type, (byType.get(p.type) ?? 0) + 1);
    for (const t of p.tags ?? []) tags.add(t);
  }
  const typeText =
    byType.size === 0
      ? "暂无分类数据"
      : [...byType.entries()].map(([k, n]) => `${k} ${n} 篇`).join("，");
  return `站内作品共 ${posts.length} 篇。类型分布：${typeText}。标签共 ${tags.size} 个。`;
}

function searchWorksText(args: Record<string, unknown>): string {
  const q = String(args.query ?? "").trim().toLowerCase();
  const type = typeof args.type === "string" ? args.type : undefined;
  const tag = typeof args.tag === "string" ? args.tag : undefined;

  let posts = getAllPosts();
  if (q) {
    posts = posts.filter((p) =>
      [p.title, p.description ?? "", (p.tags ?? []).join(" "), p.type]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  if (type) posts = posts.filter((p) => p.type === type);
  if (tag) posts = posts.filter((p) => p.tags?.includes(tag));

  if (posts.length === 0) return "没有找到匹配的作品。";
  const list = posts.slice(0, 8).map(
    (p) =>
      `《${p.title}》 [${p.type}] 标签：${(p.tags ?? []).join("、") || "无"} — slug: ${p.slug}`,
  );
  const more = posts.length > 8 ? `\n（共 ${posts.length} 篇，仅列出前 8 篇）` : "";
  return `找到 ${posts.length} 篇作品：\n${list.join("\n")}${more}`;
}

function getWorkDetailText(args: Record<string, unknown>): ToolResult {
  const slug = String(args.slug ?? "").trim();
  if (!slug) return { ok: false, content: "缺少作品 slug。" };
  const post = getPostBySlug(slug);
  if (!post) return { ok: false, content: `没有找到 slug 为「${slug}」的作品。` };
  return ok(
    [
      `《${post.title}》`,
      `类型：${post.type}`,
      `标签：${(post.tags ?? []).join("、") || "无"}`,
      `发布时间：${post.publishedAt}`,
      `简介：${post.description ?? "无"}`,
      `来源：${post.sourceUrl || "无"}`,
    ].join("\n"),
  );
}

function getCharacterProfileText(): string {
  const profile = PROFILE_ROWS.filter((r) => !PLACEHOLDER_RE.test(r.value))
    .map((r) => `${r.label}：${r.value}`)
    .join("，");
  const chapters = STORY_TABS.map((t) => t.label).join("、");
  return [
    `【角色档案】${profile}`,
    `共鸣能力：${RESONANCE_REPORT.ability}`,
    `故事章节：${chapters}（涉及礼物、荒芜、明昼、群魔、谎言五段剧情）`,
    `如需某章节的详细内容，请明确询问。`,
  ].join("\n");
}

async function getMyFavoritesText(userId: string): Promise<string> {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  if (bookmarks.length === 0) return "你还没有收藏任何作品。";
  const lines: string[] = [];
  for (const b of bookmarks) {
    const post = getPostBySlug(b.postSlug);
    lines.push(`《${post?.title ?? b.postSlug}》 — slug: ${b.postSlug}`);
  }
  return `你的收藏（最近 ${lines.length} 条）：\n${lines.join("\n")}`;
}

async function getMySubmissionsText(userId: string): Promise<string> {
  const rows = await prisma.pendingPost.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  if (rows.length === 0) return "你还没有投稿记录。";
  const statusLabel: Record<string, string> = {
    PENDING: "审核中",
    APPROVED: "已通过",
    REJECTED: "已驳回",
  };
  const list = rows.map(
    (r) => `《${r.title}》 — ${statusLabel[r.status] ?? r.status}（${r.slug}）`,
  );
  return `你的投稿（最近 ${rows.length} 条）：\n${list.join("\n")}`;
}

// 与 route.ts detectQuotaExceeded 同款东八区日期，避免循环依赖
function cn8Date(): string {
  const now = new Date();
  const cn8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${cn8.getUTCFullYear()}${pad(cn8.getUTCMonth() + 1)}${pad(cn8.getUTCDate())}`;
}

async function getMyQuotaText(userId: string, quotaLimit: number): Promise<string> {
  const today = cn8Date();
  const row = await prisma.chatQuota.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  const used = row?.count ?? 0;
  const remain = Math.max(0, quotaLimit - used);
  return `今日已聊 ${used} 轮，剩余 ${remain} 轮（每日上限 ${quotaLimit} 轮）。`;
}

async function toggleFavoriteText(
  userId: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const postSlug = String(args.postSlug ?? "").trim();
  if (!postSlug) return { ok: false, content: "缺少作品 slug。" };
  const post = getPostBySlug(postSlug);
  if (!post) return { ok: false, content: `没有找到 slug 为「${postSlug}」的作品。` };
  try {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_postSlug: { userId, postSlug } },
    });
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return ok(`已取消收藏《${post.title}》。`);
    }
    await prisma.bookmark.create({ data: { userId, postSlug } });
    return ok(`已收藏《${post.title}》。`);
  } catch (err) {
    return { ok: false, content: `收藏操作失败：${String((err as Error)?.message ?? err).slice(0, 120)}` };
  }
}

async function likeWorkText(
  userId: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const postSlug = String(args.postSlug ?? "").trim();
  if (!postSlug) return { ok: false, content: "缺少作品 slug。" };
  const post = getPostBySlug(postSlug);
  if (!post) return { ok: false, content: `没有找到 slug 为「${postSlug}」的作品。` };
  try {
    const existing = await prisma.postLike.findUnique({
      where: { userId_postSlug: { userId, postSlug } },
    });
    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
      const count = await prisma.postLike.count({ where: { postSlug } });
      return ok(`已取消点赞《${post.title}》，当前共 ${count} 人点赞。`);
    }
    await prisma.postLike.create({ data: { userId, postSlug } });
    const count = await prisma.postLike.count({ where: { postSlug } });
    return ok(`已点赞《${post.title}》，当前共 ${count} 人点赞。`);
  } catch (err) {
    return { ok: false, content: `点赞操作失败：${String((err as Error)?.message ?? err).slice(0, 120)}` };
  }
}

function navigateToResult(args: Record<string, unknown>): ToolResult {
  const page = String(args.page ?? "").trim();
  const label = NAV_PAGES[page];
  if (!label) return { ok: false, content: `未知页面：${page}` };
  return { ok: true, navPage: page, content: `已为你打开「${label}」页面。` };
}

// ========================================================================
// 分发
// ========================================================================

export async function executeChatTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ChatToolCtx,
): Promise<ToolResult> {
  switch (name) {
    case "getSiteStats":
      return ok(getSiteStatsText());
    case "searchWorks":
      return ok(searchWorksText(args));
    case "getWorkDetail":
      return getWorkDetailText(args);
    case "getCharacterProfile":
      return ok(getCharacterProfileText());
    case "getMyFavorites":
      return ok(await getMyFavoritesText(ctx.userId));
    case "getMySubmissions":
      return ok(await getMySubmissionsText(ctx.userId));
    case "getMyQuota":
      return ok(await getMyQuotaText(ctx.userId, ctx.quotaLimit));
    case "toggleFavorite":
      return toggleFavoriteText(ctx.userId, args);
    case "likeWork":
      return likeWorkText(ctx.userId, args);
    case "navigateTo":
      return navigateToResult(args);
    default:
      return { ok: false, content: `未知工具：${name}` };
  }
}
