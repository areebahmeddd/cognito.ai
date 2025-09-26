"use client";

import { ThemeLogo } from "@/components/ThemeLogo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Bell,
  FolderOpen,
  HelpCircle,
  Home,
  LogOut,
  Search,
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

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-1 ml-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.name === "Cases" && pathname.startsWith("/cases"));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  John Doe
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-slate-500">john@example.com</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-600 dark:text-red-400"
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
