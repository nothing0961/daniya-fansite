/**
 * 用户上传图片日限流
 * - ImgURL 免费版额度紧张（10张/天全站
 * - 所有普通用户上传共用同一个站长 UID+TOKEN，所以必须限流
 *
 * 策略（进程内内存实现（重启后清零，Netlify serverless 每个实例一个内存不同）
 * - 免费额度=独立实例间不共享，可能会每个实例都用一份，所以真实额度可能略超。如果以后流量大再换 Redis/KV 持久化）
 */

export const USER_DAILY_LIMIT = 3;
export const SITE_DAILY_LIMIT = 8;

/** 今天（全局只看 UTC，进程内 Map<dateKey_userId, count> */
const userCounts = new Map<string, number>();
/** 全站 Map<dateKey, 今日上传总数> */
const siteCounts = new Map<string, number>();

/** 获取今日 key，UTC 时区统跨时区一致，东八区都在同一天 */
function todayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function userKey(userId: string): string {
  return `${todayKey()}_${userId}`;
}

/**
 * 判断用户今天还能不能传（即单用户 + 全站都没超限额
 */
export function canUploadToday(userId: string): boolean {
  const userCount = userCounts.get(userKey(userId)) ?? 0;
  if (userCount >= USER_DAILY_LIMIT) return false;
  const siteCount = siteCounts.get(todayKey()) ?? 0;
  if (siteCount >= SITE_DAILY_LIMIT) return false;
  return true;
}

/**
 * 记录一次上传（只累加计数+1，不做拦截判断，外层已在 API 层 canUploadToday 为 true 后再调
 */
export function recordUpload(userId: string): void {
  const uk = userKey(userId);
  userCounts.set(uk, (userCounts.get(uk) ?? 0) + 1);
  const dk = todayKey();
  siteCounts.set(dk, (siteCounts.get(dk) ?? 0) + 1);
}

export function getUserTodayUploadCount(userId: string): number {
  return userCounts.get(userKey(userId)) ?? 0;
}

export function getSiteTodayUploadCount(): number {
  return siteCounts.get(todayKey()) ?? 0;
}

/** 测试用：清今天 key 导不导出，测试无法清内存状态污染。测试用。不导出，reset 测试里调用，避免互相干扰 */
export function _resetForTests(): void {
  userCounts.clear();
  siteCounts.clear();
}
