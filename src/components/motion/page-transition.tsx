/**
 * PageTransition — 路由切换时的页面入场过渡
 * 按 pathname 重挂载，每次导航淡入
 * 注意：只做 opacity 动画、时长 0.2s——页面里满是 backdrop-filter 毛玻璃层，
 * 位移/长动画会让每帧重新采样背景，在 Windows 上产生明显迟滞感
 */
"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
