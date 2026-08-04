/**
 * works-data — 作品集数据处理层（仅服务端使用）
 */
import { getAllPosts, type PostMeta } from "@/lib/posts";
import { WORKS_TABS, type WorksTabKey, type WorksSortKey } from "./works-constants";

export function getFilteredWorks(
  tabKey: WorksTabKey,
  sortKey: WorksSortKey
): PostMeta[] {
  const all = getAllPosts();
  const tabDef = WORKS_TABS.find((t) => t.key === tabKey);
  const filtered = tabDef?.type ? all.filter((p) => p.type === tabDef.type) : all;

  switch (sortKey) {
    case "oldest":
      return [...filtered].sort(
        (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      );
    case "popular":
      return [...filtered].sort((a, b) => (b.tags.length - a.tags.length));
    case "latest":
    default:
      return filtered;
  }
}
