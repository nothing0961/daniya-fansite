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
import { HeroBanner } from "./hero-banner";
import { SideImage } from "./side-image";

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
      <section className="relative w-full flex items-center justify-center border-b border-[var(--border)] overflow-hidden" style={{ height: '50vh' }}>
        {/* 背景图片 — 暗色/亮色自动切换 */}
        <HeroBanner />
        {/* 暗色叠加层 */}
        <div className="absolute inset-0 bg-[var(--background)]/25" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 flex items-center gap-8">
          {/* 左侧：角色立绘大胶囊 */}
          <div className="hidden md:flex flex-shrink-0 rounded-full border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md w-[650px] h-72 items-center overflow-hidden">
            {/* 简介 */}
            <div className="flex-1 flex flex-col justify-center px-10 py-6">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">达妮娅</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                角色简介文案待填写
              </p>
            </div>
            {/* 立绘 */}
            <div className="flex-shrink-0 w-64 h-full flex items-center justify-center">
              <img
                src="/324E6938CA1A90C930208816149E5FE9.jpg"
                alt="达妮娅立绘"
className="w-64 h-64 object-cover rounded-full"
              />
            </div>
          </div>

          {/* 右侧：现有内容 */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0">
            <div className="rounded-full border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md px-10 py-5">
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-2">
                达妮娅的瞌睡小屋
              </h1>
              <p className="text-[var(--muted-foreground)] text-base leading-relaxed">
                《鸣潮》角色达妮娅的同人二创作品 curation 站点
                <br />
                精选搬运优质二创内容，标注原作者与出处
              </p>
            </div>

            {/* 统计数字 */}
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

            {/* 类型筛选标签 */}
            <div className="mt-7 rounded-full border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md px-6 py-3 flex items-center gap-3 flex-wrap justify-center">
              <span className="text-sm text-[var(--muted-foreground)]">筛选</span>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <Link
                  key={key}
                  href={`/type/${key}`}
                  className="rounded-full border border-[var(--border)] bg-[var(--muted)]/40 px-4 py-1 text-sm text-[var(--foreground)] hover:bg-[var(--primary)]/30 hover:border-[var(--primary)] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 内容区：左图 + 信息流 + 右图 ===== */}
      <div className="flex justify-center">
        {/* 左侧装饰图 */}
        <aside
          className="hero-side-left hidden md:block flex-shrink-0"
          style={{ width: 'calc(50vw - 336px)' }}
        >
          <SideImage
            darkSrc="/hero-side-left.jpg"
            lightSrc="/47e2e589fd58cdf0a12c5f110b0a7c46527235831.jpg"
            side="left"
          />
        </aside>

        {/* 信息流 */}
        <section className="w-full max-w-2xl px-4 py-8 surface-pink rounded-xl">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
            最新作品
          </h2>

          <FeedList posts={pagedPosts} />
          <FeedPagination
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </section>

        {/* 右侧装饰图 */}
        <aside
          className="hero-side-right hidden md:block flex-shrink-0"
          style={{ width: 'calc(50vw - 336px)' }}
        >
          <SideImage
            darkSrc="/hero-side-right.jpg"
            lightSrc="/5c4fbffa74c8781ad7c9ad7ba53aa548513549031.jpg"
            side="right"
          />
        </aside>
      </div>
    </div>
  );
}
