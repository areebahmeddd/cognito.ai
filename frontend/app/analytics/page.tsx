"use client";

import DashboardNavbar from "@/components/DashboardNavbar";
// import Footer from "@/components/Footer";
import { useEffect } from "react";

export default function AnalyticsPage() {
  useEffect(() => {
    document.title = "Cognito AI - Analytics";
  }, []);
  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0F0F0F]">
      <div className="flex min-h-screen flex-col">
        <DashboardNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#FF7F50]/20 dark:border-[#FF7F50]/30">
              <svg
                className="w-10 h-10 text-[#FF7F50]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-light tracking-tight text-[#2A2A2A] dark:text-[#E0E0E0] mb-4">
              <span className="text-[#FF7F50]">Analytics</span>
            </h1>
            <p className="text-[#4A4A4A] dark:text-[#B0B0B0] font-light">
              Coming Soon
            </p>
          </div>
        </main>
        {/* <Footer /> */}
      </div>
    </div>
  );
}
