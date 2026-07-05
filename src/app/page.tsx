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
import { getAllPosts } from "@/lib/posts";
import { FeedList } from "@/components/feed/feed-list";
import { FeedPagination } from "@/components/feed/feed-pagination";
import { Separator } from "@/components/ui/separator";
import { POST_TYPE_LABELS } from "@/types/post";
import { HeroBanner } from "./hero-banner";
import { SideImage } from "./side-image";
import { BirthdayCountdown } from "./birthday-countdown";

/** 每页显示作品数 */
const PAGE_SIZE = 6;

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // 从 URL 参数获取当前页码
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  // 从 MDX 内容系统加载数据
  const allPosts = getAllPosts();

  // 分页计算
  const totalPages = Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedPosts = allPosts.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div>
      {/* ===== Hero Banner ===== */}
      <section className="relative w-full flex items-center justify-center border-b border-[var(--border)] overflow-hidden py-8" style={{ minHeight: '50vh' }}>
        {/* 背景图片 — 暗色/亮色自动切换 */}
        <HeroBanner />
        {/* 暗色叠加层 */}
        <div className="absolute inset-0 bg-[var(--background)]/25" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-8">
          <div className="hidden md:flex flex-shrink-0 rounded-3xl border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md w-[720px] min-h-80 items-stretch overflow-hidden">
            {/* 左半：结构化角色简介 */}
            <div className="flex-1 flex flex-col justify-between px-8 py-5 gap-3">
              {/* 顶部：角色名 + 身份标签 */}
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-lg font-bold text-[var(--foreground)]">达妮娅</h3>
                  <span className="text-[11px] font-medium text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full">Daniya</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-[var(--muted-foreground)] bg-[var(--muted)]/70 px-2 py-0.5 rounded-full">💤 学院瞌睡王</span>
                  <span className="text-[11px] text-[var(--muted-foreground)] bg-[var(--muted)]/70 px-2 py-0.5 rounded-full">🍰 甜点党</span>
                  <span className="text-[11px] text-[var(--muted-foreground)] bg-[var(--muted)]/70 px-2 py-0.5 rounded-full">❄️ 泡泡共鸣</span>
                </div>
              </div>
              {/* 中部：角色档案 · 3 段 */}
              <div className="text-[12.5px] text-[var(--muted-foreground)] dark:text-white leading-relaxed space-y-1.5">
                <p>
                  任何时间、任何地点、任何一位讲师的课堂……你都有概率看见她在偷偷睡觉。
                </p>
                <br />
                <p>
                  课题迷茫时只要带甜点 + 软磨硬泡多说几句好话，她就帮你「蒙对」正确方向；甜点味道不错的话还附赠「来源不明」的测量数据。
                </p>
                <blockquote className="border-l-2 border-[var(--credit)] pl-2 italic text-[var(--credit)]">
                  「至于这些数据来自哪里……她劝你最好别问。」
                </blockquote>
              </div>

              {/* 底部：分隔线 + 角色自白 */}
              <div className="space-y-1.5">
                <Separator className="bg-[var(--border)]/70" />
                <div className="flex items-start gap-2">
                  <p className="text-[12.5px] leading-relaxed text-[var(--foreground)]">
                    「经常有人问我为什么不穿校服……校服是提供虚质防护的对吧？但我在学院登记的共鸣能力就是『制造隔绝虚质、提供防护的泡泡』呀？哈哈哈，是不是很意外。」
                  </p>
                </div>
              </div>
            </div>
            {/* 右半：立绘（圆形 · 保持居中裁剪） */}
            <div className="flex-shrink-0 w-64 flex items-center justify-center pr-5">
              <img
                src="/324E6938CA1A90C930208816149E5FE9.jpg"
                alt="达妮娅立绘"
                className="w-64 h-64 object-cover rounded-full ring-4 ring-[var(--primary)]/20"
              />
            </div>
          </div>

          {/* 右侧：现有内容 */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0">
            <div className="rounded-full border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md px-10 py-5">
              <BirthdayCountdown />
            </div>

            {/* 类型筛选标签 */}
            <div className="mt-7 rounded-full border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md px-6 py-3 flex items-center gap-3 flex-wrap justify-center">
              <span className="text-sm text-[var(--muted-foreground)] dark:text-white">筛选</span>
              {Object.entries(POST_TYPE_LABELS).map(([key, label]) => (
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
