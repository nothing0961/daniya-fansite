"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  COLS,
  ROWS,
  cellColor,
  dropInterval,
  pieceColor,
  useTetris,
  type PieceType,
} from "@/hooks/use-tetris";
import { TetrisConsole } from "./tetris-console";

interface TetrisGameProps {
  className?: string;
}

const BG_COLOR = "#9bbc0f";
const BG_DARK = "#8bac0f";
const GRID_LINE = "rgba(15, 56, 15, 0.25)";
const TEXT_COLOR = "#0f380f";
const KEY_TIMEOUT_MS = 15000;

type GameMode = "auto" | "awaitingClick" | "manual";

interface RenderState {
  board: number[][];
  nextType: PieceType;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  paused: boolean;
  mode: GameMode;
  aiTakeover: boolean;
}

export function TetrisGame({ className }: TetrisGameProps) {
  const [mode, setMode] = useState<GameMode>("auto");
  const [aiTakeover, setAiTakeover] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  // AI 控制游戏的条件：自动模式 或 手动模式下 AI 接管
  const aiPlaying = mode === "auto" || (mode === "manual" && aiTakeover);
  // 游戏暂停的条件：待激活状态 或 手动模式下用户暂停
  const gamePaused = mode === "awaitingClick" || (mode === "manual" && !aiTakeover && userPaused);

  const {
    boardWithPiece,
    nextType,
    score,
    level,
    lines,
    gameOver,
    paused,
    actions,
    tick,
  } = useTetris(aiPlaying);

  // 同步 gamePaused 到 useTetris 的 paused 状态
  useEffect(() => {
    if (paused !== gamePaused) {
      actions.setPaused(gamePaused);
    }
  }, [gamePaused, paused, actions]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef({ cell: 8, boardW: 80, boardH: 160, dpr: 1 });
  const aiPlayingRef = useRef(aiPlaying);
  const modeRef = useRef(mode);
  const aiTakeoverRef = useRef(aiTakeover);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const pausedRef = useRef(paused);
  const levelRef = useRef(level);
  const gameOverRef = useRef(gameOver);
  const tickRef = useRef(tick);
  const keyTimeoutRef = useRef<number | null>(null);

  // 同步渲染状态到 ref，供 RAF 闭包内的 draw() 读取最新值
  const stateRef = useRef<RenderState>({
    board: boardWithPiece,
    nextType,
    score,
    level,
    lines,
    gameOver,
    paused,
    mode,
    aiTakeover,
  });

  useEffect(() => {
    stateRef.current = {
      board: boardWithPiece,
      nextType,
      score,
      level,
      lines,
      gameOver,
      paused,
      mode,
      aiTakeover,
    };
  }, [boardWithPiece, nextType, score, level, lines, gameOver, paused, mode, aiTakeover]);

  useEffect(() => { aiPlayingRef.current = aiPlaying; }, [aiPlaying]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { aiTakeoverRef.current = aiTakeover; }, [aiTakeover]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { tickRef.current = tick; }, [tick]);

  // 键盘超时管理
  const clearKeyTimeout = useCallback(() => {
    if (keyTimeoutRef.current) {
      window.clearTimeout(keyTimeoutRef.current);
      keyTimeoutRef.current = null;
    }
  }, []);

  const startKeyTimeout = useCallback(() => {
    clearKeyTimeout();
    keyTimeoutRef.current = window.setTimeout(() => {
      if (modeRef.current === "manual" && !aiTakeoverRef.current) {
        setAiTakeover(true);
      }
    }, KEY_TIMEOUT_MS);
  }, [clearKeyTimeout]);

  // Resize canvas to fit wrapper (responsive)
  const resize = () => {
    const canvas = canvasRef.current;
    const wrap = wrapperRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const infoW = 3;
    const totalW = COLS + infoW + 0.6;
    const cell = Math.max(4, Math.floor(Math.min(rect.width / totalW, rect.height / (ROWS + 0.8))));
    const boardW = cell * COLS;
    const boardH = cell * ROWS;
    sizeRef.current = { cell, boardW, boardH, dpr };
    canvas.style.width = `${cell * totalW}px`;
    canvas.style.height = `${cell * (ROWS + 0.4)}px`;
    canvas.width = Math.floor(cell * totalW * dpr);
    canvas.height = Math.floor(cell * (ROWS + 0.4) * dpr);
  };

  useEffect(() => {
    resize();
    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => resize())
      : null;
    if (ro && wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener("resize", resize);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  // draw 从 ref 读取最新状态
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { cell, boardW, boardH, dpr } = sizeRef.current;
    if (cell < 4 || boardW < 10) return;
    const s = stateRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const totalW = (COLS + 3.6) * cell;
    const totalH = (ROWS + 0.4) * cell;
    // Background LCD
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, totalW, totalH);
    // Vignette
    const vg = ctx.createRadialGradient(
      boardW / 2, boardH / 2, Math.min(boardW, boardH) * 0.4,
      boardW / 2, boardH / 2, Math.max(boardW, boardH) * 0.75,
    );
    vg.addColorStop(0, "rgba(255,255,255,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, totalW, totalH);

    // Board recess
    ctx.fillStyle = BG_DARK;
    ctx.fillRect(0, 0, boardW + 0.4 * cell, boardH + 0.4 * cell);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0.2 * cell, 0.2 * cell, boardW, boardH);

    // Draw cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = s.board[r][c];
        const x = 0.2 * cell + c * cell;
        const y = 0.2 * cell + r * cell;
        if (v) {
          ctx.fillStyle = cellColor(v);
          ctx.fillRect(x, y, cell, cell);
          ctx.fillStyle = "rgba(255,255,255,0.22)";
          ctx.fillRect(x, y, cell, Math.max(1, cell * 0.15));
          ctx.fillStyle = "rgba(0,0,0,0.22)";
          ctx.fillRect(x, y + cell - Math.max(1, cell * 0.15), cell, Math.max(1, cell * 0.15));
        } else {
          ctx.fillStyle = GRID_LINE;
          ctx.fillRect(x + cell - 1, y, 1, cell);
          ctx.fillRect(x, y + cell - 1, cell, 1);
        }
      }
    }

    // Right info panel
    const px = 0.2 * cell + boardW + 0.4 * cell;
    let py = 0.2 * cell;
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = `bold ${Math.max(8, Math.floor(cell * 0.8))}px monospace`;
    ctx.textBaseline = "top";

    ctx.fillText("NEXT", px, py);
    py += Math.ceil(cell * 1.0);
    const nSize = cell * 0.9;
    drawNextPiece(ctx, s.nextType, px, py, nSize);
    py += nSize * 5 + cell * 0.4;

    const fmt = (l: string, v: string | number) => {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = `bold ${Math.max(8, Math.floor(cell * 0.8))}px monospace`;
      ctx.fillText(l, px, py);
      ctx.font = `${Math.max(8, Math.floor(cell * 0.9))}px monospace`;
      ctx.fillText(String(v), px, py + Math.ceil(cell * 0.9));
      py += Math.ceil(cell * 2.0);
    };
    fmt("SCORE", s.score);
    fmt("LEVEL", s.level);
    fmt("LINES", s.lines);

    // Scanlines
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    for (let y = 0; y < totalH; y += 2) ctx.fillRect(0, y, totalW, 1);

    // Overlays
    const centerX = (0.4 * cell + boardW) / 2;
    const centerY = (0.4 * cell + boardH) / 2;
    if (s.gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0.2 * cell, 0.2 * cell, boardW, boardH);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(10, cell * 1.3)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", centerX, centerY - cell);
      ctx.font = `${Math.max(8, cell * 0.9)}px monospace`;
      const isAi = s.mode === "auto" || (s.mode === "manual" && s.aiTakeover);
      ctx.fillText(isAi ? "RESTARTING..." : "R TO RESTART", centerX, centerY + cell);
      ctx.textAlign = "left";
    } else if (s.mode === "awaitingClick") {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0.2 * cell, 0.2 * cell, boardW, boardH);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(9, cell * 1.0)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("点击屏幕", centerX, centerY - cell * 0.6);
      ctx.fillText("开始游戏", centerX, centerY + cell * 0.6);
      ctx.textAlign = "left";
    } else if (s.paused) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0.2 * cell, 0.2 * cell, boardW, boardH);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(10, cell * 1.3)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("PAUSED", centerX, centerY);
      ctx.font = `${Math.max(8, cell * 0.8)}px monospace`;
      ctx.fillText("P TO RESUME", centerX, centerY + cell * 1.5);
      ctx.textAlign = "left";
    } else if (s.mode === "auto" || (s.mode === "manual" && s.aiTakeover)) {
      ctx.fillStyle = "rgba(15, 56, 15, 0.85)";
      ctx.font = `${Math.max(7, cell * 0.7)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(s.mode === "manual" ? "AUTO" : "AUTO", centerX, 0.2 * cell + cell * 1.2);
      ctx.textAlign = "left";
    } else if (s.mode === "manual") {
      ctx.fillStyle = "rgba(15, 56, 15, 0.85)";
      ctx.font = `${Math.max(7, cell * 0.7)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("PLAY", centerX, 0.2 * cell + cell * 1.2);
      ctx.textAlign = "left";
    }
  };

  // RAF tick loop
  useEffect(() => {
    const loop = (t: number) => {
      const interval = aiPlayingRef.current
        ? 80
        : dropInterval(levelRef.current);
      if (t - lastTickRef.current >= interval && !pausedRef.current && !gameOverRef.current) {
        lastTickRef.current = t;
        tickRef.current();
      }
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 离开检测 1: 标签页隐藏 → AI 接管
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        if (modeRef.current === "manual" && !aiTakeoverRef.current) {
          setAiTakeover(true);
        }
        clearKeyTimeout();
      } else {
        // 标签页重新可见：重置 lastTick 防止 burst
        lastTickRef.current = 0;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [clearKeyTimeout]);

  // 离开检测 2: 焦点丢失 → AI 接管
  useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    const onBlur = () => {
      if (modeRef.current === "manual" && !aiTakeoverRef.current) {
        setAiTakeover(true);
      }
      clearKeyTimeout();
    };
    wrap.addEventListener("blur", onBlur);
    return () => wrap.removeEventListener("blur", onBlur);
  }, [clearKeyTimeout]);

  // 键盘处理 + 回来检测
  useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;

    const tetrisKeys = new Set([
      "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
      " ", "p", "P", "r", "R",
      "w", "W", "a", "A", "s", "S", "d", "D",
    ]);

    const onKey = (e: KeyboardEvent) => {
      if (!tetrisKeys.has(e.key)) return;

      // 回来检测: AI 接管状态下按任意游戏键 → 恢复手动
      if (modeRef.current === "manual" && aiTakeoverRef.current) {
        setAiTakeover(false);
        startKeyTimeout();
        // 继续执行按键动作
      }

      // 重置键盘超时
      if (modeRef.current === "manual" && !aiTakeoverRef.current) {
        startKeyTimeout();
      }

      e.preventDefault();

      if (gameOverRef.current && (e.key === "r" || e.key === "R")) {
        actions.reset();
        return;
      }
      if (gameOverRef.current) return;

      switch (e.key) {
        case "ArrowLeft": case "a": case "A": actions.moveLeft(); break;
        case "ArrowRight": case "d": case "D": actions.moveRight(); break;
        case "ArrowDown": case "s": case "S": actions.softDrop(); break;
        case "ArrowUp": case "w": case "W": actions.rotate(); break;
        case " ": actions.hardDrop(); break;
        case "p": case "P": setUserPaused((p) => !p); break;
        case "r": case "R": actions.reset(); break;
      }
    };

    wrap.addEventListener("keydown", onKey);
    return () => {
      wrap.removeEventListener("keydown", onKey);
      clearKeyTimeout();
    };
  }, [startKeyTimeout, clearKeyTimeout, actions]);

  // 屏幕点击: awaitingClick → manual, 或 aiTakeover → 恢复手动
  const handleScreenClick = () => {
    if (mode === "awaitingClick") {
      setMode("manual");
      setAiTakeover(false);
      setUserPaused(false);
      wrapperRef.current?.focus();
      startKeyTimeout();
    } else if (mode === "manual" && aiTakeover) {
      setAiTakeover(false);
      wrapperRef.current?.focus();
      startKeyTimeout();
    }
  };

  // 左按钮: 开始游戏 / 暂停 / 继续
  const handleStartButton = () => {
    if (mode === "auto") {
      setMode("awaitingClick");
    } else if (mode === "awaitingClick") {
      // 取消，回到自动模式
      setMode("auto");
    } else if (mode === "manual") {
      if (!aiTakeover) {
        setUserPaused((p) => !p);
      }
    }
  };

  // 右按钮: 重置游戏
  const handleReset = () => {
    actions.reset();
    setUserPaused(false);
    if (mode === "manual") {
      startKeyTimeout();
    }
  };

  // 按钮文字
  const leftButtonText = mode === "auto"
    ? "开始游戏"
    : mode === "awaitingClick"
    ? "开始游戏"
    : userPaused
    ? "继续"
    : "暂停";

  const leftDisabled = mode === "awaitingClick" || (mode === "manual" && aiTakeover);

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <TetrisConsole>
        <div
          ref={wrapperRef}
          tabIndex={0}
          onClick={handleScreenClick}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: mode === "awaitingClick" || (mode === "manual" && aiTakeover) ? "pointer" : "default",
            outline: "none",
          }}
        >
          <canvas ref={canvasRef} style={{ imageRendering: "pixelated" }} />
        </div>
      </TetrisConsole>
      </div>

      {/* 按钮区域 */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", width: "100%", flexShrink: 0, paddingBottom: 4 }}>
        <button
          onClick={handleStartButton}
          disabled={leftDisabled}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            flex: 1,
            padding: "8px 16px",
            border: "none",
            borderRadius: 20,
            background: leftDisabled
              ? "linear-gradient(180deg, #2a4a6a, #1a3a5a)"
              : "linear-gradient(180deg, #3a7ec5, #1a4e8a)",
            color: "#e0e0e0",
            fontSize: 12,
            fontFamily: "monospace",
            fontWeight: "bold",
            letterSpacing: 1,
            cursor: leftDisabled ? "not-allowed" : "pointer",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 4px rgba(0,0,0,0.3)",
            opacity: leftDisabled ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {leftButtonText}
        </button>
        <button
          onClick={handleReset}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            flex: 1,
            padding: "8px 16px",
            border: "none",
            borderRadius: 20,
            background: "linear-gradient(180deg, #e8b820, #b88810)",
            color: "#1a1a1a",
            fontSize: 12,
            fontFamily: "monospace",
            fontWeight: "bold",
            letterSpacing: 1,
            cursor: "pointer",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          重置游戏
        </button>
      </div>
    </div>
  );
}

/** Draw next piece preview in 4x4 grid */
function drawNextPiece(ctx: CanvasRenderingContext2D, type: PieceType, x: number, y: number, cell: number) {
  const shapes: Record<PieceType, number[][]> = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]],
  };
  const shape = shapes[type];
  const color = pieceColor(type);
  const gridW = 4 * cell;
  const shapeW = shape[0].length * cell;
  const shapeH = shape.length * cell;
  const ox = x + (gridW - shapeW) / 2;
  const oy = y + (gridW - shapeH) / 2;
  ctx.fillStyle = "rgba(15, 56, 15, 0.08)";
  ctx.fillRect(x, y, gridW, gridW);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const cx = ox + c * cell;
      const cy = oy + r * cell;
      ctx.fillStyle = color;
      ctx.fillRect(cx, cy, cell, cell);
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(cx, cy, cell, Math.max(1, cell * 0.15));
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(cx, cy + cell - Math.max(1, cell * 0.15), cell, Math.max(1, cell * 0.15));
    }
  }
}
