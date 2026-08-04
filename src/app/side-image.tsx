"use client";

/**
 * SideImage — 首页侧边装饰图（桌面端）
 * 仅深色主题：始终使用暗色图
 */
interface SideImageProps {
  darkSrc: string;
  /** @deprecated 亮色主题已移除，保留接口兼容 */
  lightSrc?: string;
  side: "left" | "right";
}

export function SideImage({ darkSrc, side }: SideImageProps) {
  return (
    <img
      src={darkSrc}
      alt=""
      className="w-full"
      style={{
        position: 'sticky',
        top: '3.5rem',
        height: 'calc(100vh - 3.5rem)',
        objectFit: 'cover',
        objectPosition: side === "left" ? 'left center' : 'right center',
      }}
    />
  );
}
