/**
 * MusicPlayer — 方案A：HoverCard 悬停下拉面板播放器
 *
 * 触发方式（用户确认的三条规则）：
 *   1. 鼠标悬停 ▶️ 按钮 → 80ms 延迟后下拉展开面板（防快速划过误触）
 *   2. 鼠标离开 按钮+面板 → 200ms 延迟后自动收起（防按钮→面板间隙闪断）
 *   3. 点击 ▶️ 按钮 → 只切换播放/暂停（面板开合完全交给 hover 延迟机制，不参与）
 *
 * 面板内容（320px 宽胶囊风卡片，与原 Popover 一致）：
 *     ┌ 封面 60×60  歌名（truncate）
 *     │           歌手（小一号 muted）
 *     ├ ⏮ 上一首   ⏯ 播放暂停（粉）  ⏭ 下一首   🔊 音量杆
 *     └ ▰▰▰▰▱▱▱▱ 进度条  01:23 / 04:05
 *
 * 状态：
 *   - mounted：SSR 水合保护
 *   - isPlaying：是否在播放
 *   - currentIndex：当前第几首（歌单循环）
 *   - currentTime / duration：用于进度条（秒数）
 *   - volume：音量 0~1，默认 0.6（首播不要太响）
 *
 * 事件：
 *   - audio.onEnded → 自动下一曲（循环）
 *   - audio.onTimeUpdate → 更新 currentTime
 *   - audio.onLoadedMetadata → 更新 duration
 *   - 进度条 onChange → seek audio.currentTime
 *   - 音量条 onChange → setVolume，同步 audio.volume
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { DANIYA_PLAYLIST } from "@/data/music-playlist";

/** 时间格式化：秒数 → mm:ss */
function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.6);

  const track = DANIYA_PLAYLIST[currentIndex];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, mounted]);

  // ── 切歌时若正在播放 → 自动 play 新曲 ───────────────────────────
  useEffect(() => {
    if (!mounted) return;
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {
        // 浏览器自动播放策略阻止，忽略
      });
    }
  }, [currentIndex, mounted, isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + DANIYA_PLAYLIST.length) % DANIYA_PLAYLIST.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % DANIYA_PLAYLIST.length);
  };

  const handleEnded = () => {
    setCurrentIndex((prev) => (prev + 1) % DANIYA_PLAYLIST.length);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="音乐播放器">
        <span className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <HoverCard openDelay={80} closeDelay={200}>
      <HoverCardTrigger asChild>
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
      </HoverCardTrigger>

      <HoverCardContent className="w-80">
        {/* 上排：封面 + 歌名歌手 */}
        <div className="flex items-center gap-3 mb-4">
          {track.coverUrl ? (
            <img
              src={track.coverUrl}
              alt={track.title + " 封面"}
              className="w-[60px] h-[60px] shrink-0 rounded-md border border-[var(--border)] object-cover bg-[var(--card)]"
              onError={(e) => {
                // 封面加载失败 → 隐藏 img，后面会 fallback 到渐变占位（见 cover-url fallback）
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            // 无 cover-url 时：粉白渐变占位（封面风格 gradient）
            <div
              className="w-[60px] h-[60px] shrink-0 rounded-md border border-[var(--border)] bg-gradient-to-br from-pink-200 via-rose-100 to-fuchsia-200 dark:from-pink-400/40 dark:via-fuchsia-500/30 dark:to-indigo-500/40 flex items-center justify-center"
              aria-hidden="true"
            >
              <Play className="h-6 w-6 text-white/80" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-[var(--foreground)] truncate">
              {DANIYA_PLAYLIST[currentIndex].title}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
              {DANIYA_PLAYLIST[currentIndex].artist}
            </div>
          </div>
        </div>

        {/* 中排：上一首 / 播放暂停 / 下一首 / 音量 */}
        <div className="flex items-center gap-1.5 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            aria-label="上一首"
            className="h-8 w-8"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            aria-label={isPlaying ? "暂停音乐" : "播放音乐"}
            className="h-10 w-10 rounded-full bg-[var(--primary)]/15 hover:bg-[var(--primary)]/25 text-[var(--primary)]"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            aria-label="下一首"
            className="h-8 w-8"
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <div className="ml-auto flex items-center gap-1.5 pl-2">
            <Volume2 className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="音量"
              className="w-20 h-1.5 accent-[var(--primary)] cursor-pointer"
            />
          </div>
        </div>

        {/* 下排：进度条 + 时间 mm:ss/mm:ss */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            aria-label="播放进度"
            className="flex-1 h-1.5 accent-[var(--primary)] cursor-pointer"
          />
          <span className="text-[11px] tabular-nums text-[var(--muted-foreground)] shrink-0 select-none w-[90px] text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </HoverCardContent>

      <audio
        ref={audioRef}
        src={DANIYA_PLAYLIST[currentIndex].src}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        preload="metadata"
      />
    </HoverCard>
  );
}
