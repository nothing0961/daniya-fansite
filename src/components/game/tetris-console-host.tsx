"use client";

import { useEffect, useRef, useState } from "react";
import { TetrisGame } from "@/components/game/tetris-game";
import { SideImage } from "@/app/side-image";

/**
 * TetrisConsoleHost — 左侧 aside 容器：
 * · 宽度 = min(50vw - 336px, (100vh - 7.5rem) * 0.625) 等比自适应
 * · 容器实际宽度 < 240px 回退显示原图
 * · 否则渲染 Game Boy 外壳 + Canvas 俄罗斯方块
 */
export function TetrisConsoleHost() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [tooNarrow, setTooNarrow] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const check = () => {
      const w = el.getBoundingClientRect().width;
      setTooNarrow(w < 240);
    };
    check();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(check) : null;
    if (ro) ro.observe(el);
    window.addEventListener("resize", check);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="hidden md:block flex-shrink-0"
      style={{
        // 宽度 = min(撑满到信息流左边缘, 视口高度反推等比例宽度)
        width: "min(calc(50vw - 336px), calc((100vh - 7.5rem) * 0.625))",
        minWidth: 240,
        position: "sticky",
        top: "calc(3.5rem + 8px)",
        alignSelf: "flex-start",
        height: "calc(100vh - 3.5rem - 16px)",
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      {tooNarrow ? (
        <SideImage darkSrc="/hero-side-left.jpg" side="left" />
      ) : (
        <TetrisGame />
      )}
    </div>
  );
}
