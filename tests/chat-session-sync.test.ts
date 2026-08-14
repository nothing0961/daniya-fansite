/**
 * 需求：聊天会话同步（localStorage ↔ DB）— 登录导入合并 / 本地副本保留 + 导入标记
 *
 * 断言：
 *   1. needsImport：无 dbId 的本地会话需要导入；有 dbId 视为已导入
 *   2. planSessionImport：本地无 dbId → toImport；DB 会话进 merged（客户端形状）
 *   3. planSessionImport：有 dbId 且 DB 已返回 → 不重复导入、不重复展示
 *   4. planSessionImport：有 dbId 但 DB 未返回（异常）→ 兜底保留
 *   5. remapImported：导入成功后本地清单 id 与 dbId 对齐 + 返回映射表
 *
 * 风格：真实 import 纯函数单元测试
 */
import { describe, it, expect } from "vitest";
import {
  needsImport,
  planSessionImport,
  remapImported,
  type LocalChatSessionShape,
  type DbChatSessionSummary,
} from "@/lib/chat-session-sync";

const localSession = (over: Partial<LocalChatSessionShape> = {}): LocalChatSessionShape => ({
  id: "session_1",
  title: "新会话",
  lastMessage: "hi",
  timestamp: new Date("2026-08-14T08:00:00Z"),
  ...over,
});

const dbSession = (over: Partial<DbChatSessionSummary> = {}): DbChatSessionSummary => ({
  id: "cmsDb1",
  title: "DB 会话",
  summary: null,
  summaryCount: 0,
  updatedAt: "2026-08-14T09:00:00Z",
  ...over,
});

describe("聊天会话同步：导入判定", () => {
  it("无 dbId → needsImport true；有 dbId → false", () => {
    expect(needsImport(localSession())).toBe(true);
    expect(needsImport(localSession({ dbId: "cmsDb1" }))).toBe(false);
  });
});

describe("聊天会话同步：planSessionImport", () => {
  it("本地无 dbId 会话 → toImport；DB 会话进 merged（客户端形状）", () => {
    const local = [localSession({ id: "session_1", timestamp: new Date("2026-08-14T08:00:00Z") })];
    const db = [dbSession()];
    const { toImport, merged } = planSessionImport(local, db);
    expect(toImport.map((s) => s.id)).toEqual(["session_1"]);
    expect(merged.map((s) => s.id)).toEqual(["cmsDb1", "session_1"]);
    const dbShaped = merged.find((s) => s.id === "cmsDb1");
    expect(dbShaped?.title).toBe("DB 会话");
    expect(dbShaped?.timestamp).toBeInstanceOf(Date);
    expect(dbShaped?.summaryCount).toBe(0);
  });

  it("有 dbId 且 DB 已返回 → 不进入 toImport、不重复展示", () => {
    const local = [localSession({ id: "session_1", dbId: "cmsDb1" })];
    const db = [dbSession()];
    const { toImport, merged } = planSessionImport(local, db);
    expect(toImport).toHaveLength(0);
    expect(merged.map((s) => s.id)).toEqual(["cmsDb1"]);
  });

  it("有 dbId 但 DB 未返回（异常兜底）→ 保留展示且 id 对齐 dbId", () => {
    const local = [localSession({ id: "session_1", dbId: "cmsGone", title: "遗留会话" })];
    const { toImport, merged } = planSessionImport(local, []);
    expect(toImport).toHaveLength(0);
    expect(merged.map((s) => s.id)).toEqual(["cmsGone"]);
    expect(merged[0].title).toBe("遗留会话");
  });

  it("按时间倒序（新在前）", () => {
    const local = [
      localSession({ id: "old", timestamp: new Date("2026-08-14T08:00:00Z") }),
      localSession({ id: "newer", timestamp: new Date("2026-08-14T10:00:00Z") }),
    ];
    const { merged } = planSessionImport(local, [dbSession({ updatedAt: "2026-08-14T09:00:00Z" })]);
    expect(merged.map((s) => s.id)).toEqual(["newer", "cmsDb1", "old"]);
  });
});

describe("聊天会话同步：remapImported", () => {
  it("导入成功后 id 与 dbId 对齐，返回映射表供迁移缓存键", () => {
    const local = [
      localSession({ id: "session_1" }),
      localSession({ id: "session_2" }),
    ];
    const { list, remappedIds } = remapImported(local, {
      session_1: "cmsA",
      session_2: "cmsB",
    });
    expect(remappedIds).toEqual({ session_1: "cmsA", session_2: "cmsB" });
    expect(list.map((s) => s.id)).toEqual(["cmsA", "cmsB"]);
    expect(list[0].dbId).toBe("cmsA");
    expect(list[1].dbId).toBe("cmsB");
  });

  it("未导入的会话保持不变", () => {
    const local = [localSession({ id: "session_1" }), localSession({ id: "session_2", dbId: "cmsB" })];
    const { list, remappedIds } = remapImported(local, { session_1: "cmsA" });
    expect(remappedIds).toEqual({ session_1: "cmsA" });
    expect(list.map((s) => s.id)).toEqual(["cmsA", "session_2"]);
  });
});
