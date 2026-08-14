"use client";

/**
 * 首页 Hero 右侧生日倒计时 — 「寄往 5/21 的贺卡」
 * 规则：
 *  · 生日固定为每年 5 月 21 日（按每年循环 rollover）
 *  · 每秒刷新（setInterval 1000ms）
 *  · 今天是生日 → 庆祝态：贺卡 + 邮戳「5·21 庆典」+ 大号祝福
 *  · 不是生日 → 贺卡：收件行「✉ To：5月21日 · 达妮娅」+ 大号天数 + 右上角香槟金邮戳 + 时分秒 + 俏皮文案
 */
import { useEffect, useMemo, useState } from "react";

/** 生日常量：每年 5 月 21 日循环（月份 JS Date 从 0 开始，所以 5 月 = 4） */
const BIRTHDAY_MONTH_IDX = 4; // 5 月
const BIRTHDAY_DAY = 21;

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

  // SSR / hydration 阶段：展示占位骨架，与客户端首次渲染完全一致，避免水合不匹配
  if (!parts) {
    return (
      <div className="hp-birthday-card text-center">
        {/* 收件行 */}
        <div className="hp-birthday-to">
          <span aria-hidden="true">✉</span>
          <span>To：5月21日 · 达妮娅</span>
        </div>
        {/* 右上角邮戳 */}
        <span className="hp-postmark" aria-hidden="true">
          <span className="hp-postmark-label">5·21 生日</span>
          <span className="hp-postmark-sub">倒计时</span>
        </span>
        {/* 大号天数 */}
        <div className="flex items-baseline justify-center gap-2 flex-wrap hp-birthday-days">
          <span
            className="text-5xl sm:text-6xl font-black leading-none tabular-nums"
            style={{
              color: "var(--daniya-accent)",
              textShadow: "0 2px 10px color-mix(in oklab, var(--daniya-accent) 35%, transparent)",
            }}
          >
            --
          </span>
          <span className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">天</span>
        </div>
        {/* 时分秒副行 */}
        <div className="flex items-center justify-center gap-1.5 text-[var(--foreground)] mt-1">
          <span className="font-mono text-sm sm:text-base rounded bg-[var(--muted)]/40 border border-[var(--border)] px-2 py-0.5 tabular-nums">--</span>
          <span className="text-[var(--muted-foreground)] text-xs">时</span>
          <span className="font-mono text-sm sm:text-base rounded bg-[var(--muted)]/40 border border-[var(--border)] px-2 py-0.5 tabular-nums">--</span>
          <span className="text-[var(--muted-foreground)] text-xs">分</span>
          <span className="font-mono text-sm sm:text-base rounded bg-[var(--muted)]/40 border border-[var(--border)] px-2 py-0.5 tabular-nums">--</span>
          <span className="text-[var(--muted-foreground)] text-xs">秒</span>
        </div>
      </div>
    );
  }

  const { days, hours, minutes, seconds, isBirthdayToday } = parts;

  // ===== 今天是生日：庆祝态 =====
  if (isBirthdayToday) {
    return (
      <div className="hp-birthday-card text-center">
        {/* 收件行 */}
        <div className="hp-birthday-to">
          <span aria-hidden="true">✉</span>
          <span>To：达妮娅 · 5/21</span>
        </div>
        {/* 右上角邮戳 — 庆典版 */}
        <span className="hp-postmark" title="5·21 庆典">
          <span className="hp-postmark-label">5·21 庆典</span>
          <span className="hp-postmark-sub">生日快乐</span>
        </span>
        {/* 主标题大号 */}
        <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] leading-tight mt-2 hp-birthday-days">
          🎉 今天是达妮娅生日！生日快乐 🎂
        </h2>
        {/* 副文案 */}
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">
          别忘了多准备一点蛋糕与甜点🍰 让瞌睡王今天睡饱饱再开派对～
        </p>
      </div>
    );
  }

  // ===== 不是生日：倒计时态（贺卡） =====
  return (
    <div className="hp-birthday-card text-center">
      {/* 收件行 */}
      <div className="hp-birthday-to">
        <span aria-hidden="true">✉</span>
        <span>To：5月21日 · 达妮娅</span>
      </div>
      {/* 右上角邮戳 — 盖在信封邮票位 */}
      <span className="hp-postmark" title="5·21 生日倒计时">
        <span className="hp-postmark-label">5·21 生日</span>
        <span className="hp-postmark-sub">倒计时</span>
      </span>

      {/* 大号天数 */}
      <div className="flex items-baseline justify-center gap-2 flex-wrap hp-birthday-days">
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
    </div>
  );
}
