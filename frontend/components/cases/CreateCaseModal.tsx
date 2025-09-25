"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, FileText, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

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
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadFile[] = Array.from(files).map((file) => ({
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
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", uploadFile.file);

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
        reject(new Error("Network error"));
      });

      xhr.open("POST", "http://127.0.0.1:8000/api/v1/data/upload");
      xhr.send(formData);
    });
  };

  const handleSubmit = async () => {
    if (!caseName.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload files one by one
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        if (file.status === "pending") {
          await uploadFile(file);
        }
        setUploadProgress(Math.round(((i + 1) / uploadFiles.length) * 100));
      }

      // Create case data
      const caseData = {
        id: String(Date.now()),
        title: caseName,
        description,
        updatedAt: new Date().toISOString(),
        sourcesCount: uploadFiles.length,
        color: ["#60a5fa", "#f472b6", "#34d399", "#f59e0b", "#a78bfa"][
          Math.floor(Math.random() * 5)
        ],
        files: uploadFiles.map((f) => ({
          name: f.file.name,
          size: f.file.size,
          type: f.file.type,
        })),
      };

      onSuccess(caseData);
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setCaseName("");
      setDescription("");
      setUploadFiles([]);
      setUploadProgress(0);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-800 shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Create New Case
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Case Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="caseName">Case Name *</Label>
              <Input
                id="caseName"
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
                placeholder="Enter case name..."
                disabled={isUploading}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter case description..."
                rows={3}
                disabled={isUploading}
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <Label>Upload Files</Label>
            <div
              className="mt-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Drag and drop files here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500"
                  disabled={isUploading}
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Supported: PDF, DOC, DOCX, TXT, JSON, XML, CSV, LOG, PCAP, ZIP,
                RAR, 7Z
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.json,.xml,.csv,.log,.pcap,.zip,.rar,.7z"
                disabled={isUploading}
              />
            </div>
          </div>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({uploadFiles.length})</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {file.file.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {(file.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.status === "completed" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {file.status === "uploading" && (
                        <div className="w-16">
                          <Progress value={file.progress} className="h-2" />
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        disabled={isUploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Uploading files...
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {uploadProgress}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!caseName.trim() || isUploading}
            className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {isUploading ? "Creating..." : "Create Case"}
          </Button>
        </div>
      </div>
    </div>
  );
}
