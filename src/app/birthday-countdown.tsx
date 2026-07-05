"use client";

/**
 * 首页 Hero 右侧生日倒计时胶囊内容组件
 * 规则：
 *  · 生日固定为每年 5 月 21 日（按每年循环 rollover）
 *  · 每秒刷新（setInterval 1000ms）
 *  · 今天是生日 → 庆祝态：🎉 大号「今天是达妮娅生日！生日快乐 🎂」
 *  · 不是生日 → A 方案：顶部标识 + 大号天数 + 时分秒副行 + 俏皮文案
 */
import { useEffect, useMemo, useState } from "react";

/** 生日常量：每年 5 月 21 日循环（月份 JS Date 从 0 开始，所以 5 月 = 4） */
const BIRTHDAY_MONTH_IDX = 4; // 5 月
const BIRTHDAY_DAY = 21;

/** 俏皮文案池（距离天数变化时随机选一句，或者按区间匹配） */
function pickTagline(daysLeft: number): string {
  if (daysLeft === 0) return "🎉 就在今天啦！";
  if (daysLeft <= 7) return "🍰 快准备甜点呀！倒计时一周内～";
  if (daysLeft <= 30) return "🫧 学院里偷偷准备惊喜哟～";
  if (daysLeft <= 90) return "💫 还差一个季度左右，先屯好蛋糕券～";
  if (daysLeft <= 180) return "🌸 半年之内，瞌睡王的生日越来越近啦";
  return "⭐ 虽然还有点早，但先把 5/21 记在日程本上吧";
}

/** 计算下一个生日目标时间戳（今天过了就 rollover 到明年 5/21） */
function calcNextBirthdayTarget(now: Date): Date {
  const year = now.getFullYear();
  const target = new Date(year, BIRTHDAY_MONTH_IDX, BIRTHDAY_DAY, 0, 0, 0, 0);
  // 如果今年的生日还没过（或者今天就是生日）→ 用今年的；否则 year+1
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  if (target.getTime() < todayStart.getTime()) {
    target.setFullYear(year + 1);
  }
  return target;
}

/** 天 / 时 / 分 / 秒 拆分 */
interface TimeParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isBirthdayToday: boolean;
  targetYear: number;
}

function diffToParts(now: Date): TimeParts {
  const target = calcNextBirthdayTarget(now);
  // 判断今天是不是生日：月和日都相等 → 庆祝态
  const isBirthdayToday =
    now.getMonth() === BIRTHDAY_MONTH_IDX && now.getDate() === BIRTHDAY_DAY;
  let diff = target.getTime() - now.getTime();
  if (diff < 0) diff = 0; // 防御

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isBirthdayToday,
    targetYear: target.getFullYear(),
  };
}

/** 数字前导零（HH:MM:SS 展示用） */
function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function BirthdayCountdown() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const parts = useMemo(() => (now ? diffToParts(now) : null), [now]);
  const tagline = parts ? pickTagline(parts.isBirthdayToday ? 0 : parts.days) : "";

  // SSR / hydration 阶段：展示占位骨架，与客户端首次渲染完全一致，避免水合不匹配
  if (!parts) {
    return (
      <div className="flex flex-col items-center text-center gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] tracking-widest font-medium text-[var(--primary)]">
          <span>🌸</span>
          <span>达妮娅 · 生日倒计时</span>
        </div>
        <div className="flex items-baseline justify-center gap-2 flex-wrap">
          <span
            className="text-5xl sm:text-6xl font-black leading-none"
            style={{
              color: "var(--daniya-accent)",
              textShadow: "0 2px 10px color-mix(in oklab, var(--daniya-accent) 35%, transparent)",
            }}
          >
            --
          </span>
          <span className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">天</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[var(--foreground)] mt-1">
          <span className="font-mono text-sm sm:text-base rounded bg-[var(--muted)]/40 border border-[var(--border)] px-2 py-0.5 tabular-nums">--</span>
          <span className="text-[var(--muted-foreground)] text-xs">时</span>
          <span className="font-mono text-sm sm:text-base rounded bg-[var(--muted)]/40 border border-[var(--border)] px-2 py-0.5 tabular-nums">--</span>
          <span className="text-[var(--muted-foreground)] text-xs">分</span>
          <span className="font-mono text-sm sm:text-base rounded bg-[var(--muted)]/40 border border-[var(--border)] px-2 py-0.5 tabular-nums">--</span>
          <span className="text-[var(--muted-foreground)] text-xs">秒</span>
        </div>
        <p className="text-[11px] sm:text-xs text-[var(--muted-foreground)] dark:text-white mt-1.5">&nbsp;</p>
      </div>
    );
  }

  const { days, hours, minutes, seconds, isBirthdayToday, targetYear } = parts;

  // ===== 今天是生日：庆祝态 =====
  if (isBirthdayToday) {
    return (
      <div className="flex flex-col items-center text-center gap-2 min-w-0">
        {/* 顶部小号标识 */}
        <div className="flex items-center gap-1.5 text-[11px] tracking-widest font-medium text-[var(--primary)]">
          <span>🌸</span>
          <span>达妮娅 · 生日庆典 · 5/21</span>
          <span>🎂</span>
        </div>
        {/* 主标题大号 */}
        <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] leading-tight">
          🎉 今天是达妮娅生日！生日快乐 🎂
        </h2>
        {/* 副文案 */}
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">
          别忘了多准备一点蛋糕与甜点🍰 让瞌睡王今天睡饱饱再开派对～
        </p>
      </div>
    );
  }

  // ===== 不是生日：倒计时态（A 方案） =====
  return (
    <div className="flex flex-col items-center text-center gap-1.5 min-w-0">
      {/* 顶部小号标识 */}
      <div className="flex items-center gap-1.5 text-[11px] tracking-widest font-medium text-[var(--primary)]">
        <span>🌸</span>
        <span>达妮娅 · 生日倒计时</span>
        <span className="text-[var(--muted-foreground)] font-normal">
          {targetYear}/5/21
        </span>
      </div>

      {/* 大号天数 */}
      <div className="flex items-baseline justify-center gap-2 flex-wrap">
        <span
          className="text-5xl sm:text-6xl font-black leading-none"
          style={{
            color: "var(--daniya-accent)",
            textShadow: "0 2px 10px color-mix(in oklab, var(--daniya-accent) 35%, transparent)",
          }}
        >
          {days}
        </span>
        <span className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
          天
        </span>
      </div>

      {/* 时分秒副行（每格独立小方块，看起来像计时器） */}
      <div className="flex items-center justify-center gap-1.5 text-[var(--foreground)] mt-1">
        <span className="font-mono text-sm sm:text-base rounded bg-[var(--muted)]/40 border border-[var(--border)] px-2 py-0.5 tabular-nums">
          {pad(hours)}
        </span>
        <span className="text-[var(--muted-foreground)] text-xs">时</span>
        <span className="font-mono text-sm sm:text-base rounded bg-[var(--muted)]/40 border border-[var(--border)] px-2 py-0.5 tabular-nums">
          {pad(minutes)}
        </span>
        <span className="text-[var(--muted-foreground)] text-xs">分</span>
        <span className="font-mono text-sm sm:text-base rounded bg-[var(--muted)]/40 border border-[var(--border)] px-2 py-0.5 tabular-nums">
          {pad(seconds)}
        </span>
        <span className="text-[var(--muted-foreground)] text-xs">秒</span>
      </div>

      {/* 俏皮文案 */}
      <p className="text-[11px] sm:text-xs text-[var(--muted-foreground)] dark:text-white mt-1.5">
        {tagline}
      </p>
    </div>
  );
}
