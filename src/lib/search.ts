/**
 * 搜索索引 — 基于作品元数据的内存搜索
 * 启动时构建索引，搜索时直接查询
 *
 * 修改方式：修改 searchFields 可改变搜索范围（标题/描述/标签等）
 */
import { getAllPosts } from "./posts";
import type { PostMeta } from "./posts";

/** 搜索索引条目 */
interface SearchEntry {
  post: PostMeta;
  /** 搜索用的拼接文本 */
  searchText: string;
}

/** 内存搜索索引 */
let searchIndex: SearchEntry[] | null = null;

/**
 * 构建搜索索引
 * 将所有作品的标题、描述、标签、原作者拼接为可搜索文本
 */
function buildSearchIndex(): SearchEntry[] {
  const posts = getAllPosts();
  return posts.map((post) => ({
    post,
    searchText: [
      post.title,
      post.description,
      ...post.tags,
      post.originalCreator,
      post.type,
    ]
      .join(" ")
      .toLowerCase(),
  }));
}

/**
 * 获取搜索索引（延迟构建，首次调用时构建）
 */
function getSearchIndex(): SearchEntry[] {
  if (!searchIndex) {
    searchIndex = buildSearchIndex();
  }
  return searchIndex;
}

/**
 * 搜索作品
 * @param query 搜索关键词
 * @param limit 返回结果上限（默认 10）
 * @returns 匹配的作品元数据列表
 */
export function searchPosts(query: string, limit = 10): PostMeta[] {
  if (!query.trim()) return [];

  const index = getSearchIndex();
  const terms = query.toLowerCase().trim().split(/\s+/);

  // 计算每篇作品的相关性得分
  const scored = index
    .map((entry) => {
      let score = 0;
      for (const term of terms) {
        // 精确匹配加分更多
        const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        const matches = entry.searchText.match(regex);
        if (matches) {
          // 标题中的匹配权重更高
          const titleMatches = entry.post.title.toLowerCase().match(regex);
          score += (matches.length || 0) + (titleMatches ? titleMatches.length * 3 : 0);
        }
      }
      return { post: entry.post, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((entry) => entry.post);
}

