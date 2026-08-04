/**
 * 达妮娅角色介绍页 V3 — /character
 * 暗色文学叙事风格（2026-08-04 改版）
 *
 * 区块：
 *  1. 档案抬头（masthead）— 中英文大标题 + 引文 + 金线分隔
 *  2. 共鸣者档案（属性表）— 双列 10 项属性（不可折叠）
 *  3. 共鸣能力鉴定报告 — 可折叠
 *  4. 章节故事（卷轴卡片）× 3 — 可折叠
 *  5. 资料来源声明 — 可折叠
 *
 * 数据来源：./archive-data.ts
 * 样式来源：./archive.css
 * metadata 移至 ./layout.tsx（Client Component 不能导出 metadata）
 */
"use client";

import { useState, useCallback } from "react";
import {
  STORY_CHAPTERS,
  PROFILE_ROWS,
  ARCHIVE_SOURCE_LINKS,
  RESONANCE_REPORT,
} from "./archive-data";
import "./archive.css";

export default function CharacterPage() {
  // collapsed[id] === true → 该胶囊已收起；默认全部收起
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    report: true,
    source: true,
    ...Object.fromEntries(STORY_CHAPTERS.map((c) => [`chapter-${c.id}`, true])),
  });

  const toggle = useCallback((id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isClosed = (id: string) => collapsed[id] === true;

  return (
    <div className="dan-archive min-h-screen">
      {/* ===== 区块 1：档案抬头 ===== */}
      <header className="dan-masthead">
        <div className="dan-masthead-line" />
        <p className="dan-masthead-sub">THE DOSSIER · OF · DANIYA</p>
        <h1 className="dan-masthead-title">
          <span className="dan-masthead-chinese">达妮娅</span>
          <span className="dan-masthead-latin">D A N I Y A</span>
        </h1>
        <p className="dan-masthead-quote">
          &ldquo;星光落在她的发梢，像一封寄往夜空的信。&rdquo;
        </p>
        <div className="dan-masthead-meta">
          <span>No. 001</span>
          <span>·</span>
          <span>共鸣者档案</span>
          <span>·</span>
          <span>Wuthering Waves</span>
        </div>
        <div className="dan-masthead-line" />
      </header>

      {/* ===== 档案主体 ===== */}
      <main className="dan-body">
        {/* ===== 区块 2：共鸣者档案（属性表，不可折叠） ===== */}
        <section className="dan-sheet dan-sheet--profile">
          <div className="dan-sheet-head">
            <span className="dan-sheet-number">§</span>
            <h2 className="dan-sheet-title">共 鸣 者 档 案</h2>
            <span className="dan-sheet-page">记忆页 · 00</span>
          </div>
          <dl className="dan-profile-grid">
            {PROFILE_ROWS.map((row) => (
              <div key={row.label} className="dan-profile-row">
                <dt className="dan-profile-label">{row.label}</dt>
                <dd className="dan-profile-value">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ===== 区块 3：共鸣能力鉴定报告（可折叠） ===== */}
        <section className="dan-sheet dan-sheet--report">
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

        {/* ===== 区块 4：章节故事（可折叠） ===== */}
        {STORY_CHAPTERS.map((chapter, idx) => (
          <article
            key={chapter.id}
            className="dan-sheet dan-sheet--chapter"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div
              className="dan-chapter-head dan-collapsible-head"
              onClick={() => toggle(`chapter-${chapter.id}`)}
              role="button"
              aria-expanded={!isClosed(`chapter-${chapter.id}`)}
            >
              <span className="dan-chapter-no">{chapter.chapterNo}</span>
              <span className="dan-chapter-page">{chapter.pageNo}</span>
              <span className={`dan-toggle${isClosed(`chapter-${chapter.id}`) ? " dan-toggle--closed" : ""}`} />
            </div>
            <div className={`dan-collapse${isClosed(`chapter-${chapter.id}`) ? " dan-collapse--closed" : ""}`}>
              <h3 className="dan-chapter-title">{chapter.title}</h3>
              <div className="dan-chapter-divider" />
              <div className="dan-chapter-body">
                {chapter.body.map((paragraph, pIdx) => (
                  <p key={pIdx}>{paragraph}</p>
                ))}
              </div>
              <p className="dan-chapter-source">— {chapter.source}</p>
            </div>
          </article>
        ))}

        {/* ===== 区块 5：资料来源声明（可折叠） ===== */}
        <section className="dan-sheet dan-sheet--source">
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
      </main>

      <footer className="dan-colophon">
        <p>— 终 · F I N —</p>
        <p className="dan-colophon-sub">达妮娅的瞌睡小屋 · 角色档案分卷</p>
      </footer>
    </div>
  );
}
