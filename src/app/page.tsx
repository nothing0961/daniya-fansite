/**
 * 首页 — 微博式信息流
 * Hero Banner + 从 MDX 加载的作品卡片列表
 *
 * 修改方式：
 * - 修改 h1/p 可改变 Banner 文案
 * - 每页作品数：修改 PAGE_SIZE
 * - 数据来源：getAllPosts() 来自 src/lib/posts.ts
 */
import Link from "next/link";
import { getAllPosts, getAllTypes } from "@/lib/posts";
import { FeedList } from "@/components/feed/feed-list";
import { FeedPagination } from "@/components/feed/feed-pagination";

/** 每页显示作品数 */
const PAGE_SIZE = 6;

/** 作品类型显示名映射 */
const TYPE_LABELS: Record<string, string> = {
  illustration: "插画",
  comic: "漫画",
  video: "视频",
  article: "文章",
  cosplay: "COS",
  other: "其他",
};

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // 从 URL 参数获取当前页码
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  // 从 MDX 内容系统加载数据
  const allPosts = getAllPosts();
  const types = getAllTypes();

  // 分页计算
  const totalPages = Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedPosts = allPosts.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div>
      {/* ===== Hero Banner ===== */}
      <section className="hero-wrapper relative w-full border-b border-[var(--border)]">
        {/* --- 桌面端左右侧装饰图（建议尺寸 600×900px） --- */}
        <picture>
          <source srcSet="/hero-side-left.webp" type="image/webp" />
          <img
            className="hero-side hero-side--left"
            src="/hero-side-left.png"
            alt=""
            aria-hidden="true"
          />
        </picture>
        <picture>
          <source srcSet="/hero-side-right.webp" type="image/webp" />
          <img
            className="hero-side hero-side--right"
            src="/hero-side-right.png"
            alt=""
            aria-hidden="true"
          />
        </picture>

        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24 flex flex-col items-center text-center">
          {/* --- 手机端居中背景图（建议尺寸 750×1000px）--- */}
          <picture>
            <source srcSet="/hero-mobile.webp" type="image/webp" />
            <img
              className="hero-bg"
              src="/hero-mobile.png"
              alt=""
              aria-hidden="true"
            />
          </picture>

          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-3">
            达妮娅的瞌睡小屋
          </h1>
          <p className="text-[var(--muted-foreground)] max-w-md text-base leading-relaxed">
            《鸣潮》角色达妮娅的同人二创作品 curation 站点
            <br />
            精选搬运优质二创内容，标注原作者与出处
          </p>

          {/* 统计数字 — 动态计算 */}
          <div className="flex gap-8 mt-6 text-sm text-[var(--muted-foreground)]">
            <div className="text-center">
              <div className="text-xl font-bold text-[var(--foreground)]">
                {allPosts.length}
              </div>
              <div>作品</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[var(--foreground)]">
                {types.length}
              </div>
              <div>类型</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 作品信息流 ===== */}
      <section className="mx-auto max-w-2xl px-4 py-8">
        {/* 标题栏 + 类型筛选 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            最新作品
          </h2>
          <div className="flex gap-2 text-sm flex-wrap">
            <span className="text-[var(--muted-foreground)]">筛选：</span>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={`/type/${key}`}
                className="text-[var(--primary)] hover:underline"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* 卡片信息流 — 从 MDX 加载真实数据 */}
        <FeedList posts={pagedPosts} />
        <FeedPagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </section>
    </div>
  );
}
