"use client";

import AuthModal from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FileSpreadsheet,
  Github,
  Play,
  Youtube,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Hero() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const titleWords = ["Welcome to", "a faster", "forensic analysis"];

  const messages = [
    "Beautifully designed, privacy-focused, and packed with features. We care about your analysis, not your data.",
    "Search UFDR data with natural language queries. Extract actionable insights from forensic reports instantly.",
    "Process mobile device forensics at unprecedented speed. Uncover hidden connections in communication patterns.",
    "Navigate through terabytes of evidence effortlessly. Find the needle in the digital haystack with precision.",
    "Decode encrypted messages and deleted files. Recover critical evidence that others might miss.",
    "Generate comprehensive forensic reports automatically. Present findings in court-ready documentation.",
    "Collaborate with your team in real-time analysis. Share insights and build stronger cases together.",
    "Comply with legal standards and chain of custody. Maintain integrity throughout the investigation process.",
    "Scale from single devices to enterprise networks. Handle cases of any size with confidence.",
    "Integrate with existing forensic tools seamlessly. Enhance your current workflow without disruption.",
  ];

  const handleSignIn = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (userData: { username: string; email: string }) => {
    setIsSignedIn(true);
    setIsAuthModalOpen(false);
    window.location.reload();
  };

  useEffect(() => {
    const loadingInterval = setInterval(() => {
      setCurrentWordIndex((prev) => {
        if (prev < titleWords.length - 1) {
          return prev + 1;
        } else {
          setTimeout(() => {
            setLoadingComplete(true);
          }, 600);
          clearInterval(loadingInterval);
          return prev;
        }
      });
    }, 800);

    return () => clearInterval(loadingInterval);
  }, [titleWords.length]);

  useEffect(() => {
    if (!loadingComplete) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [messages.length, loadingComplete]);

  return (
    <section className="relative bg-[#FEFEFE] dark:bg-[#1A1A1A] min-h-screen flex items-center">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-32">
        <div className="text-center">
          <h1 className="text-6xl lg:text-8xl font-light tracking-tight text-[#2A2A2A] dark:text-[#E0E0E0] leading-tight">
            {titleWords.map((word, index) => (
              <span
                key={index}
                className={`block transition-all duration-500 ease-out ${
                  index <= currentWordIndex
                    ? "opacity-100 transform translate-y-0"
                    : "opacity-0 transform translate-y-4"
                } ${index === 1 ? "italic text-[#FF7F50] font-normal" : ""}`}
                style={{
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                {word}
              </span>
            ))}
          </h1>

          <div className="mx-auto mt-8 max-w-2xl min-h-[4.5rem] flex items-center justify-center">
            {loadingComplete && (
              <p
                className={`text-lg text-[#4A4A4A] dark:text-[#B0B0B0] leading-relaxed font-light transition-opacity duration-1000 ease-in-out ${
                  isVisible ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  transitionDelay: "300ms",
                }}
              >
                {messages[currentMessageIndex]}
              </p>
            )}
          </div>

          {loadingComplete && (
            <div
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 transition-opacity duration-1000 ease-in-out opacity-100"
              style={{
                transitionDelay: "800ms",
              }}
            >
              <Button
                size="lg"
                onClick={handleSignIn}
                className="bg-[#2A2A2A] text-white hover:bg-[#1A1A1A] dark:bg-[#E0E0E0] dark:text-[#2A2A2A] dark:hover:bg-[#D0D0D0] transition-all duration-300 px-8 py-4 rounded-lg font-medium text-base"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() =>
                  window.open(
                    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    "_blank",
                  )
                }
                className="border-[#E0E0E0] text-[#4A4A4A] hover:bg-[#F5F5F5] dark:border-[#4A4A4A] dark:text-[#B0B0B0] dark:hover:bg-[#2A2A2A] transition-all duration-300 px-8 py-4 rounded-lg font-medium text-base"
              >
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </div>
          )}

          {loadingComplete && (
            <div
              className="mt-8 transition-opacity duration-1000 ease-in-out opacity-100"
              style={{
                transitionDelay: "1200ms",
              }}
            >
              <div className="flex items-center justify-center gap-6">
                <a
                  href="https://github.com/areebahmeddd/cognito.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-3 text-[#4A4A4A] dark:text-[#B0B0B0] hover:text-[#FF7F50] transition-colors"
                  title="GitHub Repository"
                >
                  <Github className="h-6 w-6" />
                </a>
                <a
                  href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-3 text-[#4A4A4A] dark:text-[#B0B0B0] hover:text-[#FF7F50] transition-colors"
                  title="YouTube Channel"
                >
                  <Youtube className="h-6 w-6" />
                </a>
                <a
                  href="https://docs.google.com/presentation/d/1n7_xvl8xx3r6QOR7TCP-oiH9NknoiszoKVyfP6TVlBM/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-3 text-[#4A4A4A] dark:text-[#B0B0B0] hover:text-[#FF7F50] transition-colors"
                  title="Project Presentation"
                >
                  <FileSpreadsheet className="h-6 w-6" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </section>
  );
}
