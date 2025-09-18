"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Upload, Heart, Github } from "lucide-react";

export default function HomePage() {
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="flex justify-between items-center pt-8 pb-4 px-8">
        <div className="flex-1"></div>
        <div className="flex space-x-8">
          <a
            href="#"
            className="text-slate-600 hover:text-slate-900 transition-colors duration-300 font-medium"
          >
            How it works
          </a>
          <a
            href="#"
            className="text-slate-600 hover:text-slate-900 transition-colors duration-300 font-medium"
          >
            Team
          </a>
        </div>
        <div className="flex-1 flex justify-end">
          <a
            href="#"
            className="text-slate-700 hover:text-slate-900 transition-colors duration-200"
          >
            <Github className="h-6 w-6" />
          </a>
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 text-balance">
            Welcome, How may I help you?
          </h1>
        </div>

        <div className="w-full max-w-2xl mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Ask me anything about your UFDR data..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full h-12 text-base bg-transparent border-0 focus:ring-0 placeholder:text-slate-400 pr-20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-slate-100 transition-colors duration-200"
                >
                  <Mic className="h-4 w-4 text-slate-500" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-slate-100 transition-colors duration-200"
                >
                  <Upload className="h-4 w-4 text-slate-500" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center pb-8">
        <p className="text-slate-600 flex items-center justify-center gap-2">
          Built with <Heart className="h-4 w-4 text-red-500 fill-current" /> for
          Smart India Hackathon
        </p>
      </footer>
    </div>
  );
}
