"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  Mic,
  Upload,
  Heart,
  Github,
  Home,
  X,
  FileText,
  Send,
} from "lucide-react";

export default function HomePage() {
  const [inputValue, setInputValue] = useState("");
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(true);
  const [hasUploadedUFDR, setHasUploadedUFDR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const animatedTexts = [
    "Search UFDR data with natural language queries",
    "Extract actionable insights from forensic reports instantly",
    "Find crypto addresses and foreign communications automatically",
  ];

  useEffect(() => {
    if (showUploadModal) return;

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
  }, [animatedTexts.length, showUploadModal]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleModalFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setHasUploadedUFDR(true);
      setShowUploadModal(false);
    }
  };

  const handleModalUploadClick = () => {
    modalFileInputRef.current?.click();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (newFiles.length === 0) {
        setShowUploadModal(true);
        setHasUploadedUFDR(false);
      }
      return newFiles;
    });
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      window.location.href = "/dashboard";
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    const textarea = e.target;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = newHeight + "px";

    setIsExpanded(newHeight > 48);
  };

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
      <nav className="flex justify-between items-center pt-6 pb-3 px-6 relative z-30">
        <div className="flex-1 flex justify-start">
          <Link
            href="/"
            className="text-slate-700 hover:bg-gray-200 p-2 rounded-sm hover:text-slate-900 transition-colors duration-200"
          >
            <Home className="h-5 w-5" />
          </Link>
        </div>
        <div className="flex space-x-8">
          <Link
            href="/how-it-works"
            className="text-slate-600 hover:text-slate-900 transition-colors duration-300 font-medium relative group"
          >
            How it works
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="/how-to-use"
            className="text-slate-600 hover:text-slate-900 transition-colors duration-300 font-medium relative group"
          >
            How to use
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </div>
        <div className="flex-1 flex justify-end">
          <a
            href="https://github.com/areebahmeddd/cognito.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-700 hover:bg-gray-200 p-2 rounded-sm hover:text-slate-900 transition-colors duration-200"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </nav>

      <main className="flex flex-1 flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-2xl mx-auto mb-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 text-balance drop-shadow-sm">
            Welcome, how may I help you?
          </h1>
          {!showUploadModal && (
            <div className="h-12 flex items-center justify-center">
              <p
                className={`text-lg text-slate-600 transition-all duration-300 ease-in-out drop-shadow-sm ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                {animatedTexts[currentTextIndex]}
              </p>
            </div>
          )}
        </div>

        {!showUploadModal && (
          <div className="w-full max-w-2xl mx-auto mb-6 relative z-10">
            <div className="relative">
              <Textarea
                placeholder="Ask me anything about your UFDR data..."
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                className="w-full min-h-[48px] max-h-[200px] text-base rounded-2xl bg-white border-2 border-gray-400 focus:outline-none placeholder:text-slate-400 pr-16 pl-4 py-3 resize-none shadow-lg hover:shadow-xl transition-all duration-300"
                rows={1}
              />
              <div
                className={`absolute right-2 flex items-center space-x-2 ${
                  isExpanded ? "top-3" : "top-1/2 -translate-y-1/2"
                }`}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-sm hover:bg-slate-100 transition-colors duration-200"
                  onClick={handleUploadClick}
                  aria-label="Upload more files"
                >
                  <Upload className="h-4 w-4 text-slate-500" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-sm hover:bg-slate-100 transition-colors duration-200"
                >
                  <Mic className="h-4 w-4 text-slate-500" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-8 w-8 p-0 rounded-sm transition-colors duration-200 ${
                    inputValue.trim()
                      ? "bg-accent/80 text-white hover:bg-slate-800"
                      : "text-slate-300 bg-slate-100"
                  }`}
                  onClick={handleSubmit}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <input
          ref={modalFileInputRef}
          type="file"
          multiple
          onChange={handleModalFileUpload}
          className="hidden"
          accept=".ufdr"
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.json,.xml,.csv,.log,.pcap,.zip,.rar,.7z"
        />

        {!showUploadModal && uploadedFiles.length > 0 && (
          <div className="w-full max-w-2xl mx-auto mt-4 space-y-2 relative z-10">
            <p className="text-sm text-slate-600 font-medium">
              Uploaded Files ({uploadedFiles.length}):
            </p>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-3 shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-none"></div>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-300 pointer-events-auto relative z-20">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Upload UFDR Files
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Get started with forensic data analysis
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors duration-200 cursor-pointer"
                onClick={handleModalUploadClick}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <Upload className="h-6 w-6 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm mb-2">
                      Drag & drop or{" "}
                      <span className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                        choose file
                      </span>{" "}
                      to upload
                    </p>
                    <p className="text-xs text-slate-500">
                      Supported types: *.ufdr
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center pb-4 mt-auto pt-4 relative z-30">
        <p className="text-slate-600 flex items-center justify-center gap-2">
          Built with <Heart className="h-4 w-4 text-red-500 fill-current" /> for
          Smart India Hackathon
        </p>
      </footer>
    </div>
  );
}
