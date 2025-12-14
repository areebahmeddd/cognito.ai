"use client";

import CasesHome from "@/components/cases/CasesHome";
import DashboardNavbar from "@/components/DashboardNavbar";
// import Footer from "@/components/Footer";
import { useEffect } from "react";

export default function CasesPage() {
  useEffect(() => {
    document.title = "Cognito AI - Cases Dashboard";
  }, []);
  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0F0F0F]">
      <div className="flex min-h-screen flex-col">
        <DashboardNavbar />
        <main className="flex-1 bg-[#F8F8F8] dark:bg-[#0F0F0F]">
          <CasesHome />
        </main>
        {/* <Footer /> */}
      </div>
    </div>
  );
}
