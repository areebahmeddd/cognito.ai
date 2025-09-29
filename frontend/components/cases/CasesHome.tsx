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
import { toast } from "sonner";

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

async function loadCases(): Promise<CaseItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/`);
    if (!response.ok) {
      throw new Error("Failed to fetch cases");
    }
    const data = await response.json();
    const backendCases: BackendCase[] = data.cases || [];

    return backendCases.map((caseData) => {
      const uploads = Array.isArray(caseData?.metadata?.uploads)
        ? caseData.metadata.uploads
        : [];
      const totalUploads = uploads.length;
      return {
        id: caseData.case_id,
        title: caseData.case_name,
        description: caseData.description,
        updatedAt: caseData.updated_at,
        createdAt: caseData.created_at,
        color: ["#FF7F50", "#FF7F50", "#FF7F50", "#FF7F50", "#FF7F50"][
          Math.floor(Math.random() * 5)
        ],
        files: [],
        status: caseData.status,
        filesCount: totalUploads,
      };
    });
  } catch (error) {
    return [];
  }
}

async function deleteCase(caseId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function archiveCase(caseId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/archive`, {
      method: "POST",
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function activateCase(caseId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/activate`, {
      method: "POST",
    });
    return response.ok;
  } catch (error) {
    return false;
  }
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
  const [isDeletingCase, setIsDeletingCase] = useState(false);
  const [indexById, setIndexById] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const cases = await loadCases();
      const indexMap: Record<string, number> = {};
      cases.forEach((c, i) => {
        indexMap[c.id] = i + 1;
      });

      const activeCases = cases.filter((c) => c.status !== "archived");
      const archivedCases = cases
        .filter((c) => c.status === "archived")
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      setItems(activeCases);
      setArchivedItems(archivedCases);
      setIndexById(indexMap);
    } catch (error) {
      toast.error("Failed to load cases", {
        description: "Please try again later",
      });
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

  const handleMenuAction = async (id: string, action: string) => {
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
        const success = await archiveCase(id);
        if (success) {
          toast.success("Case archived");
          fetchCases();
        } else {
          toast.error("Failed to archive case");
        }
        break;
      case "unarchive":
        const activateSuccess = await activateCase(id);
        if (activateSuccess) {
          toast.success("Case activated");
          fetchCases();
        } else {
          toast.error("Failed to activate case");
        }
        break;
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      setIsDeletingCase(true);
      const success = await deleteCase(deleteConfirm.id);
      if (success) {
        toast.success("Case deleted");
        fetchCases();
      } else {
        toast.error("Failed to delete case");
      }
      setIsDeletingCase(false);
      setDeleteConfirm(null);
    }
  };

  const handleEditSuccess = async (updatedCase: CaseItem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${updatedCase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_name: updatedCase.title,
          description: updatedCase.description,
        }),
      });

      if (response.ok) {
        toast.success("Case updated");
        fetchCases();
      } else {
        toast.error("Failed to update case");
      }
    } catch (error) {
      toast.error("Failed to update case");
    }

    setIsEditModalOpen(false);
    setEditingCase(null);
  };

  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" />
      )}
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
            <div key={`${item.id}-${index}`} className="relative group">
              <CaseCard
                item={item}
                onOpen={handleOpen}
                index={Math.max((indexById[item.id] ?? index) - 1, 0)}
              />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />

          <div className="relative bg-[#FEFEFE] dark:bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[#E0E0E0] dark:border-[#2A2A2A]">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-1">
                  Delete Case
                </h2>
                <p className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0]">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                    "{deleteConfirm.title}"
                  </span>
                  ? This will permanently remove the case and all its data.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => !isDeletingCase && setDeleteConfirm(null)}
                className="border-[#E0E0E0] dark:border-[#2A2A2A] text-[#4A4A4A] dark:text-[#B0B0B0] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-all duration-300 py-2 px-4 rounded-lg font-medium"
                disabled={isDeletingCase}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-red-600 text-white hover:bg-red-700 transition-all duration-300 py-2 px-4 rounded-lg font-medium"
                disabled={isDeletingCase}
              >
                {isDeletingCase ? "Deleting..." : "Delete Case"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
