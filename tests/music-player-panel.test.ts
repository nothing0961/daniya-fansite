import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, "$1")), "..");
const PLAYER_SRC = fs.readFileSync(path.join(ROOT, "src/components/shared/music-player.tsx"), "utf-8");
const PLAYLIST_SRC = fs.readFileSync(path.join(ROOT, "src/data/music-playlist.ts"), "utf-8");

/**
 * MusicPlayer 方案A升级：HoverCard 悬停下拉面板
 * ──────────────────────────────────────
 * 鼠标悬停 🎵 按钮（延迟开/关）→ 下拉 320px 宽的面板：
 *   上：封面 + 歌名 + 歌手
 *   中：⏮ 上一首 | ⏯ 播放/暂停 | ⏭ 下一首 | 🔊 音量杆
 *   下：进度条 + mm:ss 时间
 * 点击 🎵 按钮：只切换播放/暂停（面板开合完全由 hover 管）
 *
 * 目标文件：music-player.tsx / music-playlist.ts（加 coverUrl）
 */
describe("MusicPlayer 方案A：HoverCard 悬停下拉面板（鼠标悬停展开，点击只切播放暂停）", () => {

  describe("A. HoverCard 悬停容器结构：外层 + Trigger + Content + 延迟配置", () => {

    it("1) 必须从 @/components/ui/hover-card 导入 HoverCard、HoverCardTrigger、HoverCardContent（替换之前的 Popover）", () => {
      expect(PLAYER_SRC).toMatch(
        /import\s*\{[^}]*\bHoverCard\b[^}]*\bHoverCardTrigger\b[^}]*\bHoverCardContent\b[^}]*\}\s*from\s*["']@\/components\/ui\/hover-card["']/
      );
    });

    it("2) 最外层 JSX 用 <HoverCard> 包裹（替代之前的 Popover）", () => {
      expect(PLAYER_SRC).toMatch(/<HoverCard\b/);
    });

    it("3) 原播放/暂停按钮必须放在 <HoverCardTrigger asChild> 里（悬停即触发下拉）", () => {
      expect(PLAYER_SRC).toMatch(/<HoverCardTrigger\s+asChild\s*>/);
      // Trigger 内包含 <Button variant="ghost" size="icon"
      expect(PLAYER_SRC).toMatch(/<HoverCardTrigger\s+asChild\s*>[\s\S]{0,200}<Button[^>]*variant\s*=\s*["']ghost["'][^>]*size\s*=\s*["']icon["']/);
    });

    it("4) 面板内容用 <HoverCardContent> 包裹，宽 w-80（320px）或自定义宽度", () => {
      expect(PLAYER_SRC).toMatch(/<HoverCardContent[^>]*>/);
    });

    it("5) 必须配置 openDelay + closeDelay（鼠标悬停延迟 + 离开延迟收起，防按钮→面板间隙闪断；要求：0<openDelay≤300，100≤closeDelay≤500）", () => {
      const delayRe = /<HoverCard[^>]*\sopenDelay\s*=\s*\{?\s*(\d+)\s*\}?[^>]*\scloseDelay\s*=\s*\{?\s*(\d+)\s*\}?/;
      const match = delayRe.exec(PLAYER_SRC);
      expect(match).not.toBeNull();
      if (!match) return;
      const openDelay = Number(match[1]);
      const closeDelay = Number(match[2]);
      expect(openDelay).toBeGreaterThan(0);
      expect(openDelay).toBeLessThanOrEqual(300);
      expect(closeDelay).toBeGreaterThanOrEqual(100);
      expect(closeDelay).toBeLessThanOrEqual(500);
    });

    it("6) HoverCardTrigger 里的 Button onClick 必须调用 togglePlay（点击只切播放/暂停，面板开合完全交给 hover 延迟机制）", () => {
      const re = /<HoverCardTrigger\s+asChild\s*>[\s\S]{0,400}<Button[^>]*\sonClick\s*=\s*\{\s*togglePlay\s*\}[^>]*>/;
      expect(re.test(PLAYER_SRC)).toBe(true);
    });

  });

  describe("B. 面板上半区：封面 + 歌名 + 歌手", () => {

    it("5) music-playlist.ts 的 MusicTrack 接口必须可选添加 coverUrl?: string 字段", () => {
      expect(PLAYLIST_SRC).toMatch(/interface\s+MusicTrack\s*\{[\s\S]{0,400}coverUrl\s*\?\s*:\s*string/);
    });

    it("6) 面板内有封面图：<img src={DANIYA_PLAYLIST[currentIndex].coverUrl 或渐变占位 div（任意方案都算过）", () => {
      // 封面取 DANIYA_PLAYLIST[currentIndex].coverUrl，或封面区域有 className 含 cover/gradient 之类
      const hasCoverImg = /<img[\s\S]{0,200}src\s*=\s*\{\s*DANIYA_PLAYLIST\s*\[\s*(?:currentIndex|trackIndex)\s*\]\s*\.\s*coverUrl\s*\}/.test(PLAYER_SRC);
      const hasCoverFallback = /(?:cover-url|coverUrl|封面|cover)[\s\S]{0,80}(?:gradient|bg-)/i.test(PLAYER_SRC);
      expect(hasCoverImg || hasCoverFallback).toBe(true);
    });

    it("7) 面板内显示歌名：渲染 DANIYA_PLAYLIST[currentIndex].title", () => {
      expect(PLAYER_SRC).toMatch(/DANIYA_PLAYLIST\s*\[\s*(?:currentIndex|trackIndex)\s*\]\s*\.\s*title/);
    });

    it("8) 面板内显示歌手：渲染 DANIYA_PLAYLIST[currentIndex].artist", () => {
      expect(PLAYER_SRC).toMatch(/DANIYA_PLAYLIST\s*\[\s*(?:currentIndex|trackIndex)\s*\]\s*\.\s*artist/);
    });

  });

  describe("C. 面板控制区：上一首 / 播放暂停 / 下一首 三个按钮", () => {

    it("9) 有「上一首」按钮/图标，onClick 中 setCurrentIndex((prev) => (prev - 1 + DANIYA_PLAYLIST.length) % DANIYA_PLAYLIST.length（上一首循环）", () => {
      const hasPrevLogic =
        /set(?:CurrentIndex|TrackIndex)\s*\(\s*\(\s*(?:prev|_|i|idx)\s*\)\s*=>\s*\(\s*(?:prev|_|i|idx)\s*-\s*1\s*\+\s*DANIYA_PLAYLIST\s*\.\s*length\s*\)\s*%\s*DANIYA_PLAYLIST\s*\.\s*length\s*\)/.test(PLAYER_SRC);
      expect(hasPrevLogic).toBe(true);
    });

    it("10) 有「下一首」按钮/图标，onClick 中 setCurrentIndex((prev) => (prev + 1) % DANIYA_PLAYLIST.length", () => {
      // 注意：ended 里已有同逻辑，所以下一首按钮复用它即可
      const nextCount = (PLAYER_SRC.match(
        /set(?:CurrentIndex|TrackIndex)\s*\(\s*\(\s*(?:prev|_|i|idx)\s*\)\s*=>\s*\(\s*(?:prev|_|i|idx)\s*\+\s*1\s*\)\s*%\s*DANIYA_PLAYLIST\s*\.\s*length\s*\)/g
      ) || []).length;
      // 至少 2 次：一次在 onEnded，一次在「下一首」按钮 onClick
      expect(nextCount).toBeGreaterThanOrEqual(2);
    });

    it("11) 导入 SkipBack（⏮）/ SkipForward（⏭）/ Volume2（🔊）等 lucide-react 图标用于面板控制", () => {
      const hasSkip = /import\s*\{[^}]*(?:SkipBack|SkipForward)[^}]*\}\s*from\s*["']lucide-react["']/.test(PLAYER_SRC);
      const hasVolume = /import\s*\{[^}]*Volume2[^}]*\}\s*from\s*["']lucide-react["']/.test(PLAYER_SRC);
      expect(hasSkip).toBe(true);
      expect(hasVolume).toBe(true);
    });

  });

  describe("D. 进度条 + 时间显示", () => {

    it("12) 有进度条 <input type=\"range\" ... 绑定 audioRef.current.currentTime（onChange 时 seek）", () => {
      expect(PLAYER_SRC).toMatch(/<input[^>]*type\s*=\s*["']range["'][^>]*>/);
      // onChange 里设置 .currentTime
      expect(PLAYER_SRC).toMatch(/\.currentTime\s*=\s*/);
    });

    it("13) 使用 useState 管理 currentTime（当前播放秒数）+ duration（总时长），用于进度条 value / max", () => {
      const hasCurrentTime = /\[(?:currentTime|progress|position)\s*,\s*set(?:CurrentTime|Progress|Position)\]\s*=\s*useState\s*\(\s*0\s*\)/.test(PLAYER_SRC);
      const hasDuration = /\[(?:duration|total|totalTime)\s*,\s*set(?:Duration|Total|TotalTime)\]\s*=\s*useState\s*\(\s*0\s*\)/.test(PLAYER_SRC);
      expect(hasCurrentTime).toBe(true);
      expect(hasDuration).toBe(true);
    });

    it("14) <audio> 绑定 onTimeUpdate（更新 currentTime） + onLoadedMetadata（更新 duration）", () => {
      expect(PLAYER_SRC).toMatch(/onTimeUpdate\s*=\s*\{/);
      expect(PLAYER_SRC).toMatch(/onLoadedMetadata\s*=\s*\{/);
    });

    it("15) 时间显示格式化：有 mm:ss 格式化函数（Math.floor + padStart 或 % 60），显示「当前 / 总长」", () => {
      const hasFormat =
        /(?:padStart|formatTime|mm\s*:\s*ss|Math\.floor[\s\S]{0,80}%[\s\S]{0,20}60)/.test(PLAYER_SRC);
      expect(hasFormat).toBe(true);
    });

  });

  describe("E. 音量控制", () => {

    it("16) 使用 useState 管理 volume（0~1），初始化 0.5~0.7 之间（默认不要 100%）", () => {
      const volumeInitRe = /\[volume\s*,\s*setVolume\]\s*=\s*useState\s*\(\s*(0\.(?:5|6|7))\s*\)/;
      expect(PLAYER_SRC).toMatch(volumeInitRe);
    });

    it("17) useEffect 或初始化时设置 audioRef.current.volume = volume", () => {
      expect(PLAYER_SRC).toMatch(/\.volume\s*=\s*volume/);
    });

    it("18) 有独立的音量条 <input type=\"range\" ... min=0 max=1 step=0.01 绑定 volume onChange setVolume", () => {
      // 两个 range，一个进度一个音量
      const rangeCount = (PLAYER_SRC.match(/<input[^>]*type\s*=\s*["']range["'][^>]*>/g) || []).length;
      expect(rangeCount).toBeGreaterThanOrEqual(2);
    });

  });

});
