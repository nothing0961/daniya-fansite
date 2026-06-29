/**
 * Footer — 站点底部栏
 * 包含：版权信息、导航链接、技术栈说明
 *
 * 修改方式：修改 footerLinks 数组可增减底部链接
 */
import Link from "next/link";

/** 底部链接 */
const footerLinks = [
  { href: "/about", label: "关于本站" },
  { href: "/character", label: "达妮娅" },
  { href: "/api/rss", label: "RSS 订阅" },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* 版权信息 */}
          <p className="text-sm text-[var(--muted-foreground)]">
            &copy; {new Date().getFullYear()} 达妮娅的瞌睡小屋 — 本站内容为同人二创作品搬运，版权归原作者所有
          </p>

          {/* 底部导航 */}
          <nav className="flex items-center gap-4">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
