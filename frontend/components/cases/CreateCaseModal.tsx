"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, File, Loader2, Trash2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (caseData: any) => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

export default function CreateCaseModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCaseModalProps) {
  const [caseName, setCaseName] = useState("");
  const [description, setDescription] = useState("");
  const [priorityTag, setPriorityTag] = useState<string>("");
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("Uploading files...");
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    setError("");

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file) => {
      if (
        file.type === "application/zip" ||
        file.name.toLowerCase().endsWith(".zip") ||
        file.name.toLowerCase().endsWith(".ufdr")
      ) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      const msg = `Invalid file types: ${invalidFiles.join(", ")}. Only UFDR files are allowed.`;
      setError(msg);
      toast.error("Invalid files", { description: msg });
    }

    const newFiles: UploadFile[] = validFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending",
    }));

    setUploadFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFile = async (
    uploadFile: UploadFile,
    caseId: string,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", uploadFile.file);
      formData.append("case_id", caseId);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, progress, status: "uploading" }
                : f,
            ),
          );
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, progress: 100, status: "completed" }
                : f,
            ),
          );
          resolve();
        } else {
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: "error", error: "Upload failed" }
                : f,
            ),
          );
          toast.error("Upload failed", { description: uploadFile.file.name });
          reject(new Error("Upload failed"));
        }
      });

      xhr.addEventListener("error", () => {
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "error", error: "Network error" }
              : f,
          ),
        );
        toast.error("Network error", { description: uploadFile.file.name });
        reject(new Error("Network error"));
      });

      xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/data/upload`);
      xhr.send(formData);
    });
  };

  const handleSubmit = async () => {
    if (!caseName.trim()) {
      const message = "Case name is required";
      setError(message);
      toast.error("Invalid case name", { description: message });
      return;
    }

    if (caseName.trim().length < 3) {
      const message = "Case name must be at least 3 characters long";
      setError(message);
      toast.error("Invalid case name", { description: message });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    const statusMessages =
      uploadFiles.length > 0
        ? [
            "Uploading forensic files...",
            "Processing UFDR files...",
            "Processing digital evidence...",
            "Extracting file metadata...",
            "Matching forensic patterns...",
            "Building search index...",
          ]
        : [
            "Creating case...",
            "Setting up case structure...",
            "Initializing case data...",
          ];

    let statusIndex = 0;
    const statusInterval = setInterval(
      () => {
        if (statusIndex < statusMessages.length - 1) {
          statusIndex++;
          setCurrentStatus(statusMessages[statusIndex]);
        }
      },
      uploadFiles.length > 0 ? 1200 : 800,
    );

    try {
      const caseResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cases/case`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: caseName,
            description: description,
            priority_tag: priorityTag || undefined,
          }),
        },
      );

      if (!caseResponse.ok) {
        throw new Error("Failed to create case");
      }

      const caseData = await caseResponse.json();
      const caseId = caseData.case_id;

      if (uploadFiles.length > 0) {
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 95) return prev;
            return Math.round(prev + Math.random() * 3);
          });
        }, 200);

        for (let i = 0; i < uploadFiles.length; i++) {
          const file = uploadFiles[i];
          if (file.status === "pending") {
            try {
              await uploadFile(file, caseId);
            } catch (error) {
              toast.error("Failed to upload file", {
                description: file.file.name,
              });
              throw error;
            }
          }
          const fileProgress = Math.round(((i + 1) / uploadFiles.length) * 90);
          setUploadProgress(fileProgress);
        }

        setUploadProgress(100);
        clearInterval(progressInterval);
      } else {
        setUploadProgress(100);
      }

      const frontendCaseData = {
        id: caseId,
        title: caseName,
        description,
        updatedAt: new Date().toISOString(),
        color: ["#FF7F50", "#FF7F50", "#FF7F50", "#FF7F50", "#FF7F50"][
          Math.floor(Math.random() * 5)
        ],
        priority_tag: priorityTag,
        files: uploadFiles.map((f) => ({
          name: f.file.name,
          size: f.file.size,
          type: f.file.type,
        })),
      };

      onSuccess(frontendCaseData);
      onClose();

      if (uploadFiles.length > 0) {
        window.location.href = `/cases/${caseId}`;
      } else {
        window.location.href = `/cases`;
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create case. Please try again.";
      setError(message);
    } finally {
      clearInterval(statusInterval);
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setCaseName("");
      setDescription("");
      setPriorityTag("");
      setUploadFiles([]);
      setUploadProgress(0);
      setError("");
      setCurrentStatus("Uploading files...");
      setIsDragOver(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm ${isUploading ? "pointer-events-none" : ""}`}
        onClick={handleClose}
      />

      <div
        className={`relative bg-[#FEFEFE] dark:bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl border border-[#E0E0E0] dark:border-[#2A2A2A] max-h-[90vh] overflow-y-auto ${isUploading ? "pointer-events-none" : ""}`}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-2 text-[#666] dark:text-[#999] hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-light text-[#2A2A2A] dark:text-[#E0E0E0] mb-1">
            Create New Case
          </h2>
          <p className="text-sm text-[#666] dark:text-[#999] font-light">
            Start a new forensic analysis case with your evidence files
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-3">
            <div>
              <Label
                htmlFor="caseName"
                className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]"
              >
                Case Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="caseName"
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
                placeholder="Enter case name..."
                disabled={isUploading}
                className="mt-1 border-[#E0E0E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-[#2A2A2A] dark:text-[#E0E0E0] focus:ring-[#FF7F50] focus:border-[#FF7F50]"
              />
            </div>
            <div>
              <Label
                htmlFor="description"
                className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]"
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter case description..."
                rows={3}
                disabled={isUploading}
                className="mt-1 border-[#E0E0E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-[#2A2A2A] dark:text-[#E0E0E0] focus:ring-[#FF7F50] focus:border-[#FF7F50]"
              />
            </div>
            <div>
              <Label
                htmlFor="priority"
                className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]"
              >
                Priority Tag
              </Label>
              <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  {
                    value: "High Priority",
                    color: "bg-red-500/10 text-red-600",
                  },
                  {
                    value: "Medium Priority",
                    color: "bg-amber-500/10 text-amber-600",
                  },
                  {
                    value: "Low Priority",
                    color: "bg-emerald-500/10 text-emerald-600",
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setPriorityTag((prev) =>
                        prev === opt.value ? "" : opt.value,
                      )
                    }
                    className={`px-3 py-2 rounded-lg text-xs border transition-colors ${
                      priorityTag === opt.value
                        ? `border-[#FF7F50] ${opt.color}`
                        : "border-[#E0E0E0] dark:border-[#2A2A2A] text-[#4A4A4A] dark:text-[#B0B0B0] hover:border-[#FF7F50]"
                    }`}
                    disabled={isUploading}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
              Upload Files
            </Label>
            <div
              className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 hover:border-[#FF7F50] dark:hover:border-[#FF7F50] ${
                isDragOver
                  ? "border-[#FF7F50] bg-[#FFF5F0] dark:bg-[#2A1A0F]"
                  : "border-[#E0E0E0] dark:border-[#2A2A2A]"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="w-10 h-10 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg flex items-center justify-center mx-auto mb-3">
                <Upload className="w-5 h-5 text-[#FF7F50]" />
              </div>
              <p className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0] mb-1">
                {isDragOver ? "Drop files here" : "Drag & drop files here or"}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[#FF7F50] underline font-medium hover:text-[#FF6B35] transition-colors"
                disabled={isUploading}
              >
                {isDragOver ? "" : "choose files"}
              </button>
              <p className="text-xs text-[#666] dark:text-[#999] mt-2">
                Supported file types: .ufdr
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                accept=".zip,.ufdr,application/x-zip-compressed"
                disabled={isUploading}
              />
            </div>
          </div>

          {uploadFiles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                Selected Files ({uploadFiles.length})
              </Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-[#F8F8F8] dark:bg-[#2A2A2A] rounded-lg border border-[#E0E0E0] dark:border-[#2A2A2A]"
                  >
                    <div className="flex items-center space-x-3">
                      <File className="h-4 w-4 text-[#FF7F50]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0] truncate">
                          {file.file.name}
                        </p>
                        <p className="text-xs text-[#666] dark:text-[#999]">
                          {(file.file.size / 1024).toFixed(1)} KB •{" "}
                          {file.file.type || "application/x-zip-compressed"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.status === "error" && (
                        <div className="w-6 h-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 text-[#666] dark:text-[#999] hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        disabled={isUploading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#4A4A4A] dark:text-[#B0B0B0]">
                  {currentStatus}
                </span>
                <span className="text-[#4A4A4A] dark:text-[#B0B0B0]">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-[#E0E0E0] dark:bg-[#2A2A2A] rounded-full h-2 relative overflow-hidden">
                <div
                  className="bg-[#FF7F50] h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
            className="border-[#E0E0E0] dark:border-[#2A2A2A] text-[#4A4A4A] dark:text-[#B0B0B0] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!caseName.trim() || isUploading}
            className="bg-[#2A2A2A] text-white hover:bg-[#1A1A1A] dark:bg-[#E0E0E0] dark:text-[#2A2A2A] dark:hover:bg-[#D0D0D0] transition-all duration-300 py-2 px-5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Case...</span>
              </div>
            ) : (
              "Create Case"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
