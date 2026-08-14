/**
 * 达妮娅角色介绍页 V4 — /character
 * 侧翼档案架布局（2026-08-13 改版）
 *
 * 结构：
 *  左栏（sticky 档案架）：身份卡（心之诞生头像 + 名字 + 双语署名）
 *    + 数据胶囊（属性表已填字段）+ 锚点导航（scroll-spy）+ 生日倒计时
 *  右栏（档案流）：角色故事（五卷 tab + 拉贝尔曲线）→
 *    共鸣能力鉴定报告（默认展开）→ 资料来源声明
 *
 * 数据来源：./archive-data.ts（⏳ 待补字段在渲染层过滤）
 * 样式来源：./archive.css
 * metadata 移至 ./layout.tsx（Client Component 不能导出 metadata）
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  STORY_CHAPTER,
  STORY_TABS,
  PROFILE_ROWS,
  ARCHIVE_SOURCE_LINKS,
  RESONANCE_REPORT,
} from "./archive-data";
import { BirthdayCountdown } from "../birthday-countdown";
import { Reveal } from "@/components/motion/reveal";
import "./archive.css";

const NAV_SECTIONS = [
  { id: "story", label: "角色故事" },
  { id: "report", label: "鉴定报告" },
  { id: "source", label: "资料来源" },
] as const;

export default function CharacterPage() {
  // collapsed[id] === true → 该胶囊已收起；报告默认展开
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    report: false,
    story: true,
    source: true,
  });
  const [activeStoryId, setActiveStoryId] = useState(STORY_TABS[0].id);
  const [activeSection, setActiveSection] = useState("story");

  const toggle = useCallback((id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isClosed = (id: string) => collapsed[id] === true;

  // scroll-spy：穿过视口中部带的档案卷激活对应导航项
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-25% 0px -60% 0px" }
    );
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const jumpTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ⏳ 待补字段不渲染，数据补齐后自动出现
  const visibleRows = PROFILE_ROWS.filter((row) => !row.value.includes("⏳"));
  const currentStory = STORY_TABS.find((t) => t.id === activeStoryId) ?? STORY_TABS[0];

  return (
    <div className="dan-archive">
      <div className="dan-frame">
        {/* ===== 左栏：档案架（sticky） ===== */}
        <Reveal delay={0} className="min-w-0">
          <aside className="dan-rail" aria-label="达妮娅档案架">
            {/* 身份卡 */}
            <div className="dan-identity">
              <div className="dan-identity-avatar" role="img" aria-label="达妮娅" />
              <div className="dan-identity-title">
                <h1 className="dan-identity-name">达 妮 娅</h1>
                <p className="dan-identity-sign">До свидания · 直到下次再见</p>
              </div>
              <div className="dan-chips">
                {visibleRows.map((row) => (
                  <div key={row.label} className="dan-chip">
                    <span className="dan-chip-label">{row.label}</span>
                    <span className="dan-chip-value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 锚点导航 */}
            <nav className="dan-nav" aria-label="档案目录">
              {NAV_SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-current={activeSection === id ? "true" : undefined}
                  className={`dan-nav-item${activeSection === id ? " dan-nav-item--active" : ""}`}
                  onClick={() => jumpTo(id)}
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* 生日倒计时 */}
            <div className="dan-rail-birthday">
              <p className="dan-rail-birthday-title">🌸 生日倒计时</p>
              <BirthdayCountdown />
            </div>
          </aside>
        </Reveal>

        {/* ===== 右栏：档案流 ===== */}
        <main className="dan-flow">
          {/* ===== 区块 1：角色故事（第一屏，可折叠） ===== */}
          <Reveal delay={0.08} className="min-w-0">
            <section id="story" className="dan-sheet dan-sheet--story">
              <div
                className="dan-sheet-head dan-collapsible-head"
                onClick={() => toggle("story")}
                role="button"
                aria-expanded={!isClosed("story")}
              >
                <span className="dan-sheet-number">§</span>
                <h2 className="dan-sheet-title">{STORY_CHAPTER.title}</h2>
                <span className="dan-sheet-page">故事 · 档案</span>
                <span className={`dan-toggle${isClosed("story") ? " dan-toggle--closed" : ""}`} />
              </div>
              <div className={`dan-collapse${isClosed("story") ? " dan-collapse--closed" : ""}`}>
                {/* 拉贝尔曲线：共鸣能力检测档案的波形母题 */}
                <div className="dan-ecg" aria-hidden="true">
                  <svg viewBox="0 0 640 40" preserveAspectRatio="none" fill="none">
                    <defs>
                      <linearGradient id="dan-ecg-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(231,155,190,0)" />
                        <stop offset="12%" stopColor="#e79bbe" />
                        <stop offset="88%" stopColor="#e79bbe" />
                        <stop offset="100%" stopColor="rgba(231,155,190,0)" />
                      </linearGradient>
                    </defs>
                    <path
                      className="dan-ecg-path"
                      d="M0 20 H64 L76 8 L88 30 L100 14 L112 20 H224 L236 6 L248 32 L260 12 L272 20 H384 L396 4 L408 34 L420 10 L432 20 H560 L572 10 L584 30 L598 16 L610 20 H640"
                      stroke="url(#dan-ecg-grad)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="dan-story-tabs" role="tablist" aria-label="角色故事分卷">
                  {STORY_TABS.map((tab) => {
                    const active = tab.id === activeStoryId;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={`dan-story-tab${active ? " dan-story-tab--active" : ""}`}
                        onClick={() => setActiveStoryId(tab.id)}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStory.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="dan-story-panel"
                    role="tabpanel"
                  >
                    <div className="dan-chapter-body">
                      {currentStory.body.map((paragraph, pIdx) => (
                        <p key={pIdx}>{paragraph}</p>
                      ))}
                    </div>
                    <p className="dan-chapter-source">— {currentStory.source}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </section>
          </Reveal>

          {/* ===== 区块 2：共鸣能力鉴定报告（默认展开，可折叠） ===== */}
          <Reveal delay={0.16} className="min-w-0">
            <section id="report" className="dan-sheet dan-sheet--report">
              <div
                className="dan-sheet-head dan-collapsible-head"
                onClick={() => toggle("report")}
                role="button"
                aria-expanded={!isClosed("report")}
              >
                <span className="dan-sheet-number">§</span>
                <h2 className="dan-sheet-title">共 鸣 能 力 鉴 定 报 告</h2>
                <span className="dan-sheet-page">机密 · 归档</span>
                <span className={`dan-toggle${isClosed("report") ? " dan-toggle--closed" : ""}`} />
              </div>
              <div className={`dan-collapse${isClosed("report") ? " dan-collapse--closed" : ""}`}>
                <div className="dan-report-ability">
                  <span className="dan-report-ability-label">共鸣能力：</span>
                  <span className="dan-report-ability-value">{RESONANCE_REPORT.ability}</span>
                </div>
                {RESONANCE_REPORT.subSections.map((sub) => (
                  <div key={sub.title} className="dan-report-sub">
                    <h3 className="dan-report-sub-title">{sub.title}</h3>
                    {sub.fields && sub.fields.length > 0 && (
                      <dl className="dan-report-fields">
                        {sub.fields.map((f) => (
                          <div key={f.label} className="dan-report-field">
                            <dt>{f.label}</dt>
                            <dd>{f.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <div className="dan-report-body">
                      {sub.body.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                    {sub.quotes && sub.quotes.length > 0 && (
                      <div className="dan-report-quotes">
                        {sub.quotes.map((q, i) => (
                          <blockquote key={i} className="dan-report-quote">
                            {q}
                          </blockquote>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </Reveal>

          {/* ===== 区块 3：资料来源声明（可折叠） ===== */}
          <Reveal delay={0.24} className="min-w-0">
            <section id="source" className="dan-sheet dan-sheet--source">
              <div
                className="dan-sheet-head dan-collapsible-head"
                onClick={() => toggle("source")}
                role="button"
                aria-expanded={!isClosed("source")}
              >
                <span className="dan-sheet-number">§</span>
                <h2 className="dan-sheet-title">资 料 来 源 声 明</h2>
                <span className="dan-sheet-page">合规 · 必载</span>
                <span className={`dan-toggle${isClosed("source") ? " dan-toggle--closed" : ""}`} />
              </div>
              <div className={`dan-collapse${isClosed("source") ? " dan-collapse--closed" : ""}`}>
                <ol className="dan-source-list">
                  {ARCHIVE_SOURCE_LINKS.map((link) => (
                    <li key={link.label}>
                      <span className="dan-source-label">{link.label}</span>
                      <span className="dan-source-arrow">→</span>
                      <span className="dan-source-url">{link.url}</span>
                    </li>
                  ))}
                  <li className="dan-source-original">
                    <span className="dan-source-label">原创考据笔记</span>
                    <span className="dan-source-arrow">→</span>
                    <span className="dan-source-url">
                      「达妮娅的瞌睡小屋」站长原创，转载请注明出处
                    </span>
                  </li>
                </ol>
              </div>
            </section>
          </Reveal>
        </main>
      </div>
    </div>
  );
}
