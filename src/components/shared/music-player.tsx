/**
 * MusicPlayer — 极简音乐播放器（A+A 方案：本地歌单+图标式）
 *
 * 交互：
 *   - 点击 Header 中的 🎵 按钮 → 切换播放/暂停
 *   - 歌单按顺序循环播放（上一首 ended 自动切下一首，最后一首回到第 0 首）
 *   - 播放中：图标高亮 + animate-pulse 呼吸灯效果
 *   - 暂停时：图标恢复默认灰色
 *
 * 后续可扩展：弹出小面板显示歌名/上一曲/下一曲/音量（底层逻辑不用改）
 *
 * 修改方式：
 *   - 更换歌单 → 修改 @/data/music-playlist.ts
 *   - 更换图标 → 替换 Play / Pause / Music 导入
 *   - 改动画 → 调整 animate-pulse（或改成 animate-spin）
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DANIYA_PLAYLIST } from "@/data/music-playlist";

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── 状态 ───────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);         // SSR 水合保护
  const [isPlaying, setIsPlaying] = useState(false);     // 是否正在播放
  const [currentIndex, setCurrentIndex] = useState(0);   // 当前曲目索引（歌单循环）

  // ── SSR 水合保护 ───────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── 切换曲目时，若正在播放则自动开始播放新曲 ──────────────────────
  useEffect(() => {
    if (!mounted) return;
    if (!audioRef.current) return;

    if (isPlaying) {
      // 切歌后重新 play（play() 返回 Promise，部分浏览器需 catch）
      audioRef.current.play().catch(() => {
        // 浏览器自动播放策略可能阻止，忽略即可
      });
    }
    // 依赖：索引变化 + mounted + isPlaying
  }, [currentIndex, mounted, isPlaying]);

  // ── 点击按钮：切换播放 / 暂停 ──────────────────────────────────────
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // play() 返回 Promise，规避 DOMException（用户手势内触发通常 OK）
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  // ── 曲目结束：自动下一曲，循环 ──────────────────────────────────────
  const handleEnded = () => {
    setCurrentIndex((prev) => (prev + 1) % DANIYA_PLAYLIST.length);
  };

  // ── 未挂载前渲染占位按钮，避免 SSR 水合不匹配 ───────────────────
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="音乐播放器">
        <span className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        aria-label={isPlaying ? "暂停音乐" : "播放音乐"}
        title={isPlaying ? "暂停音乐" : "播放音乐"}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 text-[var(--primary)] animate-pulse" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>

      {/* 真实 <audio>：不显示 controls，只通过按钮控制 */}
      <audio
        ref={audioRef}
        src={DANIYA_PLAYLIST[currentIndex].src}
        onEnded={handleEnded}
        preload="none"
      />
    </>
  );
}
