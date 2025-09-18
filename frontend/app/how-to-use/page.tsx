"use client";

import { Home, Github, Heart } from "lucide-react";

export default function HowToUsePage() {
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
      <nav className="flex justify-between items-center pt-6 pb-3 px-6 relative z-10">
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
            href="/how-it-works"
            className="text-slate-600 hover:text-slate-900 transition-colors duration-300 font-medium relative group"
          >
            How it works
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a
            href="/how-to-use"
            className="text-slate-600 hover:text-slate-900 transition-colors duration-300 font-medium relative group"
          >
            How to use
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 transition-all duration-300 group-hover:w-full"></span>
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

      <main className="flex flex-1 flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-2xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            How to use
          </h1>
          <p className="text-slate-600 text-lg">
            Step-by-step guide to using Cognito AI...
          </p>
        </div>
      </main>

      <footer className="text-center pb-4 mt-auto pt-4 relative z-10">
        <p className="text-slate-600 flex items-center justify-center gap-2">
          Built with <Heart className="h-4 w-4 text-red-500 fill-current" /> for
          Smart India Hackathon
        </p>
      </footer>
    </div>
  );
}
