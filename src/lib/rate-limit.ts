/**
 * 内存限流工具 — 用于短信发送频率控制
 * 注意：Netlify serverless 冷启动时状态会重置，对低流量站够用
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** 时间窗口（毫秒） */
  windowMs: number;
  /** 窗口内最大请求数 */
  max: number;
}

const store = new Map<string, RateLimitEntry>();

/** 清理过期条目 */
function prune() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/** 检查某 key 是否超过限制，返回是否允许及剩余信息 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  prune();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, resetAt: now + config.windowMs };
  }

  entry.count++;
  if (entry.count > config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: config.max - entry.count, resetAt: entry.resetAt };
}

/** SMS 专用限流配置 */
export const SMS_RATE_LIMITS = {
  perIp: { windowMs: 60_000, max: 3 } as const,          // 每 IP 3次/分钟
  perPhoneShort: { windowMs: 60_000, max: 1 } as const,   // 每手机 1次/分钟
  perPhoneHour: { windowMs: 3_600_000, max: 5 } as const, // 每手机 5次/小时
  perPhoneDay: { windowMs: 86_400_000, max: 10 } as const, // 每手机 10次/天
};
