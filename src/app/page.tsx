/**
 * 首页 — 三栏暗色角色主题
 *
 * 左：互动角落（俄罗斯方块游戏机 + 语音回声台词轮播）
 * 中：达妮娅主舞台（大标题 + 台词 + 能力标签 + 文案 + CTA + 立绘海报卡）
 * 右：回声面板（生日倒计时 + 共鸣图鉴 + 站长笔记 + 站点速览统计）
 */
import Link from "next/link";
import type { Metadata } from "next";
import { TetrisConsoleHost } from "@/components/game/tetris-console-host";
import { BirthdayCountdown } from "./birthday-countdown";
import { EchoRotator } from "@/components/home/echo-rotator";
import {
  HERO_DATA,
  ABILITY_TAGS,
  ECHO_QUOTES,
  RESONANCE_TAGS,
  SIDE_NOTES,
} from "@/lib/home-mock-data";
import { getAllPosts } from "@/lib/posts";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import "./home.css";

export const metadata: Metadata = {
  title: "达妮娅的瞌睡小屋",
  description:
    "共鸣者档案 · 星炬学院在籍 — 关于达妮娅的角色考据、作品与笔记合集",
};

export default async function HomePage() {
  // 站点速览 — 真实内容库存（随投稿增长）
  const postsCount = getAllPosts().length;
  const resonanceCount = RESONANCE_TAGS.length;
  const quoteCount = ECHO_QUOTES.length;

  return (
    <div className="hp-root">
      {/* ===== 背景装饰层 ===== */}
      {/* 背景图层已移至 layout.tsx（全站生效，由 BgSwitcher 控制） */}
      <div className="hp-bg" />
      <div className="hp-bg-noise" />

      {/* ===== 三栏主舞台 ===== */}
      <section className="hp-stage">
        {/* === 左栏：互动角落（方块 + 语音回声） === */}
        <aside className="hp-col hp-col--left">
          <Reveal delay={0.05} className="w-full hp-left">
            <div className="hp-tetris-wrap">
              <TetrisConsoleHost />
            </div>

            {/* 语音回声 — 角色台词轮播 */}
            <div className="hp-card hp-echo-card">
              <div className="hp-sidebar-head">
                <span className="hp-sidebar-icon">🗯️</span>
                <h3 className="hp-sidebar-title">语音回声</h3>
                <span className="hp-sidebar-more">PLAYBACK</span>
              </div>
              <EchoRotator quotes={ECHO_QUOTES} />
            </div>
          </Reveal>
        </aside>

        {/* === 中栏：主舞台 === */}
        <Reveal delay={0.12} className="hp-col hp-col--center">
          {/* 主卡片 */}
          <div className="hp-card hp-hero">
            <div className="hp-hero-bg">
              <div className="hp-hero-img" />
            </div>

            <div className="hp-hero-body">
              {/* 档案纸信息区 — 档案卷宗卡（NO.0521 编号 = 5月21日生日档案号） */}
              <div className="hp-hero-content hp-file-sheet">
                <div className="hp-hero-kicker">
                  <span className="hp-file-no">NO.0521</span>
                  <span className="hp-kicker-label">共鸣者档案</span>
                  <span className="hp-kicker-sep">·</span>
                  <span className="hp-kicker-value">星炬学院在籍</span>
                </div>

                <h1 className="hp-hero-title">
                  <span className="hp-title-zh">{HERO_DATA.titleZh}</span>
                  <span className="hp-title-en">{HERO_DATA.titleEn}</span>
                </h1>

                {/* 台词上移为副标题（kicker 已含档案信息，subtitle 重复移除） */}
                <p className="hp-hero-sub">{HERO_DATA.quote}</p>

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
                  {/* 已归档章 — 档案语言 */}
                  <span className="hp-file-stamp" aria-hidden="true">
                    已归档
                  </span>
                </div>
              </div>

              {/* 立绘海报卡 — 档案照片（斜贴 + 图钉 + 折角） */}
              <div className="hp-hero-poster hp-photo">
                <span className="hp-photo-pin" aria-hidden="true" />
                <img
                  src="/615294f4d0b740f4bf5ce693ddb0b35920260521.webp"
                  alt="达妮娅 · 心之诞生"
                  className="hp-hero-poster-img"
                />
              </div>
            </div>
          </div>
        </Reveal>

        {/* === 右栏：回声面板 === */}
        <Reveal delay={0.2} className="hp-col hp-col--right">
          {/* 生日倒计时 — 寄往 5/21 的贺卡（独立卡面，无需头部标题） */}
          <div className="hp-card hp-sidebar-card hp-sidebar-birthday">
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
                  <span className="hp-resonance-value">{tag.value ?? "正常"}</span>
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

          {/* 站点速览 — 真实内容库存统计 */}
          <div className="hp-card hp-sidebar-card hp-stat-card">
            <div className="hp-sidebar-head">
              <span className="hp-sidebar-icon">📊</span>
              <h3 className="hp-sidebar-title">站点速览</h3>
            </div>
            <div className="hp-stat-bar">
              <div className="hp-stat-item">
                <CountUp value={String(postsCount)} className="hp-stat-value" />
                <span className="hp-stat-label">作品</span>
                <span className="hp-stat-sub">已收录</span>
              </div>
              <div className="hp-stat-item">
                <CountUp value={String(resonanceCount)} className="hp-stat-value" />
                <span className="hp-stat-label">共鸣图鉴</span>
                <span className="hp-stat-sub">已收录</span>
              </div>
              <div className="hp-stat-item">
                <CountUp value={String(quoteCount)} className="hp-stat-value" />
                <span className="hp-stat-label">语音台词</span>
                <span className="hp-stat-sub">条摘录</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
