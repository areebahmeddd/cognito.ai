"use client";

import CreateCaseModal from "@/components/cases/CreateCaseModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronRight,
  Eye,
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
  fileMetadata?: {
    file_name: string;
    files_count: number;
    files_list: string[];
  } | null;
  onFileUploaded?: (metadata: {
    file_name: string;
    files_count: number;
    files_list: string[];
  }) => void;
}

interface StoredCase {
  id: string;
  title: string;
  description?: string;
  files?: any[];
  updatedAt: string;
  createdAt?: string;
  color?: string;
  status?: string;
  filesCount?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface BackendCase {
  case_id: string;
  case_name: string;
  description: string;
  device_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  metadata: any;
  files_count: number;
}

async function getCase(caseId: string): Promise<StoredCase | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}`);
    if (!response.ok) {
      return null;
    }
    const caseData: BackendCase = await response.json();

    const files: any[] = [];
    if (caseData.metadata) {
      if (
        caseData.metadata.uploads &&
        Array.isArray(caseData.metadata.uploads)
      ) {
        caseData.metadata.uploads.forEach((upload: any) => {
          files.push({
            file_name: upload.file_name,
            file_type: "zip",
            files_count: upload.files_count || 0,
            record_count: upload.files_count || 0,
            files_list: upload.files_list || [],
            upload_id: upload.upload_id,
            upload_time: upload.upload_time,
          });
        });
      }
    }

    const uploadsSingle = Array.isArray(caseData?.metadata?.uploads)
      ? caseData.metadata.uploads
      : [];
    const totalRecordsSingle = uploadsSingle.reduce(
      (sum: number, u: any) =>
        sum + (u.files_count || (u.files_list ? u.files_list.length : 0) || 0),
      0,
    );

    return {
      id: caseData.case_id,
      title: caseData.case_name,
      description: caseData.description,
      updatedAt: caseData.updated_at,
      createdAt: caseData.created_at,
      color: ["#FF7F50", "#FF7F50", "#FF7F50", "#FF7F50", "#FF7F50"][
        Math.floor(Math.random() * 5)
      ],
      files: files,
      status: caseData.status,
      filesCount: totalRecordsSingle,
    };
  } catch (error) {
    return null;
  }
}

async function getAllCases(): Promise<StoredCase[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/`);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    const backendCases: BackendCase[] = data.cases || [];
    const activeCases = backendCases.filter((c) => c.status !== "archived");

    return activeCases.map((caseData) => {
      const files: any[] = [];
      const uploadsArr = Array.isArray(caseData?.metadata?.uploads)
        ? caseData.metadata.uploads
        : [];
      uploadsArr.forEach((upload: any) => {
        files.push({
          file_name: upload.file_name,
          file_type: "zip",
          files_count: upload.files_count || 0,
          record_count: upload.files_count || 0,
          files_list: upload.files_list || [],
          upload_id: upload.upload_id,
          upload_time: upload.upload_time,
        });
      });
      const files2: any[] = [];
      const uploadsArr2 = Array.isArray(caseData?.metadata?.uploads)
        ? caseData.metadata.uploads
        : [];
      uploadsArr2.forEach((upload: any) => {
        files2.push({
          file_name: upload.file_name,
          file_type: "zip",
          files_count: upload.files_count || 0,
          record_count: upload.files_count || 0,
          files_list: upload.files_list || [],
          upload_id: upload.upload_id,
          upload_time: upload.upload_time,
        });
      });

      const uploads = Array.isArray(caseData?.metadata?.uploads)
        ? caseData.metadata.uploads
        : [];
      const totalUploads = uploads.length;
      const totalRecords = uploads.reduce(
        (sum: number, u: any) =>
          sum +
          (u.files_count || (u.files_list ? u.files_list.length : 0) || 0),
        0,
      );

      return {
        id: caseData.case_id,
        title: caseData.case_name,
        description: caseData.description,
        updatedAt: caseData.updated_at,
        createdAt: caseData.created_at,
        color: ["#FF7F50", "#FF7F50", "#FF7F50", "#FF7F50", "#FF7F50"][
          Math.floor(Math.random() * 5)
        ],
        files: files2,
        status: caseData.status,
        filesCount: totalRecords,
        totalUploads: totalUploads,
      };
    });
  } catch (error) {
    return [];
  }
}

async function getCaseFiles(caseId: string): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/files`);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.files || [];
  } catch (error) {
    return [];
  }
}

export default function CaseSidebar({
  caseId,
  searchData,
  results,
  fileMetadata,
  onFileUploaded,
}: CaseSidebarProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [allCases, setAllCases] = useState<StoredCase[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingDeleteZip, setPendingDeleteZip] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());
  const [viewingFile, setViewingFile] = useState<any>(null);
  const [fileContent, setFileContent] = useState<any>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [visibleFileCounts, setVisibleFileCounts] = useState<
    Map<number, number>
  >(new Map());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownLimit, setDropdownLimit] = useState<number>(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFilesGrouped = useCallback(async (cid: string) => {
    try {
      const caseRes = await fetch(`${API_BASE_URL}/cases/${cid}`);
      if (caseRes.ok) {
        const caseData = await caseRes.json();
        const md = caseData?.metadata;
        if (md && md.file_name) {
          return [
            {
              file_name: md.file_name,
              files_list: Array.isArray(md.files_list) ? md.files_list : [],
              files_count: Number(md.files_count || 0),
              record_count: Number(md.files_count || 0),
            },
          ];
        }
      }

      const res = await fetch(`${API_BASE_URL}/cases/${cid}/files`);
      if (!res.ok) return [] as any[];
      const data = await res.json();
      const uploads: any[] = Array.isArray(data.uploads) ? data.uploads : [];

      const groups: {
        file_name: string;
        files_list: string[];
        files_count: number;
        record_count: number;
      }[] = [];
      if (uploads.length > 0) {
        for (const u of uploads) {
          const tsvs = Array.isArray(u.files_list) ? u.files_list : [];
          groups.push({
            file_name: u.file_name,
            files_list: tsvs,
            files_count: Number(u.files_count || tsvs.length || 0),
            record_count: Number(u.files_count || tsvs.length || 0),
          });
        }
      }
      return groups;
    } catch {
      return [] as any[];
    }
  }, []);

  const toggleFileExpansion = useCallback((fileIndex: number) => {
    setExpandedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileIndex)) {
        newSet.delete(fileIndex);
        setVisibleFileCounts((prev) => {
          const newMap = new Map(prev);
          newMap.set(fileIndex, 10);
          return newMap;
        });
      } else {
        newSet.add(fileIndex);
        setVisibleFileCounts((prev) => {
          const newMap = new Map(prev);
          if (!newMap.has(fileIndex)) {
            newMap.set(fileIndex, 10);
          }
          return newMap;
        });
      }
      return newSet;
    });
  }, []);

  const loadMoreFiles = useCallback((fileIndex: number) => {
    setVisibleFileCounts((prev) => {
      const newMap = new Map(prev);
      const currentCount = newMap.get(fileIndex) || 10;
      newMap.set(fileIndex, currentCount + 10);
      return newMap;
    });
  }, []);

  const handleDeleteUpload = useCallback((zipName: string) => {
    setPendingDeleteZip(zipName);
    setIsDeleteConfirmOpen(true);
  }, []);

  const fetchFileContent = useCallback(
    async (fileName: string) => {
      setIsLoadingContent(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/cases/${caseId}/files/${encodeURIComponent(fileName)}`,
        );

        if (response.ok) {
          const data = await response.json();
          setFileContent(data);
          setViewingFile(fileName);
        } else {
          toast.error("Failed to load file content");
        }
      } catch (error) {
        toast.error("Error loading file content");
      } finally {
        setIsLoadingContent(false);
      }
    },
    [caseId],
  );

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

  const uploadFile = async (file: File, caseId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("case_id", caseId);

      const xhr = new XMLHttpRequest();

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error("Failed to parse response"));
          }
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
      let successCount = 0;
      let duplicateCount = 0;
      let failedCount = 0;

      for (const file of selectedFiles) {
        try {
          const resp = await uploadFile(file, caseId);
          if (resp && resp.status === "success") {
            successCount += 1;
          } else if (resp && resp.status === "duplicate") {
            duplicateCount += 1;
          } else {
            failedCount += 1;
          }
        } catch {
          failedCount += 1;
        }
      }

      setSelectedFiles([]);
      setError("");
      setIsFileUploadModalOpen(false);
      await refreshCaseData();

      if (successCount > 0) {
        toast.success("Files uploaded", {
          description: `${successCount} succeeded${duplicateCount ? `, ${duplicateCount} duplicate` : ""}${failedCount ? `, ${failedCount} failed` : ""}`,
        });
      } else if (duplicateCount > 0 && !failedCount) {
        toast.warning?.("Duplicate upload", {
          description: `${duplicateCount} file(s) were already uploaded for this case`,
        }) ||
          toast("Duplicate upload", {
            description: `${duplicateCount} file(s) were already uploaded for this case`,
          });
      } else if (failedCount > 0) {
        toast.error("Upload failed", {
          description: `${failedCount} file(s) failed. Please try again.`,
        });
      }
    } catch (error) {
      const message = "Failed to upload files. Please try again.";
      setError(message);
      toast.error("Upload failed", { description: message });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, caseId, onFileUploaded]);

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
        case_id: caseId,
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
      link.download = `${caseId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Export failed", {
        description:
          error instanceof Error
            ? error.message
            : "Unable to generate the court report. Please try again.",
      });
    }
  }, [searchData, results, caseId]);

  useEffect(() => {
    const loadCaseData = async () => {
      const c = await getCase(caseId);
      if (c) {
        setTitle(c.title);
        setDescription(c.description || "");
        const groups = await fetchFilesGrouped(caseId);
        setFiles(groups);
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
              const groups = await fetchFilesGrouped(caseId);
              setFiles(groups);
            } else {
              setTitle(`Case ${caseId.slice(0, 8)}`);
              setFiles(await fetchFilesGrouped(caseId));
            }
          } else {
            setTitle(`Case ${caseId.slice(0, 8)}`);
            setFiles(await fetchFilesGrouped(caseId));
          }
        } catch (error) {
          setTitle(`Case ${caseId.slice(0, 8)}`);
          setFiles(await fetchFilesGrouped(caseId));
          toast.error("Failed to load case", {
            description: "Using local case data",
          });
        }
      }
    };

    loadCaseData();

    const loadAllCases = async () => {
      const cases = await getAllCases();
      setAllCases(
        cases.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
      );
    };
    loadAllCases();
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
    if (!isDropdownOpen) {
      setDropdownLimit(5);
    }
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

  const handleCaseSwitch = (newCaseId: string) => {
    setIsDropdownOpen(false);
    setDropdownLimit(5);
    window.location.href = `/cases/${newCaseId}`;
  };

  const handleCreateSuccess = async (caseData: StoredCase) => {
    const cases = await getAllCases();
    setAllCases(
      cases.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    );
    setIsCreateModalOpen(false);
    window.location.href = `/cases/${caseData.id}`;
  };

  const refreshCaseData = async () => {
    const c = await getCase(caseId);
    if (c) {
      setTitle(c.title);
      setDescription(c.description || "");
      setFiles(await fetchFilesGrouped(caseId));
    }
  };

  return (
    <>
      <aside className="w-80 h-full flex flex-col border-r border-[#E0E0E0] dark:border-[#2A2A2A] bg-[#F8F8F8] dark:bg-[#0F0F0F] overflow-hidden min-h-0">
        <div className="p-4 border-b border-[#E0E0E0] dark:border-[#2A2A2A]">
          <div className="mb-3 p-3 rounded-lg bg-[#F8F8F8] dark:bg-[#0F0F0F] border border-[#E0E0E0] dark:border-[#2A2A2A]">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#2A2A2A] dark:text-[#E0E0E0] break-words">
                  {title}
                </h3>
                <p className="text-xs text-[#666] dark:text-[#999] font-mono truncate">
                  {caseId}
                </p>
              </div>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="ml-2 p-1 rounded cursor-pointer"
                title="Switch cases"
              >
                <ChevronDown
                  className={`h-4 w-4 text-[#FF7F50] transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <File className="h-3 w-3 text-[#FF7F50]" />
                <span className="text-[#666] dark:text-[#999]">
                  {files?.length || 0} files
                </span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3 text-[#FF7F50]" />
                <span className="text-[#666] dark:text-[#999]">
                  {(files || []).reduce(
                    (sum: number, f: any) =>
                      sum + (f.files_count || f.record_count || 0),
                    0,
                  )}{" "}
                  records
                </span>
              </div>
            </div>

            {description && (
              <div className="mt-2 pt-2 border-t border-[#E0E0E0] dark:border-[#2A2A2A]">
                <p className="text-xs text-[#666] dark:text-[#999] break-words">
                  {description}
                </p>
              </div>
            )}
          </div>

          <div ref={dropdownRef} className="relative">
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
                      {allCases.slice(0, dropdownLimit).map((caseItem) => (
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
                      {allCases.length > dropdownLimit && (
                        <button
                          onClick={() =>
                            setDropdownLimit((prev) =>
                              Math.min(prev + 5, allCases.length),
                            )
                          }
                          className="w-full px-3 py-2 text-xs text-[#666] dark:text-[#999] text-center border-t border-[#E0E0E0] dark:border-[#2A2A2A] hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F]"
                        >
                          View more (+{allCases.length - dropdownLimit})
                        </button>
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
              {fileMetadata || (files && files.length > 0) ? (
                (fileMetadata ? [fileMetadata] : files || []).map(
                  (f: any, idx: number) => {
                    const isZipFile = f.file_name?.endsWith(".zip");
                    const recordCount = f.files_count || f.record_count || 0;
                    const hasRecords = recordCount > 0;
                    const isExpanded = expandedFiles.has(idx);

                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-[#E0E0E0] dark:border-[#2A2A2A] bg-[#F8F8F8] dark:bg-[#1A1A1A] overflow-hidden"
                      >
                        <div className={`flex items-center gap-3 p-3`}>
                          {isZipFile ? (
                            <File className="h-5 w-5 text-[#FF7F50] flex-shrink-0" />
                          ) : (
                            <FileText className="h-5 w-5 text-[#FF7F50] flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                              {f.file_name}
                            </div>
                            <div className="text-xs text-[#666] dark:text-[#999]">
                              Unknown size • {recordCount} records
                            </div>
                          </div>

                          <Dialog
                            open={isDeleteConfirmOpen}
                            onOpenChange={setIsDeleteConfirmOpen}
                          >
                            <DialogContent className="bg-white dark:bg-[#1A1A1A] border border-[#E0E0E0] dark:border-[#2A2A2A]">
                              <DialogHeader>
                                <DialogTitle>Delete upload?</DialogTitle>
                                <DialogDescription>
                                  This will remove all parsed files from this
                                  upload. You can’t undo this action.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="text-sm text-[#666] dark:text-[#999]">
                                {pendingDeleteZip}
                              </div>
                              <DialogFooter>
                                <button
                                  className="rounded px-3 py-2 text-sm border border-[#E0E0E0] dark:border-[#2A2A2A]"
                                  onClick={() => setIsDeleteConfirmOpen(false)}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="rounded px-3 py-2 text-sm bg-red-600 text-white"
                                  onClick={async () => {
                                    if (!pendingDeleteZip) return;
                                    try {
                                      const response = await fetch(
                                        `${API_BASE_URL}/cases/${caseId}/uploads/${encodeURIComponent(pendingDeleteZip)}`,
                                        { method: "DELETE" },
                                      );
                                      if (!response.ok) {
                                        toast.error("Failed to delete upload");
                                      } else {
                                        setFiles((prev) =>
                                          (prev || []).filter(
                                            (g: any) =>
                                              g.file_name !== pendingDeleteZip,
                                          ),
                                        );
                                        toast.success("Upload deleted");
                                      }
                                    } catch (e) {
                                      toast.error("Error deleting upload");
                                    } finally {
                                      setIsDeleteConfirmOpen(false);
                                      setPendingDeleteZip(null);
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          {isZipFile && (
                            <div className="flex items-center gap-2">
                              {hasRecords && (
                                <button
                                  className="px-2 py-1 text-xs text-[#FF7F50] cursor-pointer"
                                  onClick={() => toggleFileExpansion(idx)}
                                  title={isExpanded ? "Collapse" : "Expand"}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-[#FF7F50] dark:text-[#FF7F50]" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-[#FF7F50] dark:text-[#FF7F50]" />
                                  )}
                                </button>
                              )}
                              <button
                                className="p-1 rounded hover:bg-[#FDECEC] dark:hover:bg-[#2A1A1A] cursor-pointer"
                                title="Delete upload"
                                onClick={() => handleDeleteUpload(f.file_name)}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          )}
                        </div>

                        {isZipFile && hasRecords && isExpanded && (
                          <div className="border-t border-[#E0E0E0] dark:border-[#2A2A2A] bg-[#F0F0F0] dark:bg-[#1A1A1A] p-2">
                            {f.files_list && f.files_list.length > 0 && (
                              <div className="space-y-1">
                                {f.files_list
                                  .slice(0, visibleFileCounts.get(idx) || 10)
                                  .map((file: any, fileIdx: number) => (
                                    <div
                                      key={fileIdx}
                                      className="flex items-center gap-2 text-xs text-[#666] dark:text-[#999] p-1 rounded group"
                                    >
                                      <button
                                        className="flex items-center gap-2 flex-1 text-left hover:text-[#FF7F50] dark:hover:text-[#FF7F50]"
                                        onClick={() => fetchFileContent(file)}
                                      >
                                        <FileText className="h-3 w-3" />
                                        <span className="truncate flex-1">
                                          {file}
                                        </span>
                                        <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </button>
                                    </div>
                                  ))}
                                {f.files_list.length >
                                  (visibleFileCounts.get(idx) || 10) && (
                                  <button
                                    onClick={() => loadMoreFiles(idx)}
                                    className="w-full text-xs text-[#FF7F50] dark:text-[#FF7F50] p-2 rounded cursor-pointer"
                                  >
                                    +
                                    {f.files_list.length -
                                      (visibleFileCounts.get(idx) || 10)}{" "}
                                    more files
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  },
                )
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
              className="w-full inline-flex items-center justify-start rounded-lg px-3 py-2 text-sm text-[#FF7F50] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
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
            <button
              onClick={() =>
                toast.info("All Evidence", {
                  description: "This feature is under development.",
                })
              }
              className="w-full inline-flex items-center justify-start rounded-lg px-3 py-2 text-sm text-[#FF7F50] hover:scale-[1.02] transition-transform"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              All Evidence
            </button>
            <button
              onClick={() =>
                toast.info("Timeline", {
                  description: "This feature is under development.",
                })
              }
              className="w-full inline-flex items-center justify-start rounded-lg px-3 py-2 text-sm text-[#FF7F50] hover:scale-[1.02] transition-transform"
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Timeline
            </button>
            <button
              onClick={() =>
                toast.info("Network", {
                  description: "This feature is under development.",
                })
              }
              className="w-full inline-flex items-center justify-start rounded-lg px-3 py-2 text-sm text-[#FF7F50] hover:scale-[1.02] transition-transform"
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

      {viewingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => {
              setViewingFile(null);
              setFileContent(null);
            }}
          />
          <div className="relative bg-[#FEFEFE] dark:bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-5xl mx-4 shadow-2xl border border-[#E0E0E0] dark:border-[#2A2A2A] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                  {viewingFile}
                </h2>
                <p className="text-sm text-[#666] dark:text-[#999]">
                  File Content Viewer
                </p>
              </div>
              <button
                onClick={() => {
                  setViewingFile(null);
                  setFileContent(null);
                }}
                className="p-2 text-[#666] dark:text-[#999] hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-[#E0E0E0] dark:border-[#2A2A2A] rounded-lg overflow-hidden flex-1 flex flex-col">
              <div className="bg-[#F8F8F8] dark:bg-[#2A2A2A] px-4 py-2 border-b border-[#E0E0E0] dark:border-[#2A2A2A] flex-shrink-0">
                <div className="flex items-center gap-2 text-sm text-[#666] dark:text-[#999]">
                  <FileText className="h-4 w-4" />
                  <span>Content Preview</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoadingContent ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="flex items-center gap-2 text-[#666] dark:text-[#999]">
                      <div className="w-4 h-4 border-2 border-[#FF7F50] border-t-transparent rounded-full animate-spin" />
                      Loading file content...
                    </div>
                  </div>
                ) : fileContent ? (
                  <div className="p-4">
                    <div className="mb-4 p-3 bg-[#F8F8F8] dark:bg-[#1A1A1A] rounded-lg border border-[#E0E0E0] dark:border-[#2A2A2A]">
                      <h3 className="text-sm font-semibold text-[#2A2A2A] dark:text-[#E0E0E0] mb-2">
                        {fileContent.file_name}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#666] dark:text-[#999]">
                        <div>
                          <span className="font-medium">Case:</span>{" "}
                          {fileContent.case_name}
                        </div>
                        <div>
                          <span className="font-medium">Total Records:</span>{" "}
                          {fileContent.total_records}
                        </div>
                        <div>
                          <span className="font-medium">Source:</span>{" "}
                          {fileContent.json_file_name}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>{" "}
                          {new Date(
                            fileContent.file_metadata.created_at,
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                        Records
                      </h4>
                      {fileContent.records && fileContent.records.length > 0 ? (
                        <div className="space-y-2">
                          {fileContent.records.map(
                            (record: any, index: number) => (
                              <div
                                key={index}
                                className="p-3 bg-[#FAFAFA] dark:bg-[#1A1A1A] rounded-lg border border-[#E0E0E0] dark:border-[#2A2A2A]"
                              >
                                <div className="text-xs text-[#666] dark:text-[#999] mb-2">
                                  Record #{index + 1}
                                </div>
                                <div className="space-y-1">
                                  {Object.entries(record).map(
                                    ([key, value]) => (
                                      <div
                                        key={key}
                                        className="flex text-xs gap-2"
                                      >
                                        <span className="font-medium text-[#2A2A2A] dark:text-[#E0E0E0] w-32 flex-shrink-0">
                                          {key}:
                                        </span>
                                        <span className="text-[#666] dark:text-[#999] break-words flex-1 min-w-0">
                                          {typeof value === "string" &&
                                          value.length > 100
                                            ? `${value.substring(0, 100)}...`
                                            : String(value)}
                                        </span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[#666] dark:text-[#999]">
                          No records found
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-[#666] dark:text-[#999] mx-auto mb-2" />
                      <p className="text-sm text-[#666] dark:text-[#999]">
                        No content available
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="bg-white dark:bg-[#1A1A1A] border border-[#E0E0E0] dark:border-[#2A2A2A]">
          <DialogHeader>
            <DialogTitle>Delete upload?</DialogTitle>
            <DialogDescription>
              This will remove all parsed files from this upload. You can’t undo
              this action.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-[#666] dark:text-[#999]">
            {pendingDeleteZip}
          </div>
          <DialogFooter>
            <button
              className="rounded px-3 py-2 text-sm border border-[#E0E0E0] dark:border-[#2A2A2A]"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </button>
            <button
              className="rounded px-3 py-2 text-sm bg-red-600 text-white"
              onClick={async () => {
                if (!pendingDeleteZip) return;
                try {
                  const response = await fetch(
                    `${API_BASE_URL}/cases/${caseId}/uploads/${encodeURIComponent(pendingDeleteZip)}`,
                    { method: "DELETE" },
                  );
                  if (!response.ok) {
                    toast.error("Failed to delete upload");
                  } else {
                    setFiles((prev) =>
                      (prev || []).filter(
                        (g: any) => g.file_name !== pendingDeleteZip,
                      ),
                    );
                    toast.success("Upload deleted");
                  }
                } catch (e) {
                  toast.error("Error deleting upload");
                } finally {
                  setIsDeleteConfirmOpen(false);
                  setPendingDeleteZip(null);
                }
              }}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
