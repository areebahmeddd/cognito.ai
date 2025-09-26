"use client";

import CaseCard, { CaseItem } from "@/components/cases/CaseCard";
import CreateCaseModal from "@/components/cases/CreateCaseModal";
import NewCaseCard from "@/components/cases/NewCaseCard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Archive, Edit, Trash2 } from "lucide-react";
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
  const existing = loadCases();
  if (existing.length > 0) return existing;
  const seed: CaseItem[] = [
    {
      id: "1",
      title: "Crypto messaging ring",
      updatedAt: new Date().toISOString(),
      sourcesCount: 3,
      color: "#60a5fa",
    },
    {
      id: "2",
      title: "Foreign communications sweep",
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      sourcesCount: 5,
      color: "#f472b6",
    },
    {
      id: "3",
      title: "Fraud device triage",
      updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      sourcesCount: 2,
      color: "#64748b",
    },
  ];
  saveCases(seed);
  return seed;
}

export default function CasesHome() {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setItems(seedIfEmpty());
  }, []);

  const handleCreate = () => {
    setIsModalOpen(true);
  };

  const handleCreateSuccess = (caseData: CaseItem) => {
    const updated = [caseData, ...items];
    setItems(updated);
    saveCases(updated);
    setIsModalOpen(false);
  };

  const handleOpen = (id: string) => {
    window.location.href = `/cases/${id}`;
  };

  const handleMenuAction = (id: string, action: string) => {
    switch (action) {
      case "edit":
        // TODO: Implement edit functionality
        console.log("Edit case:", id);
        break;
      case "delete":
        if (confirm("Are you sure you want to delete this case?")) {
          const updated = items.filter((item) => item.id !== id);
          setItems(updated);
          saveCases(updated);
        }
        break;
      case "archive":
        // TODO: Implement archive functionality
        console.log("Archive case:", id);
        break;
    }
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Recent cases
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage and analyze your forensic cases
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <NewCaseCard onCreate={handleCreate} />
          {items.map((item) => (
            <div key={item.id} className="relative">
              <CaseCard item={item} onOpen={handleOpen} />
              <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => handleMenuAction(item.id, "edit")}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit name
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleMenuAction(item.id, "archive")}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleMenuAction(item.id, "delete")}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
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
    </>
  );
}
