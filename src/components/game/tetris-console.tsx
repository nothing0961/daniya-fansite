"use client";

import type { ReactNode } from "react";

/**
 * TetrisConsole — Game Boy DMG 复古掌机外壳（竖放）
 * · 深灰塑料外壳 + 圆角 + 4 角螺丝
 * · 屏幕内凹（深色边框 + 内阴影）
 * · 屏幕下方品牌文字 + 扬声器斜纹
 * · SELECT / START 按钮
 * · 十字方向键 + A/B 红色蓝色圆形按钮
 * · 容器 10:16 比例（竖长方形，契合侧边图）
 * · 通过 children 接收 Canvas 内容
 */
export function TetrisConsole({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="gb-shell"
        style={{
          position: "relative",
          width: "100%",
          maxHeight: "100%",
          aspectRatio: "10 / 16",
          background: "linear-gradient(180deg, #4f4f4f 0%, #3a3a3a 100%)",
          borderRadius: "16px 16px 40px 16px / 16px 16px 60px 16px",
          boxShadow:
            "inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -4px 0 rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.35)",
          padding: "10% 8% 10%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 4 Corner screws */}
        <Screw style={{ top: "3%", left: "3%" }} />
        <Screw style={{ top: "3%", right: "3%" }} />
        <Screw style={{ bottom: "3%", left: "3%" }} />
        <Screw style={{ bottom: "3%", right: "3%" }} />

        {/* Screen bezel (inner recess) */}
        <div
          style={{
            background: "linear-gradient(180deg, #2e2e2e, #1f1f1f)",
            borderRadius: 10,
            padding: "6% 7% 10%",
            boxShadow:
              "inset 0 3px 6px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.05)",
            position: "relative",
          }}
        >
          {/* Top brand dot + label */}
          <div
            style={{
              position: "absolute",
              top: -2,
              left: "50%",
              transform: "translateX(-50%)",
              color: "#b0b0b0",
              fontSize: 9,
              letterSpacing: 1,
              fontFamily: "monospace",
              opacity: 0.7,
            }}
          >
            
          </div>
          {/* Power LED */}
          <div
            style={{
              position: "absolute",
              left: "3%",
              top: "14%",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "radial-gradient(circle, #ff4d4d 0%, #a00 100%)",
              boxShadow: "0 0 4px rgba(255, 80, 80, 0.7)",
            }}
            title="POWER"
          />
          {/* Game screen */}
          <div
            style={{
              width: "100%",
              aspectRatio: "10 / 13.6",
              background: "#9bbc0f",
              borderRadius: 6,
              boxShadow:
                "inset 0 2px 8px rgba(0,0,0,0.4), inset 0 0 0 2px rgba(0,0,0,0.35)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {children}
          </div>
          {/* Brand under screen */}
          <div
            style={{
              textAlign: "center",
              marginTop: 6,
              color: "#b0b0b0",
              fontSize: 10,
              fontStyle: "italic",
              fontFamily: "Georgia, serif",
              letterSpacing: 1,
            }}
          >
            
          </div>
        </div>

        {/* Speaker grill (right-side diagonal lines) */}
        <div
          style={{
            position: "absolute",
            right: "8%",
            bottom: "7%",
            width: 50,
            height: 50,
            pointerEvents: "none",
          }}
          aria-hidden
        >
          <svg width="100%" height="100%" viewBox="0 0 50 50" fill="none">
            {Array.from({ length: 7 }).map((_, i) => (
              <line
                key={i}
                x1={8 + i * 6}
                y1={2}
                x2={48}
                y2={42 - i * 6}
                stroke="rgba(0,0,0,0.35)"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            ))}
          </svg>
        </div>

        {/* Middle: SELECT / START */}
        <div
          style={{
            marginTop: "6%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 18,
          }}
        >
          <SelectStart label="SELECT" />
          <SelectStart label="START" />
        </div>

        {/* Controls row: D-pad (left) + A/B buttons (right) */}
        <div
          style={{
            marginTop: "8%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 4%",
          }}
        >
          {/* D-Pad */}
          <DPad />
          {/* A/B (diagonal like real Game Boy) */}
          <div
            style={{
              position: "relative",
              width: 96,
              height: 64,
            }}
          >
            <ABButton label="B" color="#7a2030" style={{ top: 16, left: 0 }} />
            <ABButton label="A" color="#2a4e7c" style={{ top: 0, right: 0 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Screw({ style }: { style: React.CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 30% 30%, #7a7a7a, #2a2a2a)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.3), 0 0 0 1px rgba(0,0,0,0.5)",
        ...style,
      }}
      aria-hidden
    >
      <div
        style={{
          position: "absolute",
          inset: "35% 20% 35% 20%",
          background: "rgba(0,0,0,0.85)",
          borderRadius: 1,
        }}
      />
    </div>
  );
}

function SelectStart({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        transform: "rotate(-20deg)",
      }}
      title={label}
    >
      <div
        style={{
          width: 38,
          height: 9,
          borderRadius: 10,
          background:
            "linear-gradient(180deg, #1a1a1a, #3a3a3a)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 0 rgba(255,255,255,0.08)",
        }}
      />
      <span
        style={{
          color: "#c0c0c0",
          fontSize: 10,
          fontFamily: "monospace",
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function DPad() {
  const arm = 24;
  const cap = 18;
  return (
    <div
      style={{
        position: "relative",
        width: arm * 2 + cap,
        height: arm * 2 + cap,
      }}
      title="方向键 (键盘 ←→↑↓ / 空格硬降)"
    >
      {/* vertical bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: arm,
          width: cap,
          height: arm * 2 + cap,
          background: "linear-gradient(180deg, #222 0%, #111 100%)",
          borderRadius: 4,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.6), 0 2px 2px rgba(0,0,0,0.5)",
        }}
      />
      {/* horizontal bar */}
      <div
        style={{
          position: "absolute",
          top: arm,
          left: 0,
          width: arm * 2 + cap,
          height: cap,
          background: "linear-gradient(180deg, #222 0%, #111 100%)",
          borderRadius: 4,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.6), 0 2px 2px rgba(0,0,0,0.5)",
        }}
      />
      {/* center circle */}
      <div
        style={{
          position: "absolute",
          top: arm + cap / 2 - 4,
          left: arm + cap / 2 - 4,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "radial-gradient(circle, #333, #000)",
        }}
      />
      {/* Arrows */}
      <Arrow dir="up" style={{ top: 3, left: arm + 3 }} />
      <Arrow dir="down" style={{ bottom: 3, left: arm + 3 }} />
      <Arrow dir="left" style={{ top: arm + 3, left: 3 }} />
      <Arrow dir="right" style={{ top: arm + 3, right: 3 }} />
    </div>
  );
}

function Arrow({
  dir,
  style,
}: {
  dir: "up" | "down" | "left" | "right";
  style: React.CSSProperties;
}) {
  const rot: Record<string, number> = { up: 0, right: 90, down: 180, left: 270 };
  return (
    <div
      style={{
        position: "absolute",
        width: 13,
        height: 13,
        color: "#555",
        transform: `rotate(${rot[dir]}deg)`,
        ...style,
      }}
      aria-hidden
    >
      <svg viewBox="0 0 10 10" width="13" height="13" fill="currentColor">
        <path d="M5 1 L9 7 L7 7 L7 9 L3 9 L3 7 L1 7 Z" />
      </svg>
    </div>
  );
}

function ABButton({
  label,
  color,
  style,
}: {
  label: "A" | "B";
  color: string;
  style: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: `radial-gradient(circle at 30% 30%, ${lighten(color, 0.3)}, ${color} 55%, ${darken(color, 0.25)})`,
        boxShadow:
          "inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.3), 0 3px 4px rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fafafa",
        fontWeight: 800,
        fontFamily: "monospace",
        fontSize: 18,
        textShadow: "0 1px 0 rgba(0,0,0,0.4)",
        ...style,
      }}
      title={label}
    >
      {label}
    </div>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number) {
  const to = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}
function lighten(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}
function darken(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amt), g * (1 - amt), b * (1 - amt));
}
