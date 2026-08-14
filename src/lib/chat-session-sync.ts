/**
 * 聊天会话同步（localStorage ↔ DB）— 纯函数，可单测
 *
 * 数据流：游客纯 localStorage；登录后打开抽屉时把本地会话导入 DB，
 * 导入成功的本地会话写入 dbId 标记（本地副本保留，防止重复导入），
 * 此后 DB 为唯一事实来源，localStorage 仅作缓存。
 */

/** 客户端本地会话形状（localStorage 中的记录） */
export interface LocalChatSessionShape {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  summary?: string;
  summaryCount?: number;
  /** 已导入 DB 的会话携带 dbId（导入标记） */
  dbId?: string;
}

/** DB 会话的列表形态（API GET /api/chat-sessions 返回） */
export interface DbChatSessionSummary {
  id: string;
  title: string;
  summary?: string | null;
  summaryCount?: number;
  updatedAt: Date | string;
}

/** 本地会话是否已导入（有 dbId 即视为已导入） */
export function needsImport(s: LocalChatSessionShape): boolean {
  return !s.dbId;
}

function toClientShape(d: DbChatSessionSummary): LocalChatSessionShape {
  return {
    id: d.id,
    title: d.title,
    lastMessage: "",
    timestamp: new Date(d.updatedAt),
    summary: d.summary ?? undefined,
    summaryCount: d.summaryCount ?? 0,
  };
}

export interface ImportPlan {
  /** 需要新建到 DB 的本地会话（无 dbId） */
  toImport: LocalChatSessionShape[];
  /** 展示列表：DB 会话 + 本地兜底（有 dbId 但 DB 未返回 / 尚未导入成功的本地会话） */
  merged: LocalChatSessionShape[];
}

/**
 * 规划导入：
 * - DB 会话直接展示（客户端形状）
 * - 有 dbId 但 DB 未返回的本地会话 → 兜底保留（id 已与 DB 一致）
 * - 无 dbId 的本地会话 → 进入 toImport，同时保留在展示列表（导入期间仍可用）
 * 按时间倒序排序（新在前，与 localStorage 展示一致）
 */
export function planSessionImport(
  local: LocalChatSessionShape[],
  db: DbChatSessionSummary[],
): ImportPlan {
  const mergedMap = new Map<string, LocalChatSessionShape>();
  for (const d of db) mergedMap.set(d.id, toClientShape(d));
  for (const s of local) {
    if (s.dbId) {
      if (!mergedMap.has(s.dbId)) mergedMap.set(s.dbId, { ...s, id: s.dbId });
      continue;
    }
    // 无 dbId：需要导入，导入完成前仍以本地副本展示
    mergedMap.set(s.id, s);
  }
  const merged = [...mergedMap.values()].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );
  return { toImport: local.filter((s) => needsImport(s)), merged };
}

/**
 * 导入成功后更新本地清单：localId → dbId（id 与 dbId 对齐，后续 API 直接用 id）
 * 返回 { list, remappedIds } — remappedIds 供调用方迁移消息缓存键与 lastSession
 */
export function remapImported(
  local: LocalChatSessionShape[],
  idMap: Record<string, string>,
): { list: LocalChatSessionShape[]; remappedIds: Record<string, string> } {
  const remappedIds: Record<string, string> = {};
  const list = local.map((s) => {
    const dbId = idMap[s.id];
    if (!dbId) return s;
    remappedIds[s.id] = dbId;
    return { ...s, id: dbId, dbId };
  });
  return { list, remappedIds };
}
