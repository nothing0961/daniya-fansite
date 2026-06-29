/**
 * MobileNav — 移动端侧滑导航菜单
 * 点击汉堡图标展开，包含导航链接和登录入口
 *
 * 修改方式：修改 links 传入的数组即可改变移动端菜单项
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  links: NavLink[];
}

export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* 汉堡菜单按钮 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label={open ? "关闭菜单" : "打开菜单"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* 遮罩层 */}
      {open && (
        <div
          className="fixed inset-0 top-14 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 侧滑菜单面板 */}
      <div
        className={`fixed top-14 right-0 z-50 h-[calc(100vh-3.5rem)] w-64 bg-[var(--background)] border-l border-[var(--border)] transform transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="flex flex-col p-4 gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 text-sm rounded-md hover:bg-[var(--muted)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block w-full text-center px-3 py-2.5 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)]"
            >
              登录
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
