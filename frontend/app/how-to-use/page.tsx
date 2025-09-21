"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function HowToUsePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="absolute inset-0 z-0">
        <div className="particle-bg">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
          <div className="particle particle-6"></div>
        </div>
      </div>
      <Navbar />

      <main className="flex min-h-[70vh] flex-1 flex-col items-center justify-center px-4">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h1 className="mb-6 text-4xl font-bold text-slate-900 dark:text-slate-100 md:text-5xl">
            How to use
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Step-by-step guide to using Cognito AI...
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
