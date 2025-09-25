import { Search } from "lucide-react";

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({
  message = "No results found",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
      <div className="mb-3 rounded-xl bg-slate-100 dark:bg-slate-700 p-3">
        <Search className="h-5 w-5 text-slate-500" aria-hidden="true" />
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-300">
        {message}
      </div>
    </div>
  );
}
