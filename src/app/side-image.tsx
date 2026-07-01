"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface SideImageProps {
  lightSrc: string;
  darkSrc: string;
  side: "left" | "right";
}

export function SideImage({ lightSrc, darkSrc, side }: SideImageProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const src = mounted && theme === "light" ? lightSrc : darkSrc;

  return (
    <img
      src={src}
      alt=""
      className="w-full"
      style={{
        position: 'sticky',
        top: '3.5rem',
        height: 'calc(100vh - 3.5rem)',
        objectFit: 'cover',
        objectPosition: side === "left" ? 'left center' : 'right center',
      }}
    />
  );
}
