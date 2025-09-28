"use client";

import CreateCaseModal from "@/components/cases/CreateCaseModal";
import {
  ChevronDown,
  File,
  FileText,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface CaseSidebarProps {
  caseId: string;
  searchData?: {
    intent: string;
    totalResults: number;
    processingTime: number;
  };
  results?: any[];
}

interface StoredCase {
  id: string;
  title: string;
  files?: { name: string; size: number; type: string }[];
  updatedAt: string;
  color?: string;
}

const STORAGE_KEY = "cognito-cases";

function getCase(caseId: string): StoredCase | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const items: StoredCase[] = JSON.parse(raw);
    return items.find((c) => c.id === caseId) || null;
  } catch {
    return null;
  }
}

function getAllCases(): StoredCase[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredCase[];
  } catch {
    return [];
  }
}

export default function CaseSidebar({
  caseId,
  searchData,
  results,
}: CaseSidebarProps) {
  const [files, setFiles] = useState<StoredCase["files"]>([]);
  const [title, setTitle] = useState<string>("");
  const [allCases, setAllCases] = useState<StoredCase[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    setError("");

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file) => {
      if (
        file.type === "application/zip" ||
        file.name.toLowerCase().endsWith(".zip")
      ) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      const msg = `Invalid file types: ${invalidFiles.join(", ")}. Only ZIP files are allowed.`;
      setError(msg);
      toast.error("Invalid files", { description: msg });
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  }, []);

  const removeSelectedFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      handleFileSelect(files);
    },
    [handleFileSelect],
  );

  const uploadFile = async (file: File, caseId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("case_id", caseId);

      const xhr = new XMLHttpRequest();

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error("Upload failed"));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error"));
      });

      xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/data/upload`);
      xhr.send(formData);
    });
  };

  const handleUploadFiles = useCallback(async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setError("");

    try {
      for (const file of selectedFiles) {
        await uploadFile(file, caseId);
      }

      const newFiles = selectedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }));

      setFiles((prev) => [...(prev || []), ...newFiles]);

      const STORAGE_KEY = "cognito-cases";
      const existingCases = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]",
      );
      const updatedCases = existingCases.map((c: any) => {
        if (c.id === caseId) {
          return {
            ...c,
            files: [...(c.files || []), ...newFiles],
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCases));

      setSelectedFiles([]);
      setError("");
      setIsFileUploadModalOpen(false);
    } catch (error) {
      const message = "Failed to upload files. Please try again.";
      setError(message);
      toast.error("Upload failed", { description: message });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, caseId]);

  const handleExportCourtReport = useCallback(async () => {
    if (!searchData || !results) {
      return;
    }

    try {
      const apiResponse = {
        intent: searchData.intent,
        totalResults: searchData.totalResults,
        processingTime: searchData.processingTime,
        results: results,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/data/export`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiResponse),
        },
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `court-report-${caseId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Export failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to export court report",
      });
    }
  }, [searchData, results, caseId]);

  useEffect(() => {
    const loadCaseData = async () => {
      const c = getCase(caseId);
      if (c) {
        setTitle(c.title);
        setFiles(c.files || []);
      } else {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/cases/`,
          );
          if (response.ok) {
            const data = await response.json();
            const backendCase = data.cases.find(
              (caseItem: any) => caseItem.id === caseId,
            );
            if (backendCase) {
              setTitle(backendCase.title || `Case ${caseId.slice(0, 8)}`);
              setFiles([]);
            } else {
              setTitle(`Case ${caseId.slice(0, 8)}`);
              setFiles([]);
            }
          } else {
            setTitle(`Case ${caseId.slice(0, 8)}`);
            setFiles([]);
          }
        } catch (error) {
          setTitle(`Case ${caseId.slice(0, 8)}`);
          setFiles([]);
          toast.error("Failed to load case", {
            description: "Using local case data",
          });
        }
      }
    };

    loadCaseData();

    setAllCases(
      getAllCases().sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    );
  }, [caseId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleFocus = () => {
      refreshCaseData();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [caseId]);

  const handleCaseSwitch = (newCaseId: string) => {
    window.location.href = `/cases/${newCaseId}`;
  };

  const handleCreateSuccess = (caseData: StoredCase) => {
    setAllCases(
      getAllCases().sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    );
    setIsCreateModalOpen(false);
    window.location.href = `/cases/${caseData.id}`;
  };

  const refreshCaseData = () => {
    const c = getCase(caseId);
    if (c) {
      setTitle(c.title);
      setFiles(c.files || []);
    }
  };

  return (
    <>
      <aside className="w-80 h-full flex flex-col border-r border-[#E0E0E0] dark:border-[#2A2A2A] bg-[#F8F8F8] dark:bg-[#0F0F0F] overflow-hidden min-h-0">
        <div className="p-4 border-b border-[#E0E0E0] dark:border-[#2A2A2A]">
          <div ref={dropdownRef} className="relative">
            <button
              className="w-full flex items-center justify-between p-3 rounded-lg bg-[#F8F8F8] dark:bg-[#0F0F0F]"
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
              }}
            >
              <div className="text-left flex-1">
                <div className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                  {title}
                </div>
                <div className="text-xs text-[#666] dark:text-[#999] truncate">
                  {caseId}
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-[#FF7F50] transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#F8F8F8] dark:bg-[#0F0F0F] border border-[#E0E0E0] dark:border-[#2A2A2A] rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-[#E0E0E0] dark:border-[#2A2A2A]">
                  <div className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                    Recent Cases
                  </div>
                  <div className="text-xs text-[#666] dark:text-[#999]">
                    Switch between your cases
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {allCases.length === 0 ? (
                    <div className="p-4 text-center">
                      <div className="text-sm text-[#666] dark:text-[#999] mb-1">
                        No cases found
                      </div>
                      <div className="text-xs text-[#999] dark:text-[#666]">
                        Create your first case to get started
                      </div>
                    </div>
                  ) : (
                    <>
                      {allCases.slice(0, 5).map((caseItem) => (
                        <button
                          key={caseItem.id}
                          onClick={() => {
                            handleCaseSwitch(caseItem.id);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F]"
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: caseItem.color || "#94a3b8",
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0] truncate">
                              {caseItem.title}
                            </div>
                            <div className="text-xs text-[#666] dark:text-[#999] truncate">
                              {caseItem.id}
                            </div>
                          </div>
                        </button>
                      ))}
                      {allCases.length > 5 && (
                        <div className="px-3 py-2 text-xs text-[#666] dark:text-[#999] text-center border-t border-[#E0E0E0] dark:border-[#2A2A2A]">
                          +{allCases.length - 5} more cases
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="border-t border-[#E0E0E0] dark:border-[#2A2A2A]">
                  <button
                    onClick={() => {
                      setIsCreateModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Create New Case</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-[#E0E0E0] dark:border-[#2A2A2A]">
          <button
            onClick={() => setIsFileUploadModalOpen(true)}
            className="w-full inline-flex items-center justify-center rounded-lg border border-[#FF7F50] dark:border-[#FF7F50] px-4 py-2 text-sm font-medium text-[#FF7F50] dark:text-[#FF7F50] hover:bg-[#FF7F50] hover:text-white dark:hover:bg-[#FF7F50] dark:hover:text-white transition-colors"
          >
            <Upload className="mr-2 h-4 w-4" /> Add files
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {files && files.length > 0 ? (
                files.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg border border-[#E0E0E0] dark:border-[#2A2A2A] bg-[#F8F8F8] dark:bg-[#1A1A1A] p-3 hover:bg-[#F0F0F0] dark:hover:bg-[#2A2A2A] transition-colors"
                  >
                    <FileText className="h-5 w-5 text-[#FF7F50] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                        {f.name}
                      </div>
                      <div className="text-xs text-[#666] dark:text-[#999]">
                        {(f.size / 1024).toFixed(1)} KB • {f.type}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full min-h-[300px]">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-[#FF7F50]" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      No Files Uploaded
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 max-w-md mx-auto">
                      Upload evidence files to begin analysis
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#E0E0E0] dark:border-[#2A2A2A]">
          <div className="text-xs font-medium text-[#666] dark:text-[#999] uppercase tracking-wide mb-3">
            Export
          </div>
          <div className="space-y-1">
            <button
              onClick={handleExportCourtReport}
              disabled={!searchData || !results}
              className="w-full inline-flex items-center justify-start rounded-lg px-3 py-2 text-sm text-[#FF7F50] hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Court Report
            </button>
            <button className="w-full inline-flex items-center justify-start rounded-lg px-3 py-2 text-sm text-[#FF7F50] hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F] transition-colors">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              All Evidence
            </button>
            <button className="w-full inline-flex items-center justify-start rounded-lg px-3 py-2 text-sm text-[#FF7F50] hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F] transition-colors">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Timeline
            </button>
            <button className="w-full inline-flex items-center justify-start rounded-lg px-3 py-2 text-sm text-[#FF7F50] hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F] transition-colors">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Network
            </button>
          </div>
        </div>
      </aside>

      <CreateCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {isFileUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => {
              setSelectedFiles([]);
              setError("");
              setIsUploading(false);
              setIsFileUploadModalOpen(false);
            }}
          />

          <div className="relative bg-[#FEFEFE] dark:bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[#E0E0E0] dark:border-[#2A2A2A]">
            <button
              onClick={() => {
                setSelectedFiles([]);
                setError("");
                setIsUploading(false);
                setIsFileUploadModalOpen(false);
              }}
              className="absolute top-3 right-3 p-2 text-[#666] dark:text-[#999] hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-light text-[#2A2A2A] dark:text-[#E0E0E0] mb-1">
                Add Files
              </h2>
              <p className="text-sm text-[#666] dark:text-[#999] font-light">
                Upload evidence files to analyze your case data
              </p>
            </div>

            <div className="mb-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  isDragOver
                    ? "border-[#FF7F50] bg-[#FFF5F0] dark:bg-[#2A1A0F]"
                    : "border-[#E0E0E0] dark:border-[#2A2A2A] hover:border-[#FF7F50] dark:hover:border-[#FF7F50]"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="w-12 h-12 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-[#FF7F50]" />
                </div>
                <p className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-1">
                  {isDragOver ? "Drop files here" : "Upload sources"}
                </p>
                <p className="text-sm text-[#666] dark:text-[#999] mb-3">
                  Drag & drop or{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-[#FF7F50] cursor-pointer underline font-medium hover:text-[#FF6B35] transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-none p-0"
                  >
                    choose file
                  </button>{" "}
                  to upload
                </p>
                <p className="text-xs text-[#999] dark:text-[#666]">
                  Supported file types: .ufdr, .zip
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                accept=".zip"
                disabled={isUploading}
              />
            </div>

            {selectedFiles && selectedFiles.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-3">
                  Selected Files ({selectedFiles.length})
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-[#F8F8F8] dark:bg-[#2A2A2A] rounded-lg border border-[#E0E0E0] dark:border-[#2A2A2A]"
                    >
                      <div className="flex items-center space-x-3">
                        <File className="h-4 w-4 text-[#FF7F50]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0] truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-[#666] dark:text-[#999]">
                            {(file.size / 1024).toFixed(1)} KB • {file.type}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeSelectedFile(index)}
                        disabled={isUploading}
                        className="p-1 text-[#666] dark:text-[#999] hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedFiles([]);
                  setError("");
                  setIsUploading(false);
                  setIsFileUploadModalOpen(false);
                }}
                disabled={isUploading}
                className="border-[#E0E0E0] dark:border-[#2A2A2A] text-[#4A4A4A] dark:text-[#B0B0B0] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-all duration-300 py-2 px-5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadFiles}
                disabled={
                  !selectedFiles || selectedFiles.length === 0 || isUploading
                }
                className="bg-[#2A2A2A] text-white hover:bg-[#1A1A1A] dark:bg-[#E0E0E0] dark:text-[#2A2A2A] dark:hover:bg-[#D0D0D0] transition-all duration-300 py-2 px-5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </div>
                ) : (
                  "Upload Files"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
