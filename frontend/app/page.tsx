"use client";

import CasesHome from "@/components/cases/CasesHome";
import DashboardNavbar from "@/components/DashboardNavbar";
import Footer from "@/components/Footer";
import CTASection from "@/components/landing/CTASection";
import FAQ from "@/components/landing/FAQ";
import Features from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
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
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardNavbar />
            <main className="flex-1 overflow-y-auto">
              <CasesHome />
            </main>
          </div>
        </div>
      ) : (
        <>
          <Navbar />
          <main>
            <Hero />
            <Features />
            <HowItWorks />
            <Testimonials />
            <FAQ />
            <CTASection />
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}
