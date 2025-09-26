"use client";

import { ThemeLogo } from "@/components/ThemeLogo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  FolderOpen,
  HelpCircle,
  Home,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardNavbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const mockAuth = localStorage.getItem("cognito-auth");
    setIsAuthenticated(mockAuth === "true");
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("cognito-auth");
    window.location.href = "/";
  };

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Cases", href: "/cases", icon: FolderOpen },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  return (
    <nav className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="flex h-full items-center justify-between px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <ThemeLogo />
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              cognito.ai
            </span>
          </Link>
        </div>

        {/* Centered Navigation Items */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.name === "Cases" && pathname.startsWith("/cases"));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <User className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  Shivansh
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg z-50"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Shivansh
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  shivansh@example.com
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
