"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export interface Piece {
  type: PieceType;
  shape: number[][];
  x: number;
  y: number;
}

export const ROWS = 20;
export const COLS = 10;

const SHAPES: Record<PieceType, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};

const COLORS: Record<PieceType, string> = {
  I: "#2f6e3f",
  O: "#5c6d1f",
  T: "#3e7a2f",
  S: "#4a6b2a",
  Z: "#7a4e2f",
  J: "#2e5b7a",
  L: "#6b4e8a",
};

const TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

const SCORES = [0, 100, 300, 500, 800];
const LEVEL_LINES = 10;

function emptyBoard(): number[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function randomPiece(): Piece {
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  const shape = SHAPES[type].map((r) => [...r]);
  return {
    type,
    shape,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0,
  };
}

function rotate(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const out: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out[c][rows - 1 - r] = shape[r][c];
    }
  }
  return out;
}

function collides(board: number[][], piece: Piece, dx = 0, dy = 0, shape = piece.shape): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nr = piece.y + r + dy;
      const nc = piece.x + c + dx;
      if (nc < 0 || nc >= COLS || nr >= ROWS) return true;
      if (nr >= 0 && board[nr][nc]) return true;
    }
  }
  return false;
}

function merge(board: number[][], piece: Piece): number[][] {
  const next = board.map((r) => [...r]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const nr = piece.y + r;
        const nc = piece.x + c;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          next[nr][nc] = TYPES.indexOf(piece.type) + 1;
        }
      }
    }
  }
  return next;
}

function clearLines(board: number[][]): { board: number[][]; lines: number } {
  const kept = board.filter((row) => row.some((v) => v === 0));
  const lines = ROWS - kept.length;
  while (kept.length < ROWS) kept.unshift(Array(COLS).fill(0));
  return { board: kept, lines };
}

type CellColor = number;

export function cellColor(type: number): string {
  const t = TYPES[type - 1];
  return t ? COLORS[t] : "#0f380f";
}

export function pieceColor(t: PieceType): string {
  return COLORS[t];
}

function dropInterval(level: number): number {
  return Math.max(80, 800 - (level - 1) * 60);
}

export interface TetrisActions {
  moveLeft: () => void;
  moveRight: () => void;
  softDrop: () => void;
  hardDrop: () => void;
  rotate: () => void;
  reset: () => void;
  togglePause: () => void;
  setPaused: (p: boolean) => void;
}

export interface TetrisState {
  board: number[][];
  boardWithPiece: number[][];
  pieceType: PieceType | null;
  nextType: PieceType;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  paused: boolean;
  actions: TetrisActions;
  tick: () => void;
}

/** 检查从当前 piece 旋转一次是否可行（含 wall kick） */
function canRotateNow(board: number[][], piece: Piece): boolean {
  const newShape = rotate(piece.shape);
  const kicks = [0, -1, 1, -2, 2];
  return kicks.some((k) => !collides(board, piece, k, 0, newShape));
}

/**
 * Greedy heuristic AI — 每步重新评估，返回当前 piece 的最佳 {dx, rot}
 * 只考虑 rot=0 和 rot=1（多步旋转靠每步重新评估累积实现）
 * 旋转方案预先检查可行性，避免死循环
 * 评分 = +消行²×50 - 空洞×5 - 总高度×1.5 - 凹凸×1 - 最高列超额×3
 */
function aiBestMove(board: number[][], piece: Piece): { dx: number; rot: number } {
  let best = -Infinity;
  let bestMove = { dx: 0, rot: 0 };

  for (let rot = 0; rot <= 1; rot++) {
    let shape = piece.shape;
    for (let i = 0; i < rot; i++) shape = rotate(shape);

    // rot=1 时检查旋转是否可行，不可行则跳过此旋转方案
    if (rot === 1 && !canRotateNow(board, piece)) continue;

    for (let dx = -piece.x; dx < COLS - piece.x - shape[0].length + 1; dx++) {
      if (collides(board, piece, dx, 0, shape)) continue;
      let dy = 0;
      while (!collides(board, piece, dx, dy + 1, shape)) dy++;
      const ghost: Piece = { ...piece, shape, x: piece.x + dx, y: piece.y + dy };
      const merged = merge(board, ghost);
      const { board: cleared, lines: linesCleared } = clearLines(merged);

      const heights: number[] = Array(COLS).fill(0);
      let holes = 0;
      for (let c = 0; c < COLS; c++) {
        let found = false;
        for (let r = 0; r < ROWS; r++) {
          if (cleared[r][c]) {
            if (!found) heights[c] = ROWS - r;
            found = true;
          } else if (found) {
            holes++;
          }
        }
      }

      let bumps = 0;
      for (let c = 1; c < COLS; c++) bumps += Math.abs(heights[c] - heights[c - 1]);

      const agg = heights.reduce((a, b) => a + b, 0);
      const maxH = Math.max(...heights);

      const lineBonus = linesCleared * linesCleared * 50;
      const heightPenalty = Math.max(0, maxH - 12) * 3;

      const s = lineBonus - holes * 5 - agg * 1.5 - bumps * 1 - heightPenalty;
      if (s > best) {
        best = s;
        bestMove = { dx, rot };
      }
    }
  }
  return bestMove;
}

export function useTetris(autoPlay = true): TetrisState {
  const [board, setBoard] = useState<number[][]>(() => emptyBoard());
  const [current, setCurrent] = useState<Piece>(() => randomPiece());
  const [nextType, setNextType] = useState<PieceType>(() => randomPiece().type);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);

  const boardRef = useRef(board);
  const currentRef = useRef(current);
  const nextRef = useRef(nextType);
  const scoreRef = useRef(score);
  const linesRef = useRef(lines);
  const levelRef = useRef(level);
  const gameOverRef = useRef(gameOver);
  const pausedRef = useRef(paused);
  const autoPlayRef = useRef(autoPlay);
  // 安全网：跟踪 piece 连续未变化的步数，超过阈值强制下落
  const stuckRef = useRef(0);
  const lastPieceKeyRef = useRef("");

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => { nextRef.current = nextType; }, [nextType]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { linesRef.current = lines; }, [lines]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);

  const reset = useCallback(() => {
    setBoard(emptyBoard());
    setCurrent(randomPiece());
    setNextType(randomPiece().type);
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setPaused(false);
    stuckRef.current = 0;
    lastPieceKeyRef.current = "";
  }, []);

  const spawnNext = useCallback((prevBoard: number[][], landedPiece: Piece) => {
    const merged = merge(prevBoard, landedPiece);
    const { board: cleared, lines: clearedCount } = clearLines(merged);
    const newLines = linesRef.current + clearedCount;
    const newLevel = Math.floor(newLines / LEVEL_LINES) + 1;
    const newScore = scoreRef.current + SCORES[clearedCount] * levelRef.current;
    const np: Piece = { ...randomPiece(), type: nextRef.current, shape: SHAPES[nextRef.current].map((r) => [...r]) };
    np.x = Math.floor((COLS - np.shape[0].length) / 2);
    np.y = 0;
    if (collides(cleared, np)) {
      setBoard(cleared);
      setGameOver(true);
      return;
    }
    setBoard(cleared);
    setCurrent(np);
    setNextType(randomPiece().type);
    setScore(newScore);
    setLines(newLines);
    setLevel(newLevel);
  }, []);

  const stepDown = useCallback(() => {
    const p = currentRef.current;
    const b = boardRef.current;
    if (!collides(b, p, 0, 1)) {
      setCurrent({ ...p, y: p.y + 1 });
    } else {
      spawnNext(b, p);
    }
  }, [spawnNext]);

  const moveLeft = useCallback(() => {
    const p = currentRef.current;
    const b = boardRef.current;
    if (!collides(b, p, -1, 0)) setCurrent({ ...p, x: p.x - 1 });
  }, []);

  const moveRight = useCallback(() => {
    const p = currentRef.current;
    const b = boardRef.current;
    if (!collides(b, p, 1, 0)) setCurrent({ ...p, x: p.x + 1 });
  }, []);

  const softDrop = useCallback(() => {
    const p = currentRef.current;
    const b = boardRef.current;
    if (!collides(b, p, 0, 1)) {
      setCurrent({ ...p, y: p.y + 1 });
      setScore((s) => s + 1);
    } else {
      spawnNext(b, p);
    }
  }, [spawnNext]);

  const hardDrop = useCallback(() => {
    const p = currentRef.current;
    const b = boardRef.current;
    let dy = 0;
    while (!collides(b, p, 0, dy + 1)) dy++;
    setScore((s) => s + dy * 2);
    spawnNext(b, { ...p, y: p.y + dy });
  }, [spawnNext]);

  const rotatePiece = useCallback(() => {
    const p = currentRef.current;
    const newShape = rotate(p.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const k of kicks) {
      if (!collides(boardRef.current, p, k, 0, newShape)) {
        setCurrent({ ...p, shape: newShape, x: p.x + k });
        return;
      }
    }
  }, []);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  // 每步重新评估：基于当前实际状态计算最佳动作，执行一步
  // 安全网：连续 4 步 piece 未变化则强制下落，杜绝一切死循环
  const tick = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    if (autoPlayRef.current) {
      const p = currentRef.current;
      const b = boardRef.current;
      const key = `${p.x},${p.y},${p.shape.map((r) => r.join("")).join("|")}`;

      // 卡住检测
      if (key === lastPieceKeyRef.current) {
        stuckRef.current++;
      } else {
        stuckRef.current = 0;
        lastPieceKeyRef.current = key;
      }
      if (stuckRef.current >= 4) {
        stuckRef.current = 0;
        stepDown();
        return;
      }

      const move = aiBestMove(b, p);
      if (move.rot > 0) {
        rotatePiece();
        return;
      }
      if (move.dx < 0) {
        moveLeft();
        return;
      }
      if (move.dx > 0) {
        moveRight();
        return;
      }
      stepDown();
    } else {
      stepDown();
    }
  }, [rotatePiece, moveLeft, moveRight, stepDown]);

  useEffect(() => {
    if (gameOver && autoPlay) {
      const t = setTimeout(() => reset(), 1200);
      return () => clearTimeout(t);
    }
  }, [gameOver, autoPlay, reset]);

  // Build board with current piece overlaid for render
  const boardWithPiece = (() => {
    const b = board.map((r) => [...r]);
    const idx = TYPES.indexOf(current.type) + 1;
    for (let r = 0; r < current.shape.length; r++) {
      for (let c = 0; c < current.shape[r].length; c++) {
        if (current.shape[r][c]) {
          const nr = current.y + r;
          const nc = current.x + c;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            b[nr][nc] = idx;
          }
        }
      }
    }
    return b;
  })();

  const actions: TetrisActions = {
    moveLeft,
    moveRight,
    softDrop,
    hardDrop,
    rotate: rotatePiece,
    reset,
    togglePause,
    setPaused,
  };

  return {
    board,
    boardWithPiece,
    pieceType: current.type,
    nextType,
    score,
    level,
    lines,
    gameOver,
    paused,
    actions,
    tick,
  };
}

/** Return drop interval ms for RAF loop scheduling */
export { dropInterval };
