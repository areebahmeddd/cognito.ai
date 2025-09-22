"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ThemeLogoProps {
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
}

export function ThemeLogo({
  width = 32,
  height = 32,
  className = "h-5 w-5",
  alt = "logo",
}: ThemeLogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Image
      src={mounted && theme === "dark" ? "/logo_dark.png" : "/logo.png"}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}
