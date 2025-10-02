"use client";

import AuthModal from "@/components/auth/AuthModal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { clearUser, setUser } from "@/lib/user";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem("cognito-auth");
      setIsAuthenticated(authStatus === "true");
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleSignIn = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (userData: {
    username: string;
    email: string;
    role: string;
  }) => {
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setUser({
      name: userData.username,
      email: userData.email,
      role: userData.role,
    });
    window.location.reload();
  };

  const handleSignOut = () => {
    clearUser();
    setIsAuthenticated(false);
    toast.success("Signed out successfully", {
      description: "You have been logged out",
    });
    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <nav className="relative z-30 flex items-center justify-between p-4">
        <div className="flex flex-1 items-center justify-start">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-sm p-2 text-[#2A2A2A] dark:text-[#E0E0E0] duration-200 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
          >
            <span className="text-md font-medium">cognito.ai</span>
          </Link>
        </div>
        <div className="h-8 w-8 animate-pulse rounded bg-[#E0E0E0] dark:bg-[#2A2A2A]"></div>
      </nav>
    );
  }

  return (
    <nav className="relative z-30 flex items-center justify-between p-6 bg-[#FEFEFE] dark:bg-[#1A1A1A]">
      <div className="flex flex-1 items-center justify-start">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-sm p-2 text-[#2A2A2A] dark:text-[#E0E0E0]"
        >
          <span className="text-lg font-medium">cognito.ai</span>
        </Link>
      </div>

      <div className="flex flex-1 justify-end items-center gap-2">
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2 text-[#4A4A4A] dark:text-[#B0B0B0]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          ) : (
            <Button
              onClick={handleSignIn}
              size="sm"
              className="bg-[#2A2A2A] text-white dark:bg-[#E0E0E0] dark:text-[#2A2A2A] hover:bg-[#2A2A2A] hover:text-white dark:hover:bg-[#E0E0E0] dark:hover:text-[#2A2A2A] px-6 py-2 rounded-lg font-medium"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </nav>
  );
}
