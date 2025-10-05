"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CaseItem } from "./CaseCard";

interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCase: CaseItem) => void;
  caseItem: CaseItem | null;
}

export default function EditCaseModal({
  isOpen,
  onClose,
  onSave,
  caseItem,
}: EditCaseModalProps) {
  const [caseName, setCaseName] = useState(caseItem?.title || "");
  const [description, setDescription] = useState(caseItem?.description || "");

  useEffect(() => {
    if (caseItem) {
      setCaseName(caseItem.title || "");
      setDescription(caseItem.description || "");
    }
  }, [caseItem]);

  const handleSave = () => {
    if (!caseItem || !caseName.trim()) {
      toast.error("Case name required", {
        description: "Please enter a valid case name to continue.",
      });
      return;
    }

    if (caseName.trim().length < 3) {
      toast.error("Case name too short", {
        description: "Case name must be at least 3 characters long.",
      });
      return;
    }

    const updatedCase: CaseItem = {
      ...caseItem,
      title: caseName.trim(),
      description: description.trim(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedCase);
    onClose();
  };

  const handleClose = () => {
    setCaseName(caseItem?.title || "");
    setDescription(caseItem?.description || "");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-[#FEFEFE] dark:bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[#E0E0E0] dark:border-[#2A2A2A]">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-2 text-[#666] dark:text-[#999] hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-light text-[#2A2A2A] dark:text-[#E0E0E0] mb-1">
            Edit Case
          </h2>
          <p className="text-sm text-[#666] dark:text-[#999] font-light">
            Update the case name and description
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <div>
            <Label
              htmlFor="case-name"
              className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]"
            >
              Case Name *
            </Label>
            <Input
              id="case-name"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              className="mt-2 border-[#E0E0E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-[#2A2A2A] dark:text-[#E0E0E0] focus:ring-[#FF7F50] focus:border-[#FF7F50]"
              placeholder="Enter case name"
              required
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
              className="mt-2 border-[#E0E0E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-[#2A2A2A] dark:text-[#E0E0E0] focus:ring-[#FF7F50] focus:border-[#FF7F50]"
              placeholder="Enter case description (optional)"
              rows={3}
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-[#E0E0E0] dark:border-[#2A2A2A] text-[#4A4A4A] dark:text-[#B0B0B0] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!caseName.trim()}
              className="bg-[#2A2A2A] text-white hover:bg-[#1A1A1A] dark:bg-[#E0E0E0] dark:text-[#2A2A2A] dark:hover:bg-[#D0D0D0] transition-all duration-300 py-2 px-5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
