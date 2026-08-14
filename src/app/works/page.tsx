/**
 * 作品集页面 — /works
 * 暗色主题 · 瀑布流 · 无限滚动 · URL 参数 Tab 同步
 */
import type { Metadata } from "next";
import Link from "next/link";
import { WORKS_TABS, WORKS_SORTS } from "@/lib/works-constants";
import { getFilteredWorks } from "@/lib/works-data";
import { WorksTabs } from "@/components/works/works-tabs";
import { WorksClient } from "@/components/works/works-client";
import "./works.css";

const PAGE_SIZE = 12;

interface Props {
  searchParams: Promise<{ type?: string; sort?: string; page?: string }>;
}

export const metadata: Metadata = {
  title: "作品集",
  description: "达妮娅同人二创作品合集 — 插画、漫画、视频、文章",
};

export default async function WorksPage({ searchParams }: Props) {
  const params = await searchParams;
  const activeTab = (params.type || "all") as string;
  const activeSort = (params.sort || "latest") as string;

  const validTab = WORKS_TABS.some((t) => t.key === activeTab) ? activeTab : "all";
  const validSort = WORKS_SORTS.some((s) => s.key === activeSort) ? activeSort : "latest";

  const allFiltered = getFilteredWorks(validTab as any, validSort as any);

  return (
    <div className="wp-page">
      {/* 顶部操作栏 */}
      <header className="wp-header">
        <div className="wp-header-left">
          <Link href="/" className="wp-back">← 返回首页</Link>
          <div className="wp-heading">
            <p className="wp-eyebrow">星炬学院特"困"生</p>
            <h1 className="wp-title">
              作品集
              <span className="wp-count-badge">{allFiltered.length}</span>
            </h1>
          </div>
        </div>
        <div className="wp-header-right">
          <Link href="/submit" className="wp-btn wp-btn--primary wp-btn-sm">投稿作品</Link>
        </div>
      </header>

      {/* Tab 筛选 */}
      <WorksTabs
        activeTab={validTab as any}
        activeSort={validSort as any}
        totalCount={allFiltered.length}
      />

      {/* 主体 */}
      <div className="wp-main">
        <WorksClient
          key={`${validTab}-${validSort}`}
          allPosts={allFiltered}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}
