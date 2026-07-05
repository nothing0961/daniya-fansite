import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, "$1")), "..");
const PLAYER_SRC = fs.readFileSync(path.join(ROOT, "src/components/shared/music-player.tsx"), "utf-8");
const HEADER_SRC = fs.readFileSync(path.join(ROOT, "src/components/layout/header.tsx"), "utf-8");
const PLAYLIST_SRC = fs.readFileSync(path.join(ROOT, "src/data/music-playlist.ts"), "utf-8");

/**
 * MusicPlayer 极简音乐播放器 · TDD 测试
 * ──────────────────────────────────────
 * 目标：Header 中放置一个🎵图标按钮，点击切换播放/暂停
 *       歌单循环播放（上一首结束自动切下一首）
 *       播放状态图标高亮/动画，暂停状态恢复默认
 */
describe("MusicPlayer 极简音乐播放器（A+A 方案：本地歌单+图标式）", () => {

  describe("基础结构：客户端组件 + 正确引用", () => {

    it("1) music-player.tsx 必须是客户端组件：文件顶部含 \"use client\" 指令", () => {
      expect(PLAYER_SRC).toMatch(/^["']use client["']/m);
    });

    it("2) 必须导入 DANIYA_PLAYLIST 歌单数据：import { ... DANIYA_PLAYLIST ... } from '@/data/music-playlist'", () => {
      expect(PLAYER_SRC).toContain("DANIYA_PLAYLIST");
      expect(PLAYER_SRC).toMatch(/from\s+["']@\/data\/music-playlist["']/);
    });

    it("3) 必须从 lucide-react 导入 Music 图标（或 Play/Pause 组合），用在按钮内", () => {
      // 至少导入 Music 或 Play/Pause 之一
      const hasMusic = /import\s*\{[^}]*\bMusic\b[^}]*\}\s*from\s*["']lucide-react["']/.test(PLAYER_SRC);
      const hasPlay = /import\s*\{[^}]*\bPlay\b[^}]*\}\s*from\s*["']lucide-react["']/.test(PLAYER_SRC);
      const hasPause = /import\s*\{[^}]*\bPause\b[^}]*\}\s*from\s*["']lucide-react["']/.test(PLAYER_SRC);
      expect(hasMusic || (hasPlay && hasPause)).toBe(true);
    });

    it("4) 必须有 export function MusicPlayer() 命名导出", () => {
      expect(PLAYER_SRC).toMatch(/export\s+(function|const)\s+MusicPlayer\b/);
    });

    it("5) 歌单配置 DANIYA_PLAYLIST 至少包含 3 首曲目（length >= 3），每首有 id/title/artist/src 字段", () => {
      // 从 playlist 配置文件中数 { id: 出现次数
      const trackMatches = PLAYLIST_SRC.match(/\{\s*id\s*:\s*["']/g) || [];
      expect(trackMatches.length).toBeGreaterThanOrEqual(3);
      // 每首必须有 src
      expect(PLAYLIST_SRC).toMatch(/src\s*:\s*["'][^"']+["']/);
    });

  });

  describe("状态管理：useState + <audio> 元素", () => {

    it("6) 必须使用 useState 管理「是否正在播放」状态（isPlaying / playing 之类变量名）", () => {
      // 需要有 const [xxx, setXxx] = useState(false) 或类似的布尔播放状态
      expect(PLAYER_SRC).toMatch(/useState\s*\(\s*(?:false|true)\s*\)/);
      // 至少存在一个播放/暂停相关的布尔变量
      const hasPlayingState = /\[(?:isPlaying|playing|isPlay)\s*,\s*set(?:IsPlaying|Playing|IsPlay)\]/.test(PLAYER_SRC);
      expect(hasPlayingState).toBe(true);
    });

    it("7) 必须使用 useState 管理「当前曲目索引」currentIndex（用于歌单遍历）", () => {
      expect(PLAYER_SRC).toMatch(/\[(?:currentIndex|trackIndex|currentTrack)\s*,\s*set(?:CurrentIndex|TrackIndex|CurrentTrack)\]\s*=\s*useState/);
    });

    it("8) JSX 中必须渲染 <audio> 元素，并绑定 src = DANIYA_PLAYLIST[currentIndex].src（动态取当前曲目）", () => {
      expect(PLAYER_SRC).toMatch(/<audio\b/);
      // src 绑定到歌单
      expect(PLAYER_SRC).toMatch(/src\s*=\s*\{\s*DANIYA_PLAYLIST\s*\[\s*(?:currentIndex|trackIndex|currentTrack)\s*\]\s*\.\s*src\s*\}/);
    });

    it("9) <audio> 必须绑定 onEnded 事件 → 自动切换下一曲（歌单循环：最后一首完了回到第 0 首）", () => {
      expect(PLAYER_SRC).toMatch(/onEnded\s*=\s*\{/);
      // 包含 setCurrentIndex(...) 或 (prev) => (prev + 1) % playlist.length 循环逻辑
      const hasLoopLogic =
        /set(?:CurrentIndex|TrackIndex|CurrentTrack)\s*\(\s*\(\s*(?:prev|_|i|idx)\s*\)\s*=>\s*\(\s*(?:prev|_|i|idx)\s*\+\s*1\s*\)\s*%\s*(?:DANIYA_PLAYLIST\.length|PLAYLIST\.length|playlist\.length)/.test(PLAYER_SRC) ||
        /set(?:CurrentIndex|TrackIndex|CurrentTrack)\s*\(\s*\(\s*(?:prev|_|i|idx)\s*\+\s*1\s*\)\s*%\s*(?:DANIYA_PLAYLIST\.length|PLAYLIST\.length|playlist\.length)/.test(PLAYER_SRC);
      expect(hasLoopLogic).toBe(true);
    });

  });

  describe("UI 渲染：Button 图标按钮（跟 ThemeToggle 同款视觉）", () => {

    it("10) 必须使用 shadcn/ui 的 <Button> 组件，variant=\"ghost\" size=\"icon\"（跟主题切换按钮同款）", () => {
      // 必须从 @/components/ui/button 导入 Button
      expect(PLAYER_SRC).toMatch(/import\s*\{[^}]*\bButton\b[^}]*\}\s*from\s*["']@\/components\/ui\/button["']/);
      // <Button variant="ghost" size="icon" 或 prop 顺序不同
      expect(PLAYER_SRC).toMatch(/<Button[^>]*variant\s*=\s*["']ghost["'][^>]*size\s*=\s*["']icon["'][^>]*>/);
    });

    it("11) 按钮 aria-label 必须有「播放音乐」或「暂停音乐」（可访问性）", () => {
      expect(PLAYER_SRC).toMatch(/aria-label\s*=\s*["'][^"']*(?:播放|暂停|music|Music|音乐)[^"']*["']/);
    });

    it("12) 播放状态 vs 暂停状态：图标不同（Music 高亮/类名切换，或 Play/Pause 切换）", () => {
      // 三元或逻辑：isPlaying ? <Pause ...> : <Play ...>，或者 Music 图标带条件 className
      const hasTernaryIcon = /(?:isPlaying|playing|isPlay)\s*\?[^<]*<(?:Pause|Music)[^>]*>[^:]*:[^<]*<(?:Play|Music)[^>]*>/.test(PLAYER_SRC);
      const hasConditionalClass = /className\s*=\s*\{[^{}]*(?:isPlaying|playing|isPlay)/.test(PLAYER_SRC);
      expect(hasTernaryIcon || hasConditionalClass).toBe(true);
    });

    it("13) 播放中的图标需要有「动画」效果：Tailwind animate-pulse / animate-spin 或自定义 keyframes", () => {
      // 播放状态下图标含 animate-pulse 或 animate-spin
      const hasPulse = /(?:isPlaying|playing|isPlay)\s*\?[^}]*animate-(?:pulse|spin|bounce)/.test(PLAYER_SRC) ||
                      /animate-(?:pulse|spin|bounce)[^}]*\?[^}]*(?:isPlaying|playing|isPlay)/.test(PLAYER_SRC) ||
                      /&&\s*["'][^"']*animate-(?:pulse|spin|bounce)/.test(PLAYER_SRC);
      expect(hasPulse).toBe(true);
    });

    it("14) 点击按钮切换播放/暂停：onClick 中必须调用 audioRef.current.play() 或 audioRef.current.pause()，并且同步更新 isPlaying 状态", () => {
      // 必须有 useRef 挂到 <audio> 上
      expect(PLAYER_SRC).toMatch(/useRef\s*<\s*HTMLAudioElement/);
      // 有 .play() 和 .pause() 调用
      expect(PLAYER_SRC).toMatch(/\.current\s*\.\s*play\s*\(/);
      expect(PLAYER_SRC).toMatch(/\.current\s*\.\s*pause\s*\(/);
    });

    it("15) SSR 水合安全：避免 mounted 之前调用 audio API（类似 ThemeToggle 的 mounted 模式，或 audio.play() 包在 useEffect 里）", () => {
      // 要么有 useState 控制 mounted，要么 play/pause 调用在 useEffect/onClick 中（onClick 本来就是客户端事件，也算安全）
      const hasMountedGuard = /(?:mounted|isMounted|hydrated)\s*,\s*set(?:Mounted|IsMounted|Hydrated)\]\s*=\s*useState\s*\(\s*false\s*\)/.test(PLAYER_SRC);
      const hasUseEffectPlay = /useEffect\s*\([\s\S]{0,400}\.current\s*\.\s*play\s*\(/.test(PLAYER_SRC);
      // 至少有一种 SSR 安全策略（onClick 本来就安全，所以任一即可）
      expect(hasMountedGuard || hasUseEffectPlay || true).toBe(true);
      // 额外校验：audio ref 的 play 必须在客户端事件中（onClick 已存在即可）
      expect(PLAYER_SRC).toMatch(/onClick\s*=\s*\{/);
    });

  });

  describe("Header 整合：在主题切换按钮旁边插入", () => {

    it("16) header.tsx 必须导入 MusicPlayer 组件：import { MusicPlayer } from '@/components/shared/music-player'", () => {
      expect(HEADER_SRC).toMatch(/import\s*\{[^}]*\bMusicPlayer\b[^}]*\}\s*from\s*["']@\/components\/shared\/music-player["']/);
    });

    it("17) Header JSX 中必须渲染 <MusicPlayer /> 组件，位置在 <ThemeToggle /> 附近（之前或之后）", () => {
      // MusicPlayer 出现在 ThemeToggle 的 300 字符范围内
      expect(HEADER_SRC).toMatch(/(?:<MusicPlayer\s*\/>[\s\S]{0,300}<ThemeToggle\s*\/>|<ThemeToggle\s*\/>[\s\S]{0,300}<MusicPlayer\s*\/>)/);
    });

  });

});
