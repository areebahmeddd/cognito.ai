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
        <div className="flex h-screen bg-white dark:bg-slate-900">
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
            {/* Query Section */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search case data... (e.g., 'messages about bitcoin')"
                      className="h-10 border border-slate-200 dark:border-slate-700 pr-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={loading || !query.trim()}
                    className="h-10 px-6 bg-accent hover:bg-accent/80 text-white"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </div>
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>
              </div>
            </div>
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="space-y-0 w-full min-w-0">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-0 w-full min-w-0">
                  <div className="bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-6 md:col-span-2 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">AI Intent</div>
                        <div className="text-sm font-semibold text-green-700 dark:text-green-300 truncate">
                          {searchData.intent}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-6 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Results Found</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {searchData.totalResults}
                        </div>
                        <div className="text-xs text-slate-500">matches</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border-r border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-6 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Processing Time</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {searchData.processingTime}
                        </div>
                        <div className="text-xs text-slate-500">milliseconds</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence Timeline */}
                <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                  <div className="px-6 py-4 border-b border-r border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-sm flex items-center justify-center">
                          <svg className="w-3 h-3 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          Evidence Timeline
                        </h2>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Oldest first
                      </div>
                    </div>
                  </div>
                  <div className="">
                    {results.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                          {query ? "No evidence found" : "Ready to analyze"}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 max-w-md mx-auto">
                          {query
                            ? "No results found for your search. Try different keywords or broaden your search."
                            : "Enter a search query above to analyze your case data and find relevant evidence."}
                        </p>
                        {!query && (
                          <div className="flex flex-wrap gap-1 justify-center">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                              "cryptocurrency"
                            </span>
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                              "bitcoin"
                            </span>
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                              "whatsapp"
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="">
                        {results.map((ev, index) => (
                          <div
                            key={ev.id}
                            className="border-b border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                          >
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-sm flex items-center justify-center">
                                    <svg className="w-3 h-3 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                      {ev.app}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      #{String(index + 1).padStart(3, '0')}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-xs text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 font-mono rounded-full">
                                    {ev.id}
                                  </div>
                                  <div className={`text-xs px-2 py-1 font-medium rounded-full ${
                                    ev.direction === 'Incoming' 
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  }`}>
                                    {ev.direction}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-slate-500">
                                {ev.timestamp}
                              </div>
                            </div>
                            <div className="p-6 space-y-4">
                              {/* Message Content */}
                              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-200 dark:border-slate-700">
                                <div className="text-sm text-slate-800 dark:text-slate-200">
                                  {ev.content}
                                </div>
                              </div>

                              {/* Sender Info */}
                              <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-sm flex items-center justify-center">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                      {ev.sender.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="font-medium text-slate-700 dark:text-slate-300">{ev.sender}</span>
                                </div>
                                <div className="text-slate-400">•</div>
                                <div className="text-slate-500">Group: Crypto market9</div>
                              </div>

                              {/* Tags */}
                              {ev.tagBadges.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Tags
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {ev.tagBadges.map((tag) => (
                                      <span
                                        key={tag}
                                        className="inline-flex items-center bg-amber-100 dark:bg-amber-900/30 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 rounded-full"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Metadata Grid */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-200 dark:border-slate-700">
                                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Sender Details
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Name:</span>
                                      <span className="text-slate-700 dark:text-slate-300">{ev.sender}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">JID:</span>
                                      <span className="text-slate-700 dark:text-slate-300 font-mono">573176481676@s.whatsapp.net</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Direction:</span>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        ev.direction === 'Incoming' 
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                      }`}>
                                        {ev.direction}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-200 dark:border-slate-700">
                                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Forensic Data
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Source:</span>
                                      <span className="text-slate-700 dark:text-slate-300 font-mono">{ev.source}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Timestamp:</span>
                                      <span className="text-slate-700 dark:text-slate-300">{ev.timestamp}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Type:</span>
                                      <span className="text-slate-700 dark:text-slate-300">Text Message</span>
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
