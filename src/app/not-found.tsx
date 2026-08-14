/**
 * 404 页面 — 资源未找到时显示
 * 主题：达妮娅的梦乡 — 页面掉进瞌睡少女的梦里了
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {/* 梦乡 Zzz 装饰 */}
      <div className="relative mb-6 h-16 w-24" aria-hidden="true">
        <span
          className="absolute left-1/2 top-0 -translate-x-1/2 font-serif text-2xl text-[var(--daniya-star,var(--foreground))] opacity-80"
          style={{ animation: "twinkle 3s ease-in-out infinite" }}
        >
          z
        </span>
        <span
          className="absolute left-1/2 top-5 -translate-x-1/2 font-serif text-3xl text-[var(--primary)] opacity-60"
          style={{ animation: "twinkle 3s ease-in-out 0.6s infinite" }}
        >
          Z
        </span>
        <span
          className="absolute left-1/2 top-11 -translate-x-1/2 font-serif text-4xl text-[var(--accent)] opacity-50"
          style={{ animation: "twinkle 3s ease-in-out 1.2s infinite" }}
        >
          Z
        </span>
      </div>

      <h1 className="font-serif text-6xl font-bold tracking-widest text-[var(--muted-foreground)] mb-4">
        404
      </h1>
      <p className="text-lg text-[var(--foreground)] mb-2">
        页面掉进达妮娅的梦乡了
      </p>
      <p className="text-sm text-[var(--muted-foreground)] mb-8">
        你访问的页面不存在或已被移除
      </p>
      <Link
        href="/"
        className="inline-flex h-10 items-center px-6 rounded-full
                   border border-[rgba(231,155,190,0.5)]
                   bg-[rgba(231,155,190,0.12)]
                   text-sm font-semibold text-[var(--primary)]
                   hover:bg-[rgba(231,155,190,0.25)]
                   hover:border-[rgba(231,155,190,0.8)]
                   transition-colors"
      >
        回到小屋
      </Link>
    </div>
  );
}
