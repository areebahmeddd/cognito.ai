"use client";

import AuthModal from "@/components/auth/AuthModal";
import CreateCaseModal from "@/components/cases/CreateCaseModal";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import StatsGrid from "@/components/dashboard/StatsGrid";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import DashboardNavbar from "@/components/DashboardNavbar";
// import Footer from "@/components/Footer";
import Features from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    document.title = session
      ? "Cognito AI - Home"
      : "Cognito AI - Natural Language Forensic Evidence Discovery";
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] dark:bg-[#0F0F0F]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E0E0E0] border-t-[#FF7F50]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0F0F0F]">
      {session ? (
        <div className="flex min-h-screen flex-col">
          <DashboardNavbar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-4 py-8">
              <div className="space-y-8">
                <WelcomeSection />
                <StatsGrid />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <QuickActions
                    onCreateCase={() => setIsCreateModalOpen(true)}
                  />
                  <RecentActivity />
                </div>
              </div>
            </div>
          </main>
          {/* <Footer /> */}
          <CreateCaseModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={(caseData) => {
              setIsCreateModalOpen(false);
            }}
          />
        </div>
      ) : (
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Hero onSignIn={() => setIsAuthModalOpen(true)} />
            <Features />
            <HowItWorks />
          </main>
          {/* <Footer /> */}
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
