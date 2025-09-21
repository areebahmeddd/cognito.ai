"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Mic, Send, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onresult:
      | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
      | null;
    onerror:
      | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
      | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
  }

  interface SpeechRecognitionResultList {
    readonly [index: number]: SpeechRecognitionResult;
    readonly length: number;
  }

  interface SpeechRecognitionResult {
    readonly [index: number]: SpeechRecognitionAlternative;
    readonly length: number;
    readonly isFinal: boolean;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
}

export default function HomePage() {
  const [inputValue, setInputValue] = useState("");
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(true);
  const [hasUploadedUFDR, setHasUploadedUFDR] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInputValue((prev) => prev + (prev ? " " : "") + transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

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
        <div className="relative z-10 mx-auto mb-8 max-w-2xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-balance text-slate-900 dark:text-slate-100 drop-shadow-sm md:text-5xl">
            Welcome, how may I help you?
          </h1>
          {!showUploadModal && (
            <div className="flex h-12 items-center justify-center">
              <p
                className={`text-lg text-slate-600 dark:text-slate-400 drop-shadow-sm transition-all duration-300 ease-in-out ${
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
                className="max-h-[200px] min-h-[48px] w-full resize-none rounded-2xl border-2 border-gray-400 dark:border-gray-600 bg-white dark:bg-slate-800 py-3 pr-16 pl-4 text-base text-slate-900 dark:text-slate-100 shadow-lg transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:shadow-xl focus:outline-none"
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
                  className="h-8 w-8 rounded-sm p-0 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={handleUploadClick}
                  aria-label="Upload more files"
                >
                  <Upload className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-8 w-8 rounded-sm p-0 transition-colors duration-200 ${
                    isRecording
                      ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                      : "hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                  onClick={handleVoiceInput}
                  aria-label={
                    isRecording ? "Stop recording" : "Start voice input"
                  }
                >
                  <Mic
                    className={`h-4 w-4 ${isRecording ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}
                  />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-8 w-8 rounded-sm p-0 transition-colors duration-200 ${
                    inputValue.trim()
                      ? "bg-accent/80 text-white hover:bg-slate-800 dark:bg-accent dark:hover:bg-slate-600"
                      : "bg-slate-100 text-slate-300 dark:bg-slate-700 dark:text-slate-500"
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
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Uploaded Files ({uploadedFiles.length}):
            </p>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
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
          <div className="animate-in zoom-in-95 pointer-events-auto relative z-20 mx-4 w-full max-w-md rounded-xl bg-white dark:bg-slate-800 shadow-xl duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Upload UFDR Files
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Get started with forensic data analysis
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 transition-colors duration-200 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div
                className="cursor-pointer rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-6 text-center transition-colors duration-200 hover:border-slate-400 dark:hover:border-slate-500"
                onClick={handleModalUploadClick}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                    <Upload className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                      Drag & drop or{" "}
                      <span className="cursor-pointer text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                        choose file
                      </span>{" "}
                      to upload
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
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
