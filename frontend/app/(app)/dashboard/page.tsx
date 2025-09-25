"use client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import DetailsDrawer from "@/components/dashboard/DetailsDrawer";
import EmptyState from "@/components/dashboard/EmptyState";
import QuickSearch from "@/components/dashboard/QuickSearch";
import type { ResultItemData } from "@/components/dashboard/ResultItem";
import ResultStats from "@/components/dashboard/ResultStats";
import ResultsList from "@/components/dashboard/ResultsList";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  const params = useSearchParams();
  const query = useMemo(() => params.get("q") || "", [params]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ResultItemData[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<
    (ResultItemData & { fullText?: string }) | null
  >(null);
  const total = items.length;

  useEffect(() => {
    let aborted = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = await res.json();
        if (!aborted) {
          setItems(data.items || []);
        }
      } catch (e: unknown) {
        if (!aborted)
          setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    run();
    return () => {
      aborted = true;
    };
  }, [query]);

  const handleDetails = async (item: ResultItemData) => {
    try {
      // For mock, fetch again to get fullText if present
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const withFull =
        (data.items || []).find((i: any) => i.id === item.id) || item;
      setSelected(withFull);
      setDrawerOpen(true);
    } catch {
      setSelected(item);
      setDrawerOpen(true);
    }
  };

  const handleAdd = (item: ResultItemData) => {
    // Placeholder: hook to future action
    // eslint-disable-next-line no-console
    console.log("Add", item);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navbar />
      <main className="flex-1 px-6 py-6">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <div className="mb-3 text-sm font-medium text-slate-900 dark:text-slate-100">
              🔍 Quick Search
            </div>
            <QuickSearch placeholder="Search messages (e.g. crypto msgs)" />
          </div>

          <ResultStats total={total} query={query} />

          {loading ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-sm text-slate-600 dark:text-slate-300">
              Loading…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          ) : items.length === 0 ? (
            <EmptyState message="Try a different search term." />
          ) : (
            <div className="space-y-3">
              {items.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                  <div className="mb-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                    Results
                  </div>
                  <ResultsList
                    items={items}
                    onDetails={handleDetails}
                    onAdd={handleAdd}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <DetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        item={selected}
      />
    </div>
  );
}
