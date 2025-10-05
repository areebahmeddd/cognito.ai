"use client";

import AuthModal from "@/components/auth/AuthModal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleSignIn = () => {
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (status === "loading") {
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

          {session ? (
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
      />
    </nav>
  );
}
