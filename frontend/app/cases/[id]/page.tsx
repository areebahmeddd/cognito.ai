"use client";

import CaseSidebar from "@/components/cases/CaseSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EvidenceItem, searchQuery } from "@/lib/search";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type TabType = "search" | "timeline" | "network" | "summary";

export default function CasePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const caseId = params?.id as string;
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("search");
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
      console.log(searchResult);
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
            <div className="bg-white dark:bg-slate-800 border-b h-18 border-slate-200 dark:border-slate-700 p-4">
              <div className="mx-auto">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search case data... (e.g., 'messages about bitcoin')"
                      className="h-10 border border-slate-200 dark:border-slate-700 pr-10"
                      onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
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
                {/* Tab Navigation */}
                <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex">
                    {[
                      { id: "search", label: "Search Results", icon: "🔍" },
                      { id: "timeline", label: "Timeline", icon: "📅" },
                      { id: "network", label: "Network", icon: "🌐" },
                      { id: "summary", label: "Summary", icon: "📊" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? "border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100"
                            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                      >
                        <span className="text-base">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-0 w-full min-w-0">
                  <div className="bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-6 md:col-span-2 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          AI Intent
                        </div>
                        <div className="text-sm font-semibold text-green-700 dark:text-green-300 truncate">
                          {searchData.intent}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-6 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-purple-600 dark:text-purple-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Results Found
                        </div>
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
                        <svg
                          className="w-5 h-5 text-orange-600 dark:text-orange-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Processing Time
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {searchData.processingTime}
                        </div>
                        <div className="text-xs text-slate-500">
                          milliseconds
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === "search" && (
                  <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <div className="px-4 py-4 border-b border-r border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-sm flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-slate-600 dark:text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                              />
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
                            <svg
                              className="w-6 h-6 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
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
                              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-sm flex items-center justify-center">
                                      <svg
                                        className="w-3 h-3 text-slate-600 dark:text-slate-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {ev.app}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        #{String(index + 1).padStart(3, "0")}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 font-mono rounded-full">
                                      {ev.id}
                                    </div>
                                    <div
                                      className={`text-xs px-2 py-1 font-medium rounded-full ${
                                        ev.direction === "Incoming"
                                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                      }`}
                                    >
                                      {ev.direction}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-slate-500">
                                  {ev.timestamp}
                                </div>
                              </div>
                              <div className="p-4 space-y-4">
                                {/* Message Content */}
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
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
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                      {ev.sender}
                                    </span>
                                  </div>
                                  <div className="text-slate-400">•</div>
                                  <div className="text-slate-500">
                                    Group: Crypto market9
                                  </div>
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
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  <div className="bg-slate-50 rounded-lg dark:bg-slate-900/50 p-3 border border-slate-200 dark:border-slate-700">
                                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                      Sender Details
                                    </div>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Name:
                                        </span>
                                        <span className="text-slate-700 dark:text-slate-300">
                                          {ev.sender}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          JID:
                                        </span>
                                        <span className="text-slate-700 dark:text-slate-300 font-mono">
                                          573176481676@s.whatsapp.net
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Direction:
                                        </span>
                                        <span
                                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            ev.direction === "Incoming"
                                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                          }`}
                                        >
                                          {ev.direction}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-slate-50 rounded-lg dark:bg-slate-900/50 p-3 border border-slate-200 dark:border-slate-700">
                                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                      Forensic Data
                                    </div>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Source:
                                        </span>
                                        <span className="text-slate-700 dark:text-slate-300 font-mono">
                                          {ev.source}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Timestamp:
                                        </span>
                                        <span className="text-slate-700 dark:text-slate-300">
                                          {ev.timestamp}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Type:
                                        </span>
                                        <span className="text-slate-700 dark:text-slate-300">
                                          Text Message
                                        </span>
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
                )}

                {/* Timeline Tab */}
                {activeTab === "timeline" && (
                  <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <div className="px-4 py-4 border-b border-r border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-sm flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-slate-600 dark:text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Timeline Analysis
                          </h2>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Chronological order
                        </div>
                      </div>
                    </div>
                    <div className="">
                      {results.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg
                              className="w-6 h-6 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                            Timeline Analysis
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 max-w-md mx-auto">
                            View evidence in chronological order to understand
                            the sequence of events.
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Timeline Line */}
                          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>

                          {results.map((ev, index) => (
                            <div
                              key={ev.id}
                              className="relative flex items-start gap-4 p-6 border-b border-slate-200 dark:border-slate-700"
                            >
                              {/* Timeline Dot */}
                              <div className="relative z-10 flex-shrink-0 w-4 h-4 bg-slate-400 dark:bg-slate-500 rounded-full border-2 border-white dark:border-slate-800"></div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-sm flex items-center justify-center">
                                      <svg
                                        className="w-3 h-3 text-slate-600 dark:text-slate-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {ev.app}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        #{String(index + 1).padStart(3, "0")}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 font-mono rounded-full">
                                      {ev.id}
                                    </div>
                                    <div
                                      className={`text-xs px-2 py-1 font-medium rounded-full ${
                                        ev.direction === "Incoming"
                                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                      }`}
                                    >
                                      {ev.direction}
                                    </div>
                                  </div>
                                  <div className="text-xs text-slate-500 ml-auto">
                                    {ev.timestamp}
                                  </div>
                                </div>

                                {/* Message Content */}
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 mb-3">
                                  <div className="text-sm text-slate-800 dark:text-slate-200">
                                    {ev.content}
                                  </div>
                                </div>

                                {/* Sender Info */}
                                <div className="flex items-center gap-3 text-sm mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-sm flex items-center justify-center">
                                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                        {ev.sender.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                      {ev.sender}
                                    </span>
                                  </div>
                                  <div className="text-slate-400">•</div>
                                  <div className="text-slate-500">
                                    Group: Crypto market9
                                  </div>
                                </div>

                                {/* Tags */}
                                {ev.tagBadges.length > 0 && (
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
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Network Tab */}
                {activeTab === "network" && (
                  <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <div className="px-4 py-4 border-b border-r border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-sm flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-slate-600 dark:text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                          </div>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Communication Network
                          </h2>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Relationship mapping
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      {results.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg
                              className="w-6 h-6 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                          </div>
                          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                            Network Analysis
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 max-w-md mx-auto">
                            Visualize communication patterns and relationships
                            between contacts.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Network Visualization */}
                          <div className="relative bg-slate-50 dark:bg-slate-900/50 rounded-lg p-8 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-center h-64">
                              <div className="relative">
                                {/* Central Node */}
                                <div className="w-16 h-16 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center text-sm font-medium text-slate-700 dark:text-slate-300 border-2 border-white dark:border-slate-800 shadow-sm">
                                  Suspect X
                                </div>

                                {/* Connected Nodes */}
                                <div className="absolute -top-8 -left-8 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xs font-medium text-green-700 dark:text-green-300 border-2 border-white dark:border-slate-800 shadow-sm">
                                  John Doe
                                </div>

                                <div className="absolute -top-8 -right-8 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-medium text-blue-700 dark:text-blue-300 border-2 border-white dark:border-slate-800 shadow-sm">
                                  +91987654321
                                </div>

                                <div className="absolute -bottom-8 -left-4 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-xs font-medium text-purple-700 dark:text-purple-300 border-2 border-white dark:border-slate-800 shadow-sm">
                                  crypto_wallet@email.com
                                </div>

                                {/* Connection Lines */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                  <line
                                    x1="50%"
                                    y1="50%"
                                    x2="25%"
                                    y2="25%"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-slate-300 dark:text-slate-600"
                                  />
                                  <line
                                    x1="50%"
                                    y1="50%"
                                    x2="75%"
                                    y2="25%"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-slate-300 dark:text-slate-600"
                                  />
                                  <line
                                    x1="50%"
                                    y1="50%"
                                    x2="25%"
                                    y2="75%"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-slate-300 dark:text-slate-600"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Network Stats */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Total Contacts
                              </div>
                              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                3
                              </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Communication Types
                              </div>
                              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                2
                              </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                International Contacts
                              </div>
                              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                1
                              </div>
                            </div>
                          </div>

                          {/* Contact List */}
                          <div className="space-y-3">
                            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              Contact Details
                            </h3>
                            {[
                              {
                                name: "John Doe",
                                type: "WhatsApp",
                                status: "Active",
                                messages: 15,
                              },
                              {
                                name: "+91987654321",
                                type: "SMS",
                                status: "International",
                                messages: 6,
                              },
                              {
                                name: "crypto_wallet@email.com",
                                type: "Email",
                                status: "External",
                                messages: 2,
                              },
                            ].map((contact, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                      {contact.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                      {contact.name}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                      {contact.type} • {contact.status}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                  {contact.messages} messages
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Summary Tab */}
                {activeTab === "summary" && (
                  <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <div className="px-4 py-4 border-b border-r border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-sm flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-slate-600 dark:text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                          </div>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Evidence Summary
                          </h2>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Case overview
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-6">
                        {/* Case Information */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                            Case Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">
                                Case ID:
                              </span>
                              <span className="ml-2 font-mono text-slate-700 dark:text-slate-300">
                                {caseId}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">
                                Search Query:
                              </span>
                              <span className="ml-2 text-slate-700 dark:text-slate-300">
                                {query || "No query entered"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">
                                Search Date:
                              </span>
                              <span className="ml-2 text-slate-700 dark:text-slate-300">
                                {new Date().toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">
                                Officer:
                              </span>
                              <span className="ml-2 text-slate-700 dark:text-slate-300">
                                John Doe (Badge #12345)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Evidence Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Total Results
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                              {searchData.totalResults}
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                              WhatsApp Messages
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                              {Math.floor(searchData.totalResults * 0.6)}
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                              SMS Messages
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                              {Math.floor(searchData.totalResults * 0.3)}
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Email Messages
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                              {Math.floor(searchData.totalResults * 0.1)}
                            </div>
                          </div>
                        </div>

                        {/* Key Findings */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                            Key Findings
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-slate-700 dark:text-slate-300">
                                {searchData.totalResults} evidence items found
                                for query: "{query}"
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-slate-700 dark:text-slate-300">
                                Processing completed in{" "}
                                {searchData.processingTime}ms
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-slate-700 dark:text-slate-300">
                                AI Intent: {searchData.intent}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span className="text-slate-700 dark:text-slate-300">
                                Evidence spans multiple communication channels
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Export Options */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                            Export Options
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <Button className="h-8 px-3 text-xs bg-slate-600 hover:bg-slate-700 text-white">
                              📄 Generate Court Report
                            </Button>
                            <Button className="h-8 px-3 text-xs bg-slate-600 hover:bg-slate-700 text-white">
                              📥 Export All Evidence
                            </Button>
                            <Button className="h-8 px-3 text-xs bg-slate-600 hover:bg-slate-700 text-white">
                              📊 Export Timeline
                            </Button>
                            <Button className="h-8 px-3 text-xs bg-slate-600 hover:bg-slate-700 text-white">
                              🌐 Export Network
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
