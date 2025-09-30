"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { CaseItem } from "./CaseCard";

interface ViewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCase: CaseItem) => void;
  caseItem: CaseItem | null;
  canEdit?: boolean;
}

export default function ViewCaseModal({
  isOpen,
  onClose,
  onSave,
  caseItem,
  canEdit = true,
}: ViewCaseModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [caseName, setCaseName] = useState(caseItem?.title || "");
  const [description, setDescription] = useState(caseItem?.description || "");

  useEffect(() => {
    if (caseItem) {
      setCaseName(caseItem.title || "");
      setDescription(caseItem.description || "");
      setIsEditing(false);
    }
  }, [caseItem]);

  if (!isOpen || !caseItem) return null;

  const handleClose = () => {
    setIsEditing(false);
    setCaseName(caseItem.title || "");
    setDescription(caseItem.description || "");
    onClose();
  };

  const handleSave = () => {
    const updated: CaseItem = {
      ...caseItem,
      title: caseName.trim(),
      description: description.trim(),
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    setIsEditing(false);
  };

  const createdAt = caseItem.createdAt || caseItem.updatedAt;
  const updatedAt = caseItem.updatedAt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-[#FEFEFE] dark:bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl border border-[#E0E0E0] dark:border-[#2A2A2A]">
        <button
          aria-label="Close"
          onClick={handleClose}
          className="absolute top-3 right-3 text-[#666] dark:text-[#999] hover:text-[#FF7F50] transition-colors p-1 rounded-md"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-light text-[#2A2A2A] dark:text-[#E0E0E0] mb-1">
            Case Details
          </h2>
          <p className="text-sm text-[#666] dark:text-[#999] font-light">
            View or edit case information
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
              Case Name
            </Label>
            {isEditing ? (
              <Input
                className="mt-2 border-[#E0E0E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-[#2A2A2A] dark:text-[#E0E0E0] focus:ring-[#FF7F50] focus:border-[#FF7F50]"
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
                placeholder="Enter case name"
              />
            ) : (
              <div className="mt-2 text-[#2A2A2A] dark:text-[#E0E0E0]">
                {caseItem.title}
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
              Description
            </Label>
            {isEditing ? (
              <Textarea
                className="mt-2 border-[#E0E0E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-[#2A2A2A] dark:text-[#E0E0E0] focus:ring-[#FF7F50] focus:border-[#FF7F50]"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
              />
            ) : (
              <div className="mt-2 text-[#4A4A4A] dark:text-[#B0B0B0] whitespace-pre-wrap">
                {caseItem.description || "—"}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                Created On
              </Label>
              <div className="mt-1 text-sm text-[#4A4A4A] dark:text-[#B0B0B0]">
                {new Date(createdAt).toLocaleString()}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                Last Updated
              </Label>
              <div className="mt-1 text-sm text-[#4A4A4A] dark:text-[#B0B0B0]">
                {new Date(updatedAt).toLocaleString()}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                Created By
              </Label>
              <div className="mt-1 text-sm text-[#4A4A4A] dark:text-[#B0B0B0]">
                Not available
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                Collaborators
              </Label>
              <div className="mt-1 text-sm text-[#4A4A4A] dark:text-[#B0B0B0]">
                Not available
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {canEdit && !isEditing ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="border-[#E0E0E0] dark:border-[#2A2A2A] text-[#4A4A4A] dark:text-[#B0B0B0] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A]"
              >
                Edit
              </Button>
            ) : canEdit ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setCaseName(caseItem.title || "");
                    setDescription(caseItem.description || "");
                  }}
                  className="border-[#E0E0E0] dark:border-[#2A2A2A] text-[#4A4A4A] dark:text-[#B0B0B0] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!caseName.trim()}
                  className="bg-[#2A2A2A] text-white hover:bg-[#1A1A1A] dark:bg-[#E0E0E0] dark:text-[#2A2A2A] dark:hover:bg-[#D0D0D0] transition-all duration-300 py-2 px-5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
