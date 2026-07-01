"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function HeroBanner() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const src =
    mounted && theme === "light"
      ? "/e7cfe70ccb796924fd9ab2346ad26c34456803242.gif"
      : "/c0a7746e-f2eb-431b-84d6-43e94422f39e.png";

  return (
    <img
      src={src}
      alt=""
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}
