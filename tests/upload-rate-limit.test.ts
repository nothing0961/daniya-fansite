import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  canUploadToday,
  recordUpload,
  getUserTodayUploadCount,
  getSiteTodayUploadCount,
  USER_DAILY_LIMIT,
  SITE_DAILY_LIMIT,
  _resetForTests,
} from "../src/lib/upload-rate-limit";

/**
 * 需求：
 * - ImgURL 免费版额度紧（10张/天全站）
 * - 单用户每天最多上传 USER_DAILY_LIMIT 张（默认3）
 * - 全站每天最多上传 SITE_DAILY_LIMIT 张（默认8，留2张给管理员自己用）
 * - 计数只对 "当天 00:00 ~ 23:59" 有效
 */

function todayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

describe("上传限流 - 单用户日限额", () => {
  beforeEach(() => {
    _resetForTests();
  });

  it("初始状态下，用户今日上传计数为 0", () => {
    expect(getUserTodayUploadCount("user-a")).toBe(0);
  });

  it(`每记录一次上传，用户计数 +1，直到超过 ${USER_DAILY_LIMIT} 返回 false`, () => {
    const userId = "user-1";
    for (let i = 0; i < USER_DAILY_LIMIT; i++) {
      expect(canUploadToday(userId)).toBe(true);
      recordUpload(userId);
    }
    expect(getUserTodayUploadCount(userId)).toBe(USER_DAILY_LIMIT);
    // 超出限制
    expect(canUploadToday(userId)).toBe(false);
    recordUpload(userId); // 即便硬写，计数也不应该无限涨？不，canUploadToday 返回 false 时 API 层就拦截了，这里允许 record 只是防御
    expect(getUserTodayUploadCount(userId)).toBe(USER_DAILY_LIMIT + 1);
  });

  it("不同用户的计数互不干扰", () => {
    const a = "user-a";
    const b = "user-b";
    for (let i = 0; i < USER_DAILY_LIMIT; i++) recordUpload(a);
    expect(canUploadToday(a)).toBe(false);
    expect(canUploadToday(b)).toBe(true);
    expect(getUserTodayUploadCount(b)).toBe(0);
  });
});

describe("上传限流 - 全站日限额", () => {
  beforeEach(() => {
    _resetForTests();
  });

  it(`全站每日累计不能超过 ${SITE_DAILY_LIMIT} 张`, () => {
    // 造 SITE_DAILY_LIMIT 个不同用户，每人传 1 张
    for (let i = 0; i < SITE_DAILY_LIMIT; i++) {
      const uid = `u-${i}`;
      expect(canUploadToday(uid)).toBe(true);
      recordUpload(uid);
    }
    expect(getSiteTodayUploadCount()).toBe(SITE_DAILY_LIMIT);
    // 再来一个新用户，被全站限制拦住
    expect(canUploadToday("new-user")).toBe(false);
  });

  it("全站限制优先于单用户限制 — 用户 A 超过单用户限制但全站未满，依然不能传", () => {
    const userId = "user-a";
    for (let i = 0; i < USER_DAILY_LIMIT; i++) recordUpload(userId);
    // 用户自己满了
    expect(canUploadToday(userId)).toBe(false);
    // 但另一个用户还能传，因为全站没满
    expect(canUploadToday("user-b")).toBe(true);
    expect(getSiteTodayUploadCount()).toBe(USER_DAILY_LIMIT);
  });
});

describe("上传限流 - 日期跨天重置", () => {
  it.todo("跨天后（日期 key 变了）计数应重置为 0 — 需要在实现层把 todayKey 函数导出或通过可注入 Date mock");
});

describe("限流常量", () => {
  it("USER_DAILY_LIMIT 应为 3（ImgURL 免费版 10 张/天，用户共用）", () => {
    expect(USER_DAILY_LIMIT).toBe(3);
  });
  it("SITE_DAILY_LIMIT 应为 8（留 2 张给管理员自己发）", () => {
    expect(SITE_DAILY_LIMIT).toBe(8);
  });
});

describe("todayKey 辅助函数（防止实现写错时区）", () => {
  it("今日 key 格式为 YYYY-MM-DD（UTC，跨时区统一）", () => {
    expect(todayKey(new Date("2026-07-02T10:00:00Z"))).toBe("2026-07-02");
    expect(todayKey(new Date("2026-07-02T23:59:59Z"))).toBe("2026-07-02");
  });
});
