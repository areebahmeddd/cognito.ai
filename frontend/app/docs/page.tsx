"use client";

import DashboardNavbar from "@/components/DashboardNavbar";
// import Footer from "@/components/Footer";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function DocsPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    document.title = "Cognito AI - Documentation";
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/";
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] dark:bg-[#0F0F0F]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E0E0E0] border-t-[#FF7F50]"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0F0F0F] flex flex-col">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-light tracking-tight text-[#2A2A2A] dark:text-[#E0E0E0] mb-4">
            <span className="text-[#FF7F50]">Documentation</span>
          </h1>
          <p className="text-[#4A4A4A] dark:text-[#B0B0B0] font-light">
            Coming Soon
          </p>
        </div>
      </main>
      {/* <Footer /> */}
    </div>
  );
}
