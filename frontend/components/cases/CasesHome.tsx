"use client";

import CaseCard, { CaseItem } from "@/components/cases/CaseCard";
import CreateCaseModal from "@/components/cases/CreateCaseModal";
import NewCaseCard from "@/components/cases/NewCaseCard";
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
      color: "#34d399",
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

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-slate-100">
          Recent cases
        </h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NewCaseCard onCreate={handleCreate} />
          {items.map((item) => (
            <CaseCard key={item.id} item={item} onOpen={handleOpen} />
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
