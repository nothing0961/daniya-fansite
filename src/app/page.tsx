/**
 * 首页 — 三栏暗色角色主题
 *
 * 左：俄罗斯方块游戏机（保留所有原代码）
 * 中：达妮娅主舞台（大标题 + 能力标签 + 文案 + CTA + 统计条）
 * 右：回声面板（生日倒计时 + 共鸣图鉴 + 站长笔记）
 */
import Link from "next/link";
import type { Metadata } from "next";
import { TetrisConsoleHost } from "@/components/game/tetris-console-host";
import { BirthdayCountdown } from "./birthday-countdown";
import {
  HERO_DATA,
  ABILITY_TAGS,
  RESONANCE_TAGS,
  SIDE_NOTES,
  STAT_ITEMS,
} from "@/lib/home-mock-data";
import "./home.css";

export const metadata: Metadata = {
  title: "达妮娅的瞌睡小屋",
  description:
    "共鸣者档案 · 星炬学院在籍 — 关于达妮娅的角色考据、作品与笔记合集",
};

export default async function HomePage() {
  return (
    <div className="hp-root">
      {/* ===== 背景装饰层 ===== */}
      {/* 背景图层已移至 layout.tsx（全站生效，由 BgSwitcher 控制） */}
      <div className="hp-bg" />
      <div className="hp-bg-noise" />

      {/* ===== 三栏主舞台 ===== */}
      <section className="hp-stage">
        {/* === 左栏：俄罗斯方块 === */}
        <aside className="hp-col hp-col--left">
          <div className="hp-tetris-wrap">
            <TetrisConsoleHost />
          </div>
        </aside>

        {/* === 中栏：主舞台 === */}
        <div className="hp-col hp-col--center">
          {/* 主卡片 */}
          <div className="hp-card hp-hero">
            <div className="hp-hero-bg">
              <div className="hp-hero-img" />
            </div>

            <div className="hp-hero-content">
              <div className="hp-hero-kicker">
                <span className="hp-kicker-label">共鸣者档案</span>
                <span className="hp-kicker-sep">·</span>
                <span className="hp-kicker-value">星炬学院在籍</span>
              </div>

              <h1 className="hp-hero-title">
                <span className="hp-title-zh">{HERO_DATA.titleZh}</span>
                <span className="hp-title-en">{HERO_DATA.titleEn}</span>
              </h1>

              <p className="hp-hero-sub">{HERO_DATA.subtitle}</p>

              {/* 能力标签云 */}
              <div className="hp-ability-cloud">
                {ABILITY_TAGS.map((tag) => (
                  <span
                    key={tag.label}
                    className={`hp-ability-tag hp-ability-tag--${tag.tone}`}
                  >
                    <span className="hp-ability-emoji">{tag.emoji}</span>
                    {tag.label}
                  </span>
                ))}
              </div>

              <div className="hp-hero-text">
                <p>{HERO_DATA.description}</p>
                <blockquote className="hp-quote">{HERO_DATA.quote}</blockquote>
              </div>

              <div className="hp-cta-row">
                <Link href={HERO_DATA.ctaPrimary.href} className="hp-btn hp-btn--primary">
                  {HERO_DATA.ctaPrimary.label}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href={HERO_DATA.ctaSecondary.href} className="hp-btn hp-btn--ghost">
                  {HERO_DATA.ctaSecondary.label}
                </Link>
              </div>
            </div>
          </div>

          {/* 统计条 */}
          <div className="hp-stat-bar">
            {STAT_ITEMS.map((item) => (
              <div key={item.label} className="hp-stat-item">
                <span className="hp-stat-value">{item.value}</span>
                <span className="hp-stat-label">{item.label}</span>
                <span className="hp-stat-sub">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* === 右栏：回声面板 === */}
        <aside className="hp-col hp-col--right">
          {/* 生日倒计时 */}
          <div className="hp-card hp-sidebar-card hp-sidebar-birthday">
            <div className="hp-sidebar-head">
              <span className="hp-sidebar-icon">🌸</span>
              <h3 className="hp-sidebar-title">生日倒计时</h3>
            </div>
            <div className="hp-birthday">
              <BirthdayCountdown />
            </div>
          </div>

          {/* 共鸣图鉴 */}
          <div className="hp-card hp-sidebar-card">
            <div className="hp-sidebar-head">
              <span className="hp-sidebar-icon">🎵</span>
              <h3 className="hp-sidebar-title">共鸣图鉴</h3>
            </div>
            <div className="hp-resonance-grid">
              {RESONANCE_TAGS.map((tag) => (
                <div key={tag.label} className="hp-resonance-item">
                  <span className="hp-resonance-label">{tag.label}</span>
                  <span className="hp-resonance-value">{tag.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 站长笔记 */}
          <div className="hp-card hp-sidebar-card">
            <div className="hp-sidebar-head">
              <span className="hp-sidebar-icon">📖</span>
              <h3 className="hp-sidebar-title">站长笔记</h3>
            </div>
            <div className="hp-note-list">
              {SIDE_NOTES.map((note) => (
                <div key={note.id} className="hp-note">
                  <h4 className="hp-note-title">{note.title}</h4>
                  <p className="hp-note-excerpt">{note.excerpt}</p>
                  <span className="hp-note-time">{note.time}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
