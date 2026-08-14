/**
 * CountUp — 数字滚动动画
 * 支持 "23,461" 这类带千分位字符串；非数字（如 ∞）直接静态渲染
 * 进入视口时从 0 滚动到目标值
 */
"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, animate } from "framer-motion";

interface CountUpProps {
  value: string;
  className?: string;
}

export function CountUp({ value, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const numeric = /^[\d,]+$/.test(value);
  const target = Number(value.replace(/,/g, ""));
  const valid = numeric && !Number.isNaN(target);
  const motionValue = useMotionValue(0);

  useEffect(() => {
    if (!inView || !valid) return;
    const controls = animate(motionValue, target, { duration: 1.2, ease: "easeOut" });
    const unsubscribe = motionValue.on("change", (v) => {
      if (ref.current) ref.current.textContent = Math.round(v).toLocaleString("en-US");
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [inView, valid, target, motionValue]);

  return (
    <span ref={ref} className={className}>
      {valid ? "0" : value}
    </span>
  );
}
