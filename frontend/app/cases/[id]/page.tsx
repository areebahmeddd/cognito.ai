"use client";

import CaseSidebar from "@/components/cases/CaseSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EvidenceItem, searchQuery } from "@/lib/search";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CasePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const caseId = params?.id as string;
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EvidenceItem[]>([]);
  const [searchData, setSearchData] = useState<{
    intent: string;
    totalResults: number;
    processingTime: number;
  }>({
    intent: "find messages",
    totalResults: 0,
    processingTime: 0,
  });

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
  }, [searchParams]);

  const handleAnalyze = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const searchResult = await searchQuery(query);
      setResults(searchResult.results);
      setSearchData({
        intent: searchResult.intent,
        totalResults: searchResult.totalResults,
        processingTime: searchResult.processingTime,
      });
    } catch (error) {
      console.error("Search failed:", error);
      // Keep existing results on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar - Full Width */}
        <DashboardNavbar />

        {/* Content Area with Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <CaseSidebar caseId={caseId} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Query Section */}
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Natural Language Query
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Ask questions about your case data in plain English
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="messages about bitcoin"
                      className="flex-1"
                      size={2}
                    />
                    <Button
                      onClick={handleAnalyze}
                      disabled={loading}
                      size="lg"
                    >
                      {loading ? "Analyzing..." : "Analyze"}
                    </Button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Query
                    </div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                      "{query || "Enter a search query"}"
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Intent
                    </div>
                    <div className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-300">
                      {searchData.intent}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Results
                    </div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {searchData.totalResults} matches
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Processing Time
                    </div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {searchData.processingTime}ms
                    </div>
                  </div>
                </div>

                {/* Evidence Timeline */}
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Evidence Timeline
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span>Sorted by timestamp (oldest first)</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {results.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-slate-500 dark:text-slate-400 mb-2">
                          {query
                            ? "No results found for your search"
                            : "Enter a search query to analyze your case data"}
                        </div>
                        <div className="text-sm text-slate-400 dark:text-slate-500">
                          Try searching for specific terms like "crypto",
                          "bitcoin", or "whatsapp"
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {results.map((ev) => (
                          <div
                            key={ev.id}
                            className="border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50"
                          >
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {ev.app}
                                </div>
                                <div className="text-xs text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                                  {ev.id}
                                </div>
                              </div>
                              <div className="text-xs text-slate-500">
                                {ev.timestamp}
                              </div>
                            </div>
                            <div className="p-4 space-y-4">
                              <div className="text-xs text-slate-500 flex items-center gap-3">
                                <span>Sender: {ev.sender}</span>
                                <span>•</span>
                                <span>Group: Crypto market9</span>
                                <span>•</span>
                                <span>Direction: {ev.direction}</span>
                              </div>
                              <div className="text-sm leading-6 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-slate-800 dark:text-slate-200">
                                {ev.content}
                              </div>
                              <div>
                                <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                                  Suspicious Indicators
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {ev.tagBadges.map((t) => (
                                    <span
                                      key={t}
                                      className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-1 text-xs text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800">
                                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Sender Details
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-slate-600 dark:text-slate-400">
                                      Name: {ev.sender}
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-400">
                                      JID: 573176481676@s.whatsapp.net
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-400">
                                      Direction:{" "}
                                      <span className="inline-flex rounded-sm bg-slate-100 dark:bg-slate-700 px-1">
                                        {ev.direction}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800">
                                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Forensic Metadata
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-slate-600 dark:text-slate-400">
                                      Source: {ev.source}
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-400">
                                      Received: {ev.timestamp}
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-400">
                                      Type: Text
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
