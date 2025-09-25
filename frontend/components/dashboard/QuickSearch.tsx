"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface QuickSearchProps {
  placeholder?: string;
}

export default function QuickSearch({
  placeholder = "Search messages",
}: QuickSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = useMemo(
    () => searchParams.get("q") || "",
    [searchParams],
  );
  const [query, setQuery] = useState<string>(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const onSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const params = new URLSearchParams(window.location.search);
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      router.replace(`/dashboard?${params.toString()}`);
    },
    [query, router],
  );

  return (
    <form onSubmit={onSubmit} className="flex w-full items-center gap-2">
      <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2">
        <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <input
          aria-label="Search query"
          className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        aria-label="Search"
      >
        Search
      </button>
    </form>
  );
}
