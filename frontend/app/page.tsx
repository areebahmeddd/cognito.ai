"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Upload, Heart, Github, Home } from "lucide-react";

export default function HomePage() {
  const [inputValue, setInputValue] = useState("");
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const animatedTexts = [
    "Search UFDR data with natural language queries",
    "Extract actionable insights from forensic reports instantly",
    "Find crypto addresses and foreign communications automatically",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentTextIndex(
          (prevIndex) => (prevIndex + 1) % animatedTexts.length
        );
        setIsVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, [animatedTexts.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="flex justify-between items-center pt-6 pb-3 px-6">
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

      <main className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 text-balance">
            Welcome, how may I help you?
          </h1>
          <div className="h-12 flex items-center justify-center">
            <p
              className={`text-lg text-slate-600 transition-all duration-300 ease-in-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              {animatedTexts[currentTextIndex]}
            </p>
          </div>
        </div>

        <div className="w-full max-w-2xl mx-auto mb-6">
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
      </main>

      <footer className="text-center pb-6">
        <p className="text-slate-600 flex items-center justify-center gap-2">
          Built with <Heart className="h-4 w-4 text-red-500 fill-current" /> for
          Smart India Hackathon
        </p>
      </footer>
    </div>
  );
}
