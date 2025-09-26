"use client";

import CasesHome from "@/components/cases/CasesHome";
import DashboardNavbar from "@/components/DashboardNavbar";
import Footer from "@/components/Footer";

export default function CasesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardNavbar />
          <main className="flex-1 overflow-y-auto">
            <CasesHome />
          </main>
        </div>
      </div>
    </div>
  );
}
