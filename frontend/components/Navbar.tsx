import { MobileNav } from "@/components/MobileNav";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeLogo } from "@/components/ThemeLogo";
import { Github } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="relative z-30 flex items-center justify-between p-4">
      <div className="flex flex-1 items-center justify-start gap-1">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-sm p-2 text-slate-700 transition-colors duration-200 hover:bg-gray-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-gray-700 dark:hover:text-slate-100"
        >
          <ThemeLogo />
          <span className="text-md font-medium">cognito.ai</span>
        </Link>
        <a
          href="https://github.com/areebahmeddd/cognito.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm p-2 text-slate-500 transition-colors duration-200 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-gray-700 dark:hover:text-slate-100"
        >
          <Github className="h-4 w-4" />
        </a>
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
      <div className="hidden md:flex space-x-8">
        <Link
          href="/how-it-works"
          className="group relative font-medium text-slate-600 transition-colors duration-300 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          How it works
          <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-slate-900 transition-all duration-300 group-hover:w-full dark:bg-slate-100"></span>
        </Link>
        <Link
          href="/how-to-use"
          className="group relative font-medium text-slate-600 transition-colors duration-300 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          How to use
          <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-slate-900 transition-all duration-300 group-hover:w-full dark:bg-slate-100"></span>
        </Link>
      </div>
      <div className="flex flex-1 justify-end items-center space-x-2">
        <ThemeToggle />
      </div>
    </nav>
  );
}
