/**
 * EchoRotator — 语音回声轮播
 * 台词气泡逐条淡入淡出（4s 间隔），底部指示点可点击跳转，hover 暂停
 * 容器固定高度（取最长台词），轮播不引起左栏跳动
 */
"use client";

import { useEffect, useState } from "react";
import type { EchoQuote } from "@/lib/home-mock-data";

interface EchoRotatorProps {
  quotes: EchoQuote[];
}

const INTERVAL_MS = 4000;

export function EchoRotator({ quotes }: EchoRotatorProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || quotes.length < 2) return;
    const timer = setTimeout(() => {
      setIndex((i) => (i + 1) % quotes.length);
    }, INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [paused, index, quotes.length]);

  return (
    <div
      className="hp-echo-rotator"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hp-echo-stage">
        {quotes.map((quote, i) => (
          <div
            key={quote.id}
            className={`hp-quote-bubble hp-quote-bubble--left ${
              i === index ? "hp-quote--active" : ""
            }`}
            aria-hidden={i !== index}
          >
            <p className="hp-quote-text">{quote.text}</p>
            <span className="hp-quote-src">—— {quote.source}</span>
          </div>
        ))}
      </div>

      <div className="hp-echo-dots">
        {quotes.map((quote, i) => (
          <button
            key={quote.id}
            className={`hp-echo-dot ${i === index ? "hp-echo-dot--active" : ""}`}
            onClick={() => setIndex(i)}
            aria-label={`台词 ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
