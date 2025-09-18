"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          (prevIndex) => (prevIndex + 1) % animatedTexts.length,
        );
        setIsVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, [animatedTexts.length]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      console.log("Search query:", inputValue);
      // TODO: Implement search functionality
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

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = newHeight + "px";

    // Check if textarea is expanded (more than single line)
    setIsExpanded(newHeight > 48);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
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

      <main className="flex flex-1 flex-col items-center justify-center min-h-[70vh] px-4">
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
            <Textarea
              placeholder="Ask me anything about your UFDR data..."
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyPress}
              className="w-full min-h-[48px] max-h-[200px] text-base bg-white border-2 border-black focus:ring-2 focus:ring-black focus:border-black placeholder:text-slate-400 pr-20 pl-4 py-3 rounded-lg resize-none"
              rows={1}
            />
            <div
              className={`absolute right-3 flex items-center space-x-2 ${
                isExpanded ? "top-3" : "top-1/2 -translate-y-1/2"
              }`}
            >
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
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4 text-slate-500" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={`h-8 w-8 p-0 transition-colors duration-200 ${
                  inputValue.trim()
                    ? "bg-black text-white hover:bg-slate-800"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
                onClick={handleSubmit}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.json,.xml,.csv,.log,.pcap,.zip,.rar,.7z"
          />

          {/* Uploaded files display */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-600 font-medium">
                Uploaded Files:
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
        </div>
      </main>

      <footer className="text-center pb-4 mt-auto pt-4">
        <p className="text-slate-600 flex items-center justify-center gap-2">
          Built with <Heart className="h-4 w-4 text-red-500 fill-current" /> for
          Smart India Hackathon
        </p>
      </footer>
    </div>
  );
}
