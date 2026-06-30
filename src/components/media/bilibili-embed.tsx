"use client";

interface BilibiliEmbedProps {
  bvId: string;
}

/**
 * B站视频嵌入播放器
 * 响应式 16:9 容器，加载 B 站官方 iframe 播放器
 */
export function BilibiliEmbed({ bvId }: BilibiliEmbedProps) {
  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden border border-[var(--border)] bg-black">
      <iframe
        src={`//player.bilibili.com/player.html?bvid=${bvId}&page=1&high_quality=1`}
        className="w-full h-full"
        allowFullScreen
        title="Bilibili video player"
        loading="lazy"
      />
    </div>
  );
}
