"use client";

import DashboardNavbar from "@/components/DashboardNavbar";
import Footer from "@/components/Footer";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="flex min-h-screen flex-col">
        <DashboardNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Analytics
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
              Coming Soon
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
