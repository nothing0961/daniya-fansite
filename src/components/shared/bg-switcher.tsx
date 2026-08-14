/**
 * BgSwitcher — 背景图切换按钮
 * 点击展开下拉面板，选择背景图 + 调节透明度
 * 选择持久化到 localStorage，全站生效
 *
 * 性能优化：
 *   1. 缩略图使用 webp（480px，约 20KB），进站后 requestIdleCallback 预加载
 *   2. 下拉菜单直接显示已预加载的缩略图，零卡顿
 *   3. 选中背景两段式加载：先显示 window 版（1600px webp，秒解码），
 *      后台 decode desktop 版（4K webp）完成后静默升级，杜绝 10K 原图（50MB+）同步解码卡顿
 *
 * 预设图配置：修改下方 BG_PRESETS 数组，并在 scripts/gen-bg-thumbs.mjs 重新生成缩略图
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import "./bg-switcher.css";

const STORAGE_SRC = "daniya-bg-src";
const STORAGE_BLUR = "daniya-bg-blur";

type Preset = {
  id: string;
  label: string;
  src: string | null;
  thumb: string | null;
};

/** 预设背景图列表 — thumb 字段指向缩略图（由 scripts/gen-bg-thumbs.mjs 生成） */
const BG_PRESETS: Preset[] = [
  { id: "none", label: "默认", src: null, thumb: null },
  { id: "bg01", label: "6月日历", src: "/背景图片/6月日历-10k.png", thumb: "/背景图片/thumbs/6月日历-10k.webp" },
  { id: "bg02", label: "封面01", src: "/背景图片/UpScal-FaceCover-Redefine01.png", thumb: "/背景图片/thumbs/UpScal-FaceCover-Redefine01.webp" },
  { id: "bg03", label: "封面06", src: "/背景图片/UpScal-FaceCover-Redefine06.png", thumb: "/背景图片/thumbs/UpScal-FaceCover-Redefine06.webp" },
  { id: "bg04", label: "封面07", src: "/背景图片/UpScal-FaceCover-Redefine07.png", thumb: "/背景图片/thumbs/UpScal-FaceCover-Redefine07.webp" },
  { id: "bg05", label: "修复02", src: "/背景图片/UpScal-Fix-Redefine02.png", thumb: "/背景图片/thumbs/UpScal-Fix-Redefine02.webp" },
  { id: "bg06", label: "修复03", src: "/背景图片/UpScal-Fix-Redefine03.png", thumb: "/背景图片/thumbs/UpScal-Fix-Redefine03.webp" },
  { id: "bg07", label: "修复04", src: "/背景图片/UpScal-Fix-Redefine04.png", thumb: "/背景图片/thumbs/UpScal-Fix-Redefine04.webp" },
  { id: "bg08", label: "修复05", src: "/背景图片/UpScal-Fix-Redefine05.png", thumb: "/背景图片/thumbs/UpScal-Fix-Redefine05.webp" },
  { id: "bg09", label: "国际服二周年", src: "/背景图片/国际服二周年线下庆典活动预告图-10k.png", thumb: "/背景图片/thumbs/国际服二周年线下庆典活动预告图-10k.webp" },
  { id: "bg10", label: "泰服二周年", src: "/背景图片/泰服 2周年纪念活动宣传图-10k.png", thumb: "/背景图片/thumbs/泰服 2周年纪念活动宣传图-10k.webp" },
  { id: "bg11", label: "直到下次再见", src: "/背景图片/达妮娅  EP《直到下次再见》封面-10k.png", thumb: "/背景图片/thumbs/达妮娅  EP《直到下次再见》封面-10k.webp" },
  { id: "bg12", label: "3.3壁纸", src: "/背景图片/达妮娅 3.3下半开放壁纸-10k.png", thumb: "/背景图片/thumbs/达妮娅 3.3下半开放壁纸-10k.webp" },
  { id: "bg13", label: "30万粉丝", src: "/背景图片/达妮娅 TikTok30万粉丝贺图-10k.png", thumb: "/背景图片/thumbs/达妮娅 TikTok30万粉丝贺图-10k.webp" },
  { id: "bg14", label: "心之诞生", src: "/背景图片/达妮娅 心之诞生，初现的期许-9.6k.png", thumb: "/背景图片/thumbs/达妮娅 心之诞生，初现的期许-9.6k.webp" },
  { id: "bg15", label: "泡影的梦", src: "/背景图片/达妮娅 泡影的梦(女漂)-9.6k.png", thumb: "/背景图片/thumbs/达妮娅 泡影的梦(女漂)-9.6k.webp" },
  { id: "bg16", label: "雷蛇联动", src: "/背景图片/达妮娅 鸣潮X雷蛇联动宣传壁纸-10k.png", thumb: "/背景图片/thumbs/达妮娅 鸣潮X雷蛇联动宣传壁纸-10k.webp" },
  { id: "bg17", label: "坠入虚无", src: "/背景图片/达妮娅EP 坠入虚无 封面-10k.png", thumb: "/背景图片/thumbs/达妮娅EP 坠入虚无 封面-10k.webp" },
  { id: "bg18", label: "韩服二周年", src: "/背景图片/韩服二周年线下庆典活动预告图-10k.png", thumb: "/背景图片/thumbs/韩服二周年线下庆典活动预告图-10k.webp" },
];

/** 原图 → 窗口版（1600px webp，聊天终端等窗口容器使用，避免解码 50MB 原图卡顿） */
function toWindowSrc(src: string): string | null {
  if (!src.startsWith("/背景图片/")) return null;
  return src.replace("/背景图片/", "/背景图片/window/").replace(/\.(png|jpg|jpeg)$/i, ".webp");
}

/** 原图 → 桌面版（3840px 4K webp，全屏背景使用，避免解码 10K 原图卡顿） */
function toDesktopSrc(src: string): string | null {
  if (!src.startsWith("/背景图片/")) return null;
  return src.replace("/背景图片/", "/背景图片/desktop/").replace(/\.(png|jpg|jpeg)$/i, ".webp");
}

/** 递增令牌：快速连续切换时丢弃过期的高清升级，防止旧图晚到覆盖新图 */
let applyBgToken = 0;

/**
 * 应用背景图 — 两段式加载（与 layout.tsx 内联脚本的首屏逻辑同源）：
 *   1. 立即把 window 版（1600px webp）设置到 --bg-image-url，秒解码、切换零卡顿
 *   2. 后台 decode desktop 版（4K webp），完成后静默升级，视觉无跳变
 * --bg-image-chat 固定用 window 版（聊天终端窗口内使用）
 */
function applyBgImage(src: string | null) {
  const token = ++applyBgToken;
  const root = document.documentElement;
  if (!src) {
    root.style.removeProperty("--bg-image-url");
    root.style.removeProperty("--bg-image-chat");
    return;
  }
  const windowSrc = toWindowSrc(src);
  if (windowSrc) {
    root.style.setProperty("--bg-image-chat", `url("${windowSrc}")`);
    root.style.setProperty("--bg-image-url", `url("${windowSrc}")`);
  } else {
    root.style.removeProperty("--bg-image-chat");
    root.style.setProperty("--bg-image-url", `url("${src}")`);
    return;
  }
  const desktopSrc = toDesktopSrc(src);
  if (!desktopSrc) return;
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    img
      .decode()
      .then(() => {
        if (token === applyBgToken) {
          root.style.setProperty("--bg-image-url", `url("${desktopSrc}")`);
        }
      })
      .catch(() => {});
  };
  img.src = desktopSrc;
}

/**
 * 应用可读性旋钮（0-30）——三轴联动（公式与 layout.tsx 内联脚本一致，必须同步修改）：
 *   --bg-blur-opacity  模糊层：0 → 1
 *   --bg-image-opacity 清晰层：0.8 → 0.35（原图退暗）
 *   --bg-scrim-opacity 月光纱：0.35 → 0.6（遮罩加深）
 * 滑块拉大 = 更糊 + 更暗 + 纱更厚 = 文字越清晰
 * opacity 变化由 GPU 加速，极其流畅
 */
function applyBgBlur(blur: number) {
  const opacity = Math.min(Math.max(blur / 30, 0), 1);
  const root = document.documentElement;
  root.style.setProperty("--bg-blur-opacity", String(opacity));
  root.style.setProperty("--bg-image-opacity", String(0.8 - opacity * 0.45));
  root.style.setProperty("--bg-scrim-opacity", String(0.35 + opacity * 0.25));
}

/**
 * 后台预加载缩略图 + window 版到浏览器缓存
 * 使用 requestIdleCallback 在浏览器空闲时执行，不影响首屏性能
 * 缩略图（~20KB）供下拉菜单显示；window 版（~几百KB）供切换第一帧秒显
 */
function preloadThumbs() {
  const thumbs = BG_PRESETS.flatMap((p) => {
    const list: string[] = [];
    if (p.thumb) list.push(p.thumb);
    if (p.src) {
      const windowSrc = toWindowSrc(p.src);
      if (windowSrc) list.push(windowSrc);
    }
    return list;
  });
  const idleCallback =
    (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback ||
    ((cb: () => void) => setTimeout(cb, 2000));

  idleCallback(() => {
    thumbs.forEach((src) => {
      const img = new Image();
      img.src = src;
      // 图片加载完成后浏览器会缓存，后续 <img> 标签直接命中缓存
    });
  });
}

export function BgSwitcher() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("none");
  const [blur, setBlur] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // 初始化：从 localStorage 读取 + 后台预加载缩略图
  useEffect(() => {
    const savedSrc = localStorage.getItem(STORAGE_SRC);
    const savedBlur = parseFloat(localStorage.getItem(STORAGE_BLUR) || "0");
    setBlur(savedBlur);

    const matched = BG_PRESETS.find((p) => p.src === savedSrc);
    setActiveId(matched?.id || (savedSrc ? "custom" : "none"));

    applyBgImage(savedSrc);
    applyBgBlur(savedBlur);

    // 进站后后台预加载缩略图（用户可能点开下拉菜单）
    preloadThumbs();
  }, []);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = useCallback((id: string) => {
    const preset = BG_PRESETS.find((p) => p.id === id);
    const src = preset?.src ?? null;
    setActiveId(id);
    applyBgImage(src);
    if (src) {
      localStorage.setItem(STORAGE_SRC, src);
    } else {
      localStorage.removeItem(STORAGE_SRC);
    }
  }, []);

  const handleBlur = useCallback((value: number) => {
    setBlur(value);
    applyBgBlur(value);
    localStorage.setItem(STORAGE_BLUR, String(value));
  }, []);

  return (
    <div className="bg-switcher">
      <button
        ref={btnRef}
        type="button"
        aria-label="切换背景图"
        className="bg-switcher-btn"
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </button>

      {open && (
        <div ref={panelRef} className="bg-switcher-panel">
          <div className="bg-switcher-title">背景图设置</div>

          {/* 缩略图网格 — 使用已预加载的 webp 缩略图 */}
          <div className="bg-switcher-grid">
            {BG_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`bg-switcher-thumb ${activeId === preset.id ? "bg-switcher-thumb--active" : ""}`}
                onClick={() => handleSelect(preset.id)}
              >
                {preset.thumb ? (
                  <img
                    src={preset.thumb}
                    alt={preset.label}
                    decoding="async"
                    className="bg-switcher-thumb-img"
                  />
                ) : (
                  <span className="bg-switcher-thumb-default">{preset.label}</span>
                )}
              </button>
            ))}
          </div>

          {/* 可读性滑块 — 拉大 = 背景更糊更暗，文字更清晰 */}
          <div className="bg-switcher-opacity">
            <label>可读性</label>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={blur}
              onChange={(e) => handleBlur(parseFloat(e.target.value))}
            />
            <span className="bg-switcher-opacity-value">{blur}px</span>
            <p className="bg-switcher-opacity-hint">拉大让背景变糊变暗，文字更清楚</p>
          </div>
        </div>
      )}
    </div>
  );
}
