"use client";

import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import StatsGrid from "@/components/dashboard/StatsGrid";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import DashboardNavbar from "@/components/DashboardNavbar";
import Footer from "@/components/Footer";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const mockAuth =
      typeof window !== "undefined" && localStorage.getItem("cognito-auth");
    setAuthed(mockAuth === "true");
  }, []);

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {authed ? (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <div className="flex min-h-screen flex-col">
            <DashboardNavbar />
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="space-y-8">
                  <WelcomeSection />
                  <StatsGrid />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <QuickActions />
                    <RecentActivity />
                  </div>
                </div>
              </div>
            </main>
            <Footer />
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Hero />
            <HowItWorks />
          </main>
          <Footer />
        </div>
      )}
    </div>
  );
}
