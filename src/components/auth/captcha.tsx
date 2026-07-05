"use client";

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LEN = 4;

function randomCode(): string {
  let s = "";
  for (let i = 0; i < CODE_LEN; i++) {
    s += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return s;
}

export interface CaptchaHandle {
  refresh: () => void;
}

export const Captcha = forwardRef<CaptchaHandle, { onChange?: (code: string) => void }>(
  function Captcha({ onChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [code, setCode] = useState(randomCode);

    const draw = useCallback((text: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // 背景
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(0, 0, w, h);

      // 噪点
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(${Math.random() * 200},${Math.random() * 200},${Math.random() * 200},0.3)`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }

      // 干扰线
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(${Math.random() * 150},${Math.random() * 150},${Math.random() * 150},0.4)`;
        ctx.beginPath();
        ctx.moveTo(Math.random() * w, Math.random() * h);
        ctx.lineTo(Math.random() * w, Math.random() * h);
        ctx.stroke();
      }

      // 文字
      const fontSize = 22;
      ctx.font = `bold ${fontSize}px "Courier New", monospace`;
      ctx.textBaseline = "middle";

      for (let i = 0; i < text.length; i++) {
        const x = 12 + i * 24;
        const y = h / 2 + Math.random() * 6 - 3;
        const angle = (Math.random() - 0.5) * 0.4;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = `rgb(${Math.random() * 100},${Math.random() * 100},${Math.random() * 100})`;
        ctx.fillText(text[i], 0, 0);
        ctx.restore();
      }
    }, []);

    const refresh = useCallback(() => {
      const newCode = randomCode();
      setCode(newCode);
      onChange?.(newCode);
    }, [onChange]);

    useImperativeHandle(ref, () => ({ refresh }), [refresh]);

    useEffect(() => {
      draw(code);
    }, [code, draw]);

    useEffect(() => {
      onChange?.(code);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <canvas
        ref={canvasRef}
        width={110}
        height={38}
        className="rounded border border-[var(--border)] cursor-pointer select-none"
        onClick={refresh}
        title="点击刷新验证码"
      />
    );
  }
);
