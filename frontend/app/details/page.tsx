"use client";

import { Home, Github } from "lucide-react";

export default function DetailsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="flex justify-between items-center pt-8 pb-4 px-8">
        <div className="flex-1 flex justify-start">
          <a
            href="/"
            className="text-slate-700 hover:text-slate-900 transition-colors duration-200"
          >
            <Home className="h-6 w-6" />
          </a>
        </div>
        <div className="flex space-x-8">
          <a
            href="/details"
            className="text-slate-600 hover:text-slate-900 transition-colors duration-300 font-medium"
          >
            How it works
          </a>
          <a
            href="/team"
            className="text-slate-600 hover:text-slate-900 transition-colors duration-300 font-medium"
          >
            Team
          </a>
        </div>
        <div className="flex-1 flex justify-end">
          <a
            href="https://github.com/areebahmeddd/cognito.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-700 hover:text-slate-900 transition-colors duration-200"
          >
            <Github className="h-6 w-6" />
          </a>
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            How it works
          </h1>
          <p className="text-slate-600 text-lg">This page is coming soon...</p>
        </div>
      </main>
    </div>
  );
}
