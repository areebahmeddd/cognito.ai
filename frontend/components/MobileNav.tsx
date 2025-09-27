"use client";

import { Github, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className="rounded-sm p-2 text-[#666] dark:text-[#999] transition-colors duration-200 hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A]"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="top" className="p-0">
        <nav className="flex flex-col gap-1 p-4">
          <SheetClose asChild>
            <Link
              href="/how-it-works"
              className="rounded-sm px-3 py-2 text-[#2A2A2A] dark:text-[#E0E0E0] transition-colors duration-200 hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A]"
            >
              How it works
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/how-to-use"
              className="rounded-sm px-3 py-2 text-[#2A2A2A] dark:text-[#E0E0E0] transition-colors duration-200 hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A]"
            >
              How to use
            </Link>
          </SheetClose>
          <a
            href="https://github.com/areebahmeddd/cognito.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm px-3 py-2 text-slate-700 transition-colors duration-200 hover:bg-gray-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-gray-800 dark:hover:text-slate-100"
          >
            <span className="inline-flex items-center gap-2">
              <Github className="h-4 w-4" /> GitHub
            </span>
          </a>
          <div className="mt-2 px-3">
            <ThemeToggle />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
