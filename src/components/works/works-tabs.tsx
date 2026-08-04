/**
 * WorksTabs — 作品集筛选 Tab 栏
 * 支持 URL 参数同步：点击 Tab 更新 ?type=xxx&sort=xxx
 */
"use client";

import { useRouter, usePathname } from "next/navigation";
import { WORKS_TABS, WORKS_SORTS, type WorksTabKey, type WorksSortKey } from "@/lib/works-constants";

interface WorksTabsProps {
  activeTab: WorksTabKey;
  activeSort: WorksSortKey;
  totalCount: number;
}

export function WorksTabs({ activeTab, activeSort, totalCount }: WorksTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  function updateParams(type?: string, sort?: string) {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (sort) params.set("sort", sort);
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <div className="wp-tabs-bar">
      <div className="wp-tabs">
        {WORKS_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`wp-tab ${activeTab === tab.key ? "wp-tab--active" : ""}`}
            onClick={() => updateParams(tab.key === "all" ? undefined : tab.key, activeSort)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="wp-tabs-actions">
        <select
          className="wp-sort-select"
          value={activeSort}
          onChange={(e) => updateParams(activeTab, e.target.value)}
        >
          {WORKS_SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>

        <span className="wp-count">共 {totalCount} 篇</span>
      </div>
    </div>
  );
}
