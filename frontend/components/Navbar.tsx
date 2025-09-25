"use client";

import { MobileNav } from "@/components/MobileNav";
import { ThemeLogo } from "@/components/ThemeLogo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Github, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock authentication check
    const checkAuth = () => {
      const mockAuth = localStorage.getItem("cognito-auth");
      setIsAuthenticated(mockAuth === "true");
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleSignIn = () => {
    // Mock sign in
    localStorage.setItem("cognito-auth", "true");
    setIsAuthenticated(true);
    window.location.href = "/dashboard";
  };

  const handleSignOut = () => {
    // Mock sign out
    localStorage.removeItem("cognito-auth");
    setIsAuthenticated(false);
    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <nav className="relative z-30 flex items-center justify-between p-4">
        <div className="flex flex-1 items-center justify-start">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-sm p-2 text-slate-700 transition-colors duration-200 hover:bg-gray-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-gray-700 dark:hover:text-slate-100"
          >
            <ThemeLogo />
            <span className="text-md font-medium">cognito.ai</span>
          </Link>
        </div>
        <div className="h-8 w-8 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
      </nav>
    );
  }

  return (
    <nav className="relative z-30 flex items-center justify-between p-4">
      <div className="flex flex-1 items-center justify-start">
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="flex items-center gap-2 rounded-sm p-2 text-slate-700 transition-colors duration-200 hover:bg-gray-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-gray-700 dark:hover:text-slate-100"
        >
          <ThemeLogo />
          <span className="text-md font-medium">cognito.ai</span>
        </Link>
      </div>

      {!isAuthenticated && (
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
      )}

      <div className="flex flex-1 justify-end items-center gap-1">
        <div className="hidden md:flex items-center gap-2">
          <a
            href="https://github.com/areebahmeddd/cognito.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm p-2 text-slate-500 transition-colors duration-200 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-gray-700 dark:hover:text-slate-100"
          >
            <Github className="h-4 w-4" />
          </a>
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleSignIn}
              size="sm"
              className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Sign In
            </Button>
          )}
        </div>
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
