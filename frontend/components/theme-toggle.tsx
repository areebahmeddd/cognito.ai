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
        variant="ghost"
        className="h-8 w-8 rounded-sm p-0 transition-colors duration-200 hover:bg-gray-200 hover:text-slate-900"
        aria-label="Toggle theme"
      >
        <Sun className="h-8 w-8 text-slate-500" />
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      variant="ghost"
      className="h-8 w-8 rounded-sm p-0 transition-colors duration-200 hover:bg-gray-200 hover:text-slate-900 dark:hover:bg-gray-700 dark:hover:text-slate-100"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Sun className="h-8 w-8 text-slate-500 dark:text-slate-400" />
      ) : (
        <Moon className="h-8 w-8 text-slate-500 dark:text-slate-400" />
      )}
    </Button>
  );
}
