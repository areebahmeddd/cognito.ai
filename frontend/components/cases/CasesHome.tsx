"use client";

import CaseCard, { CaseItem } from "@/components/cases/CaseCard";
import CreateCaseModal from "@/components/cases/CreateCaseModal";
import EditCaseModal from "@/components/cases/EditCaseModal";
import NewCaseCard from "@/components/cases/NewCaseCard";
import ViewCaseModal from "@/components/cases/ViewCaseModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api";
import {
  Archive,
  ArchiveRestore,
  Eye,
  Filter,
  Share2,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  priority_tag?: string;
}

async function loadCases(): Promise<CaseItem[]> {
  try {
    const data = (await apiClient.getCases()) as { cases?: BackendCase[] };
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
        priority_tag: caseData?.priority_tag,
      };
    });
  } catch (error) {
    return [];
  }
}

async function deleteCase(caseId: string): Promise<boolean> {
  try {
    await apiClient.deleteCase(caseId);
    return true;
  } catch (error) {
    return false;
  }
}

async function archiveCase(caseId: string): Promise<boolean> {
  try {
    await apiClient.archiveCase(caseId);
    return true;
  } catch (error) {
    return false;
  }
}

async function activateCase(caseId: string): Promise<boolean> {
  try {
    await apiClient.activateCase(caseId);
    return true;
  } catch (error) {
    return false;
  }
}

export default function CasesHome() {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [archivedItems, setArchivedItems] = useState<CaseItem[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseItem | null>(null);
  const [viewingCase, setViewingCase] = useState<CaseItem | null>(null);
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
        description: "Unable to load your cases. Please try again later.",
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
      case "view":
        const caseToView = (showArchived ? archivedItems : items).find(
          (item) => item.id === id,
        );
        if (caseToView) {
          setViewingCase(caseToView);
          setIsViewModalOpen(true);
        }
        break;
      case "share":
        try {
          const origin =
            typeof window !== "undefined" ? window.location.origin : "";
          const link = `${origin}/cases/${id}`;
          await navigator.clipboard.writeText(link);
          toast.success("Link copied to clipboard successfully", {
            description: "Case link has been copied to your clipboard.",
          });
        } catch (error) {
          toast.error("Failed to copy link", {
            description: "Unable to copy the case link to clipboard.",
          });
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
          toast.success("Case archived successfully", {
            description: "The case has been moved to archived cases.",
          });
          fetchCases();
        } else {
          toast.error("Failed to archive case", {
            description: "Unable to archive the case. Please try again.",
          });
        }
        break;
      case "unarchive":
        const activateSuccess = await activateCase(id);
        if (activateSuccess) {
          toast.success("Case activated successfully", {
            description: "The case has been restored from archived cases.",
          });
          fetchCases();
        } else {
          toast.error("Failed to activate case", {
            description: "Unable to restore the case. Please try again.",
          });
        }
        break;
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      setIsDeletingCase(true);
      const success = await deleteCase(deleteConfirm.id);
      if (success) {
        toast.success("Case deleted successfully", {
          description: "The case has been permanently removed.",
        });
        fetchCases();
      } else {
        toast.error("Failed to delete case", {
          description: "Unable to delete the case. Please try again.",
        });
      }
      setIsDeletingCase(false);
      setDeleteConfirm(null);
    }
  };

  const handleEditSuccess = async (updatedCase: CaseItem) => {
    try {
      await apiClient.updateCase(updatedCase.id, {
        case_name: updatedCase.title,
        description: updatedCase.description,
      });
      toast.success("Case updated successfully", {
        description: "Your case information has been saved.",
      });
      fetchCases();
    } catch (error) {
      toast.error("Failed to update case", {
        description: "Unable to save your changes. Please try again.",
      });
    }

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
                className="px-4 py-2 text-sm font-medium text-[#4A4A4A] dark:text-[#B0B0B0] border border-[#E0E0E0] dark:border-[#2A2A2A] rounded-lg transition-colors duration-200 hover:text-[#FF7F50] hover:border-[#FF7F50] dark:hover:text-[#FF7F50] dark:hover:border-[#FF7F50]"
              >
                {showArchived
                  ? `View Active (${items.length})`
                  : `View Archived (${archivedItems.length})`}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-4 py-2 text-sm font-medium text-[#4A4A4A] dark:text-[#B0B0B0] border border-[#E0E0E0] dark:border-[#2A2A2A] rounded-lg transition-colors duration-200 hover:text-[#FF7F50] hover:border-[#FF7F50] dark:hover:text-[#FF7F50] dark:hover:border-[#FF7F50] flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white dark:bg-[#1A1A1A] border border-[#E0E0E0] dark:border-[#2A2A2A] shadow-lg z-50"
                >
                  <div className="px-2 py-1.5 text-xs text-[#666] dark:text-[#999]">
                    Sort
                  </div>
                  <DropdownMenuItem
                    onClick={() => setSortOrder("desc")}
                    className="hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F] hover:text-[#FF7F50]"
                  >
                    Newest first
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortOrder("asc")}
                    className="hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F] hover:text-[#FF7F50]"
                  >
                    Oldest first
                  </DropdownMenuItem>
                  <div className="px-2 pt-2 pb-1 text-xs text-[#666] dark:text-[#999] border-t border-[#E0E0E0] dark:border-[#2A2A2A] mt-1">
                    Priority
                  </div>
                  <DropdownMenuItem
                    onClick={() => setTagFilter("all")}
                    className={`${tagFilter === "all" ? "bg-[#FFF5F0] dark:bg-[#2A1A0F] text-[#FF7F50]" : ""}`}
                  >
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTagFilter("High Priority")}
                    className={`${tagFilter === "High Priority" ? "bg-[#FFF5F0] dark:bg-[#2A1A0F] text-[#FF7F50]" : ""}`}
                  >
                    High Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTagFilter("Medium Priority")}
                    className={`${tagFilter === "Medium Priority" ? "bg-[#FFF5F0] dark:bg-[#2A1A0F] text-[#FF7F50]" : ""}`}
                  >
                    Medium Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTagFilter("Low Priority")}
                    className={`${tagFilter === "Low Priority" ? "bg-[#FFF5F0] dark:bg-[#2A1A0F] text-[#FF7F50]" : ""}`}
                  >
                    Low Priority
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {!showArchived && <NewCaseCard onCreate={handleCreate} />}
          {[...(showArchived ? archivedItems : items)]
            .filter((c) =>
              tagFilter === "all"
                ? true
                : (c as any).priority_tag === tagFilter,
            )
            .sort((a, b) => {
              const aTime = new Date(a.updatedAt).getTime();
              const bTime = new Date(b.updatedAt).getTime();
              return sortOrder === "desc" ? bTime - aTime : aTime - bTime;
            })
            .map((item, index) => (
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
                            onClick={() => handleMenuAction(item.id, "view")}
                            className="hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F] hover:text-[#FF7F50]"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleMenuAction(item.id, "share")}
                            className="hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F] hover:text-[#FF7F50]"
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleMenuAction(item.id, "archive")}
                            className="hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F] hover:text-[#FF7F50]"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleMenuAction(item.id, "delete")}
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleMenuAction(item.id, "view")}
                            className="hover:bg-[#F8F8F8] dark:hover:bg-[#2A2A2A]"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleMenuAction(item.id, "unarchive")
                            }
                            className="hover:bg-[#F8F8F8] dark:hover:bg-[#2A2A2A]"
                          >
                            <ArchiveRestore className="mr-2 h-4 w-4" />
                            Unarchive
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleMenuAction(item.id, "delete")}
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
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

      <ViewCaseModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingCase(null);
        }}
        onSave={handleEditSuccess}
        caseItem={viewingCase}
        canEdit={!showArchived}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />

          <div className="relative bg-[#FEFEFE] dark:bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[#E0E0E0] dark:border-[#2A2A2A]">
            <button
              aria-label="Close"
              onClick={() => setDeleteConfirm(null)}
              className="absolute top-3 right-3 text-[#666] dark:text-[#999] hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors p-1 rounded-md"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="flex items-start gap-4 mb-6">
              <div className="h-10 w-10 rounded-full bg-[#FFF5F0] dark:bg-[#2A1A0F] flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-[#FF7F50]" />
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
                className="bg-[#2A2A2A] text-white hover:bg-[#1A1A1A] dark:bg-[#E0E0E0] dark:text-[#2A2A2A] dark:hover:bg-[#D0D0D0] transition-all duration-300 py-2 px-4 rounded-lg font-medium"
                disabled={isDeletingCase}
              >
                {isDeletingCase ? "Deleting..." : "Yes, Delete Case"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
