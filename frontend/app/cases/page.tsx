"use client";

import CasesHome from "@/components/cases/CasesHome";
import DashboardNavbar from "@/components/DashboardNavbar";
import Footer from "@/components/Footer";

export default function CasesPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex min-h-screen flex-col">
        <DashboardNavbar />
        <main className="flex-1 bg-slate-50 dark:bg-slate-900">
          <CasesHome />
        </main>
        <Footer />
      </div>
    </div>
  );
}
