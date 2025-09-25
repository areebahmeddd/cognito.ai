"use client";

import { FileText, Upload } from "lucide-react";
import { useEffect, useState } from "react";

interface CaseSidebarProps {
  caseId: string;
}

interface StoredCase {
  id: string;
  title: string;
  files?: { name: string; size: number; type: string }[];
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

export default function CaseSidebar({ caseId }: CaseSidebarProps) {
  const [files, setFiles] = useState<StoredCase["files"]>([]);
  const [title, setTitle] = useState<string>("");

  useEffect(() => {
    const c = getCase(caseId);
    setTitle(c?.title || "Case");
    setFiles(c?.files || []);
  }, [caseId]);

  return (
    <aside className="w-80 h-full flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </div>
        <div className="text-sm text-slate-500">
          {files?.length || 0} files uploaded
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <button className="w-full inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Upload className="mr-2 h-4 w-4" /> Add files
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {files && files.length > 0 ? (
              files.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <FileText className="h-5 w-5 text-slate-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {f.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {(f.size / 1024).toFixed(1)} KB • {f.type}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  No files uploaded yet
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Use "Add files" to upload sources
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
