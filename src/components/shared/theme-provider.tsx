/**
 * ThemeProvider — 暗色/亮色主题切换提供者
 * 使用 next-themes 库，通过 className 策略切换 .light / .dark 类
 * 默认主题为暗色（鸣潮风格）
 *
 * 修改方式：修改 defaultTheme 可改变默认主题
 * 在任意组件中用 useTheme() hook 获取/设置主题
 */
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"       // 默认暗色 — 鸣潮风格
      enableSystem={false}       // 不跟随系统，手动切换
      disableTransitionOnChange  // 切换时禁用过渡动画，避免闪烁
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
