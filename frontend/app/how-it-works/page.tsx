"use client";

import { Home, Github, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DetailsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
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

      <main className="flex flex-1 flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-2xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            How it works
          </h1>
          <p className="text-slate-600 text-lg">This page is coming soon...</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
