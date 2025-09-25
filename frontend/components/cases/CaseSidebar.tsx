"use client";

import { FileText, Upload, ChevronDown, Plus } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import CreateCaseModal from "@/components/cases/CreateCaseModal";

interface CaseSidebarProps {
  caseId: string;
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

export default function CaseSidebar({ caseId }: CaseSidebarProps) {
  const [files, setFiles] = useState<StoredCase["files"]>([]);
  const [title, setTitle] = useState<string>("");
  const [allCases, setAllCases] = useState<StoredCase[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = getCase(caseId);
    setTitle(c?.title || "Case");
    setFiles(c?.files || []);
    
    // Load all cases for dropdown
    setAllCases(getAllCases().sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ));
  }, [caseId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleCaseSwitch = (newCaseId: string) => {
    console.log('Switching to case:', newCaseId);
    window.location.href = `/cases/${newCaseId}`;
  };

  const handleCreateSuccess = (caseData: StoredCase) => {
    // Refresh cases list
    setAllCases(getAllCases().sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ));
    setIsCreateModalOpen(false);
    // Navigate to new case
    window.location.href = `/cases/${caseData.id}`;
  };

  return (
    <>
      <aside className="w-80 h-full flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div ref={dropdownRef} className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 relative">
          <Button 
            variant="ghost" 
            className="w-full justify-between p-2 h-auto hover:bg-slate-50 dark:hover:bg-slate-700"
            onClick={() => {
              console.log('Dropdown trigger clicked, cases:', allCases);
              setIsDropdownOpen(!isDropdownOpen);
            }}
          >
            <div className="text-left flex-1">
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </div>
              <div className="text-sm text-slate-500">
                Case ID: {caseId}
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-500 flex-shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Recent Cases</div>
                <div className="text-xs text-slate-500">Switch between your cases</div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {allCases.length === 0 ? (
                  <div className="px-3 py-4 text-center">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                      No cases found
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
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
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
                      >
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: caseItem.color || '#94a3b8' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium">{caseItem.title}</div>
                          <div className="text-xs text-slate-500">ID: {caseItem.id}</div>
                        </div>
                      </button>
                    ))}
                    {allCases.length > 5 && (
                      <div className="px-3 py-2 text-xs text-slate-500 text-center">
                        +{allCases.length - 5} more cases
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => {
                    setIsCreateModalOpen(true);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
                >
                  <Plus className="h-4 w-4" />
                  Create New Case
                </button>
              </div>
            </div>
          )}
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
      
      <CreateCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
