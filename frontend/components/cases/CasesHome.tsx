"use client";

import CaseCard, { CaseItem } from "@/components/cases/CaseCard";
import CreateCaseModal from "@/components/cases/CreateCaseModal";
import EditCaseModal from "@/components/cases/EditCaseModal";
import NewCaseCard from "@/components/cases/NewCaseCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Archive, ArchiveRestore, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "cognito-cases";

function loadCases(): CaseItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CaseItem[];
  } catch {
    return [];
  }
}

function saveCases(items: CaseItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function seedIfEmpty() {
  saveCases([]);
  return [];
}

export default function CasesHome() {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [archivedItems, setArchivedItems] = useState<CaseItem[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/cases/");
      if (response.ok) {
        const data = await response.json();
        const frontendCases = data.cases.map((caseItem: any) => ({
          id: caseItem.id,
          title: caseItem.title,
          updatedAt: caseItem.updated_at,
          color: ["#FF7F50", "#FF7F50", "#FF7F50", "#FF7F50", "#FF7F50"][
            Math.floor(Math.random() * 5)
          ],
        }));
        setItems(frontendCases);
        saveCases(frontendCases);
      } else {
        setItems(seedIfEmpty());
      }
    } catch (error) {
      console.error("Failed to fetch cases:", error);
      setItems(seedIfEmpty());
    }
  };

  const handleCreate = () => {
    setIsModalOpen(true);
  };

  const handleCreateSuccess = (caseData: CaseItem) => {
    fetchCases();
    setIsModalOpen(false);
  };

  const handleOpen = (id: string) => {
    window.location.href = `/cases/${id}`;
  };

  const handleMenuAction = (id: string, action: string) => {
    switch (action) {
      case "edit":
        const caseToEdit = items.find((item) => item.id === id);
        if (caseToEdit) {
          setEditingCase(caseToEdit);
          setIsEditModalOpen(true);
        }
        break;
      case "delete":
        const caseToDelete = showArchived
          ? archivedItems.find((item) => item.id === id)
          : items.find((item) => item.id === id);
        if (caseToDelete) {
          setDeleteConfirm({ id, title: caseToDelete.title });
        }
        break;
      case "archive":
        const caseToArchive = items.find((item) => item.id === id);
        if (caseToArchive) {
          const updated = items.filter((item) => item.id !== id);
          setItems(updated);
          saveCases(updated);
          setArchivedItems((prev) => [...prev, caseToArchive]);
        }
        break;
      case "unarchive":
        const caseToUnarchive = archivedItems.find((item) => item.id === id);
        if (caseToUnarchive) {
          const updated = archivedItems.filter((item) => item.id !== id);
          setArchivedItems(updated);
          setItems((prev) => [...prev, caseToUnarchive]);
          saveCases([...items, caseToUnarchive]);
        }
        break;
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      if (showArchived) {
        const updated = archivedItems.filter(
          (item) => item.id !== deleteConfirm.id,
        );
        setArchivedItems(updated);
      } else {
        const updated = items.filter((item) => item.id !== deleteConfirm.id);
        setItems(updated);
        saveCases(updated);
      }
      setDeleteConfirm(null);
    }
  };

  const handleEditSuccess = (updatedCase: CaseItem) => {
    const updated = items.map((item) =>
      item.id === updatedCase.id ? updatedCase : item,
    );
    setItems(updated);
    saveCases(updated);
    setIsEditModalOpen(false);
    setEditingCase(null);
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light tracking-tight text-[#2A2A2A] dark:text-[#E0E0E0] mb-2">
                {showArchived ? "Archived" : "Recent"}{" "}
                <span className="text-[#FF7F50]">Cases</span>
              </h1>
              <p className="text-[#4A4A4A] dark:text-[#B0B0B0] font-light">
                {showArchived
                  ? "View and manage archived cases"
                  : "Manage and analyze your forensic cases"}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="px-4 py-2 text-sm font-medium text-[#4A4A4A] dark:text-[#B0B0B0] border border-[#E0E0E0] dark:border-[#2A2A2A] rounded-lg hover:bg-[#F8F8F8] dark:hover:bg-[#2A2A2A] transition-colors duration-200"
              >
                {showArchived
                  ? `View Active (${items.length})`
                  : `View Archived (${archivedItems.length})`}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {!showArchived && <NewCaseCard onCreate={handleCreate} />}
          {(showArchived ? archivedItems : items).map((item, index) => (
            <div key={item.id} className="relative group">
              <CaseCard item={item} onOpen={handleOpen} index={index} />
              <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-6 w-6 p-0 rounded-md text-[#666] dark:text-[#999] hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors duration-200">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-white dark:bg-[#1A1A1A] border border-[#E0E0E0] dark:border-[#2A2A2A] shadow-lg z-50"
                  >
                    {!showArchived ? (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleMenuAction(item.id, "edit")}
                          className="hover:bg-[#F8F8F8] dark:hover:bg-[#2A2A2A] cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleMenuAction(item.id, "archive")}
                          className="hover:bg-[#F8F8F8] dark:hover:bg-[#2A2A2A] cursor-pointer"
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleMenuAction(item.id, "delete")}
                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleMenuAction(item.id, "unarchive")}
                          className="hover:bg-[#F8F8F8] dark:hover:bg-[#2A2A2A] cursor-pointer"
                        >
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          Unarchive
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleMenuAction(item.id, "delete")}
                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditCaseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCase(null);
        }}
        onSave={handleEditSuccess}
        caseItem={editingCase}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-xl bg-white dark:bg-[#1A1A1A] border border-[#E0E0E0] dark:border-[#2A2A2A] shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                    Delete Case
                  </h3>
                  <p className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0]">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <p className="text-[#4A4A4A] dark:text-[#B0B0B0] mb-6">
                Are you sure you want to delete{" "}
                <span className="font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                  "{deleteConfirm.title}"
                </span>
                ? This will permanently remove the case and all its data.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-[#4A4A4A] dark:text-[#B0B0B0] border border-[#E0E0E0] dark:border-[#2A2A2A] rounded-lg hover:bg-[#F8F8F8] dark:hover:bg-[#2A2A2A] transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                >
                  Delete Case
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
