"use client";

import { X } from "lucide-react";
import type { ResultItemData } from "./ResultItem";

interface DetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  item: (ResultItemData & { fullText?: string }) | null;
}

export default function DetailsDrawer({
  open,
  onClose,
  item,
}: DetailsDrawerProps) {
  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md transform bg-white dark:bg-slate-900 shadow-xl transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Details
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          {item ? (
            <div className="space-y-2">
              <div className="text-sm text-slate-500">
                {item.channel.toUpperCase()}
              </div>
              <div className="text-sm text-slate-900 dark:text-slate-100">
                “{item.snippet}”
              </div>
              <div className="text-xs text-slate-500">
                {new Date(item.timestampISO).toLocaleString()}
              </div>
              {item.fullText ? (
                <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {item.fullText}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No item selected.</div>
          )}
        </div>
      </aside>
    </div>
  );
}
