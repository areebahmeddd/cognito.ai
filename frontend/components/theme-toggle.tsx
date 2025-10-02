"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        size="lg"
        variant="link"
        className="h-8 w-8 rounded-sm p-0 text-[#4A4A4A] dark:text-[#B0B0B0] hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
        aria-label="Toggle theme"
      >
        <Sun className="h-8 w-8" />
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      variant="link"
      className="h-8 w-8 rounded-sm p-0 text-[#4A4A4A] dark:text-[#B0B0B0] hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Sun className="h-8 w-8" />
      ) : (
        <Moon className="h-8 w-8" />
      )}
    </Button>
  );
}
