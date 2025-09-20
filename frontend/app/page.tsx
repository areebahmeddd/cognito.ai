"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Upload, Heart, X, FileText, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
          (prevIndex) => (prevIndex + 1) % animatedTexts.length,
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
    event: React.ChangeEvent<HTMLInputElement>,
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
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
        <div className="relative z-10 mx-auto mb-8 max-w-2xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-balance text-slate-900 drop-shadow-sm md:text-5xl">
            Welcome, how may I help you?
          </h1>
          {!showUploadModal && (
            <div className="flex h-12 items-center justify-center">
              <p
                className={`text-lg text-slate-600 drop-shadow-sm transition-all duration-300 ease-in-out ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
              >
                {animatedTexts[currentTextIndex]}
              </p>
            </div>
          )}
        </div>

        {!showUploadModal && (
          <div className="relative z-10 mx-auto mb-6 w-full max-w-2xl">
            <div className="relative">
              <Textarea
                placeholder="Ask me anything about your UFDR data..."
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                className="max-h-[200px] min-h-[48px] w-full resize-none rounded-2xl border-2 border-gray-400 bg-white py-3 pr-16 pl-4 text-base shadow-lg transition-all duration-300 placeholder:text-slate-400 hover:shadow-xl focus:outline-none"
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
                  className="h-8 w-8 rounded-sm p-0 transition-colors duration-200 hover:bg-slate-100"
                  onClick={handleUploadClick}
                  aria-label="Upload more files"
                >
                  <Upload className="h-4 w-4 text-slate-500" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-sm p-0 transition-colors duration-200 hover:bg-slate-100"
                >
                  <Mic className="h-4 w-4 text-slate-500" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-8 w-8 rounded-sm p-0 transition-colors duration-200 ${
                    inputValue.trim()
                      ? "bg-accent/80 text-white hover:bg-slate-800"
                      : "bg-slate-100 text-slate-300"
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
          <div className="relative z-10 mx-auto mt-4 w-full max-w-2xl space-y-2">
            <p className="text-sm font-medium text-slate-600">
              Uploaded Files ({uploadedFiles.length}):
            </p>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
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
                    className="h-6 w-6 p-0 transition-colors duration-200 hover:bg-red-50 hover:text-red-600"
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
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center duration-300">
          <div className="pointer-events-none absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
          <div className="animate-in zoom-in-95 pointer-events-auto relative z-20 mx-4 w-full max-w-md rounded-xl bg-white shadow-xl duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Upload UFDR Files
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Get started with forensic data analysis
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 transition-colors duration-200 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div
                className="cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-6 text-center transition-colors duration-200 hover:border-slate-400"
                onClick={handleModalUploadClick}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <Upload className="h-6 w-6 text-slate-500" />
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-slate-600">
                      Drag & drop or{" "}
                      <span className="cursor-pointer text-blue-600 underline hover:text-blue-700">
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

      <Footer />
    </div>
  );
}
