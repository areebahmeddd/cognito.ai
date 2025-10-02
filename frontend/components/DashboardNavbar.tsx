"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearUser, getUser } from "@/lib/user";
import {
  FileSpreadsheet,
  Github,
  HelpCircle,
  LogOut,
  Settings,
  User,
  Youtube,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DashboardNavbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const authStatus = localStorage.getItem("cognito-auth");
    setIsAuthenticated(authStatus === "true");

    const userData = getUser();
    setUser(userData);
  }, []);

  const handleSignOut = () => {
    clearUser();
    setIsAuthenticated(false);
    toast.success("Signed out successfully", {
      description: "You have been logged out",
    });
    window.location.href = "/";
  };

  return (
    <nav className="relative z-30 bg-[#F8F8F8] dark:bg-[#0F0F0F]">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-sm p-2 text-[#2A2A2A] dark:text-[#E0E0E0] duration-200 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
          >
            <span className="text-lg font-medium">cognito.ai</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://docs.google.com/presentation/d/1n7_xvl8xx3r6QOR7TCP-oiH9NknoiszoKVyfP6TVlBM/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm p-2 text-[#4A4A4A] dark:text-[#B0B0B0] hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
            title="Project Presentation"
          >
            <FileSpreadsheet className="h-4 w-4" />
          </a>

          <a
            href="https://www.youtube.com/watch?v=nPmozZFyn9Q"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm p-2 text-[#4A4A4A] dark:text-[#B0B0B0] hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
            title="YouTube Channel"
          >
            <Youtube className="h-4 w-4" />
          </a>

          <a
            href="https://github.com/areebahmeddd/cognito.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm p-2 text-[#4A4A4A] dark:text-[#B0B0B0] hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-[#2A2A2A] dark:text-[#E0E0E0] focus:outline-none">
                <div className="h-8 w-8 rounded-full bg-[#FFF5F0] dark:bg-[#2A1A0F] flex items-center justify-center border border-[#FF7F50]/20 dark:border-[#FF7F50]/30">
                  {user?.name ? (
                    <span className="text-sm font-medium text-[#FF7F50]">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="h-4 w-4 text-[#FF7F50]" />
                  )}
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  {user?.name || "User"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white dark:bg-[#1A1A1A] border border-[#E0E0E0] dark:border-[#2A2A2A] shadow-lg z-50"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-[#4A4A4A] dark:text-[#B0B0B0]">
                  {user?.email || "No email"}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => (window.location.href = "/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => (window.location.href = "/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => (window.location.href = "/help")}
              >
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
