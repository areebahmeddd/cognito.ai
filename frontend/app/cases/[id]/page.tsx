"use client";

import CaseSidebar from "@/components/cases/CaseSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EvidenceItem, searchQuery } from "@/lib/search";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

type TabType = "search" | "timeline" | "network" | "summary";

export default function CasePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const caseId = params?.id as string;
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("search");
  const [timelineView, setTimelineView] = useState<"compact" | "detailed">(
    "detailed",
  );
  const [results, setResults] = useState<EvidenceItem[]>([]);
  const [searchData, setSearchData] = useState<{
    intent: string;
    totalResults: number;
    processingTime: number;
  }>({
    intent: "No query entered",
    totalResults: 0,
    processingTime: 0,
  });
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedTime, setSelectedTime] = useState("Last 30 Days");
  const [selectedSort, setSelectedSort] = useState("Relevance");
  const [selectedTimelineFilter, setSelectedTimelineFilter] =
    useState("All Events");
  const [selectedTimelineTime, setSelectedTimelineTime] =
    useState("Last 24 Hours");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const startVoiceInput = () => {
    if (recognition && !isListening) {
      recognition.start();
    }
  };

  const CustomDropdown = ({
    value,
    onChange,
    options,
    placeholder,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm border border-[#FF7F50] dark:border-[#FF7F50] rounded-lg px-3 py-2 bg-[#F8F8F8] dark:bg-[#0F0F0F] text-[#2A2A2A] dark:text-[#E0E0E0] flex items-center gap-2 min-w-[120px]"
        >
          <span>{value}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#F8F8F8] dark:bg-[#0F0F0F] border border-[#FF7F50] dark:border-[#FF7F50] rounded-lg shadow-lg z-10">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  value === option
                    ? "bg-[#FFF5F0] dark:bg-[#2A1A0F] text-[#FF7F50]"
                    : "text-[#2A2A2A] dark:text-[#E0E0E0] hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleAnalyze = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const searchResult = await searchQuery(query);
      setHasSearched(true);
      setResults(searchResult.results);
      setSearchData({
        intent: searchResult.intent,
        totalResults: searchResult.totalResults,
        processingTime: searchResult.processingTime,
      });
      console.log(searchResult);
    } catch (error) {
      console.error("Search failed:", error);
      setHasSearched(true);
      setResults([]);
      setSearchData({
        intent: "Search failed",
        totalResults: 0,
        processingTime: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#F8F8F8] dark:bg-[#0F0F0F]">
      <div className="flex h-screen flex-col">
        <DashboardNavbar />
        <div className="border-b border-[#E0E0E0] dark:border-[#2A2A2A]"></div>
        <div className="flex-1 flex overflow-hidden">
          <CaseSidebar
            caseId={caseId}
            searchData={searchData}
            results={results}
          />

          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="bg-[#F8F8F8] dark:bg-[#0F0F0F] p-4">
              <div className="mx-auto">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search case data..."
                      className="h-10 border border-[#FF7F50] dark:border-[#FF7F50] pl-10 pr-10"
                      onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
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
                    <button
                      onClick={startVoiceInput}
                      disabled={!recognition}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                        isListening
                          ? "text-[#FF7F50] animate-pulse"
                          : "text-slate-400 hover:text-[#FF7F50] dark:hover:text-[#FF7F50]"
                      } ${!recognition ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      title={
                        recognition
                          ? isListening
                            ? "Listening..."
                            : "Click to speak"
                          : "Voice input not supported"
                      }
                    >
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
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                    </button>
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={loading || !query.trim()}
                    className="h-10 px-6 bg-[#FF7F50] hover:bg-[#FF6B35] text-white"
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="space-y-0 w-full min-w-0">
                <div className="bg-[#F8F8F8] dark:bg-[#0F0F0F]">
                  <div className="flex">
                    {[
                      { id: "search", label: "Search Results", icon: "" },
                      { id: "timeline", label: "Timeline", icon: "" },
                      { id: "network", label: "Network", icon: "" },
                      { id: "summary", label: "Summary", icon: "" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? "border-[#FF7F50] text-[#FF7F50]"
                            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                      >
                        <span className="text-base">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {activeTab === "search" && (
                  <div className="bg-[#F8F8F8] dark:bg-[#0F0F0F]">
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-full flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-[#FF7F50]"
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
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Search Results
                          </h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Took {searchData.processingTime} ms
                          </div>
                          <svg
                            className="w-2 h-2 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                          >
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {searchData.totalResults} matches found
                          </div>
                        </div>
                      </div>

                      {hasSearched && (
                        <div className="mb-4 p-3 bg-[#F8F8F8] dark:bg-[#0F0F0F] rounded-lg border border-[#FF7F50] dark:border-[#FF7F50]">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-4 h-4 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-full flex items-center justify-center relative">
                              <div className="absolute inset-0 bg-[#FF7F50] rounded-full animate-gentle-glow opacity-30"></div>
                              <svg
                                className="w-2 h-2 text-[#FF7F50] relative z-10"
                                fill="currentColor"
                                viewBox="0 0 8 8"
                              >
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Query Intent:
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 ml-6">
                            {searchData.intent}
                          </p>
                        </div>
                      )}

                      {hasSearched && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              Filters:
                            </span>
                            <CustomDropdown
                              value={selectedType}
                              onChange={setSelectedType}
                              options={[
                                "All Types",
                                "Messages",
                                "Calls",
                                "Web History",
                                "Files",
                              ]}
                              placeholder="All Types"
                            />
                            <CustomDropdown
                              value={selectedTime}
                              onChange={setSelectedTime}
                              options={[
                                "Last 30 Days",
                                "Last 7 Days",
                                "Last 24 Hours",
                                "All Time",
                              ]}
                              placeholder="Last 30 Days"
                            />
                            <button className="text-sm text-slate-500 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors">
                              Reset
                            </button>
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              Sort:
                            </span>
                            <CustomDropdown
                              value={selectedSort}
                              onChange={setSelectedSort}
                              options={[
                                "Relevance",
                                "Newest First",
                                "Oldest First",
                                "Alphabetical",
                              ]}
                              placeholder="Relevance"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      {results.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-12 h-12 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-xl flex items-center justify-center mx-auto mb-3">
                            {loading ? (
                              <div className="w-6 h-6 border-2 border-[#FF7F50] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg
                                className="w-6 h-6 text-[#FF7F50]"
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
                            )}
                          </div>
                          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                            {loading
                              ? "Analyzing..."
                              : hasSearched
                                ? "No evidence found"
                                : "Ready to analyze"}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 max-w-md mx-auto">
                            {loading
                              ? "Processing your search query and analyzing case data..."
                              : hasSearched
                                ? "No results found for your search. Try different keywords or broaden your search."
                                : "Enter a search query to analyze case data and find relevant evidence."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 p-4">
                          {results.map((ev, index) => (
                            <div
                              key={ev.id}
                              className="bg-[#F8F8F8] dark:bg-[#0F0F0F] border border-[#FF7F50] dark:border-[#FF7F50] rounded-lg overflow-hidden"
                            >
                              <div className="flex items-center justify-between p-4 border-b border-[#FF7F50] dark:border-[#FF7F50] bg-[#FFF5F0] dark:bg-[#2A1A0F]">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg flex items-center justify-center">
                                      <svg
                                        className="w-4 h-4 text-[#FF7F50]"
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
                                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {ev.app} Message
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        Result #
                                        {String(index + 1).padStart(3, "0")}
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
                                          ? "bg-[#FFF5F0] dark:bg-[#2A1A0F] text-[#FF7F50]"
                                          : "bg-[#F0F0F0] dark:bg-[#2A2A2A] text-[#4A4A4A] dark:text-[#B0B0B0]"
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

                              <div className="p-4">
                                <div className="mb-4">
                                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    {ev.sender} →{" "}
                                    {ev.direction === "Incoming"
                                      ? "Recipient"
                                      : "Sender"}
                                  </div>
                                  <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-4 border border-[#FF7F50] dark:border-[#FF7F50]">
                                    <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                                      {ev.content}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-3 border border-[#FF7F50] dark:border-[#FF7F50]">
                                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                      Source Data
                                    </div>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Source:
                                        </span>
                                        <span className="text-slate-700 dark:text-slate-300 font-mono text-xs">
                                          {ev.source}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Type:
                                        </span>
                                        <span className="text-slate-700 dark:text-slate-300">
                                          {ev.message_type ||
                                            ev.type ||
                                            "Unknown"}
                                        </span>
                                      </div>
                                      {ev.jid && (
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">
                                            JID:
                                          </span>
                                          <span className="text-slate-700 dark:text-slate-300 font-mono text-xs">
                                            {ev.jid}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-3 border border-[#FF7F50] dark:border-[#FF7F50]">
                                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                      Status
                                    </div>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Status:
                                        </span>
                                        <span
                                          className={`font-medium ${
                                            ev.status === "Deleted"
                                              ? "text-red-600 dark:text-red-400"
                                              : "text-[#FF7F50]"
                                          }`}
                                        >
                                          {ev.status === "Deleted"
                                            ? "Deleted"
                                            : "Active"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Recovery:
                                        </span>
                                        <span className="text-slate-700 dark:text-slate-300">
                                          {ev.recovery_status || "Original"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {ev.tagBadges.length > 0 && (
                                  <div className="mb-4">
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

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                  <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                    Add to Report
                                  </button>
                                  <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                                    <svg
                                      className="w-3 h-3"
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
                                    View Thread
                                  </button>
                                  <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                                    <svg
                                      className="w-3 h-3"
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
                                    Timeline
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "timeline" && (
                  <div className="bg-[#F8F8F8] dark:bg-[#0F0F0F]">
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-full flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-[#FF7F50]"
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
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {results.length} events
                          </div>
                          <svg
                            className="w-2 h-2 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                          >
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Chronological order
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Filter:
                          </span>
                          <CustomDropdown
                            value={selectedTimelineFilter}
                            onChange={setSelectedTimelineFilter}
                            options={[
                              "All Events",
                              "Messages Only",
                              "Calls Only",
                              "Web Activity",
                              "Files",
                            ]}
                            placeholder="All Events"
                          />
                          <CustomDropdown
                            value={selectedTimelineTime}
                            onChange={setSelectedTimelineTime}
                            options={[
                              "Last 24 Hours",
                              "Last 7 Days",
                              "Last 30 Days",
                              "All Time",
                            ]}
                            placeholder="Last 24 Hours"
                          />
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            View:
                          </span>
                          <button
                            onClick={() => setTimelineView("compact")}
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              timelineView === "compact"
                                ? "bg-[#FFF5F0] dark:bg-[#2A1A0F] text-[#FF7F50]"
                                : "text-slate-600 dark:text-slate-400 hover:text-[#FF7F50] hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F]"
                            }`}
                          >
                            Compact
                          </button>
                          <button
                            onClick={() => setTimelineView("detailed")}
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              timelineView === "detailed"
                                ? "bg-[#FFF5F0] dark:bg-[#2A1A0F] text-[#FF7F50]"
                                : "text-slate-600 dark:text-slate-400 hover:text-[#FF7F50] hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F]"
                            }`}
                          >
                            Detailed
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      {results.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-12 h-12 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg
                              className="w-6 h-6 text-[#FF7F50]"
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
                          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>

                          {(() => {
                            const groupedResults = results.reduce(
                              (groups, ev) => {
                                const date = new Date(
                                  ev.timestamp,
                                ).toDateString();
                                if (!groups[date]) {
                                  groups[date] = [];
                                }
                                groups[date].push(ev);
                                return groups;
                              },
                              {} as Record<string, typeof results>,
                            );

                            return Object.entries(groupedResults).map(
                              ([date, events], groupIndex) => (
                                <div key={date} className="relative">
                                  <div className="sticky top-0 z-20 bg-[#FFF5F0] dark:bg-[#2A1A0F] border-b border-[#FF7F50] dark:border-[#FF7F50] px-6 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-3 h-3 bg-[#FF7F50] rounded-full"></div>
                                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {date}
                                      </h3>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {events.length} events
                                      </div>
                                    </div>
                                  </div>

                                  {events.map((ev, index) => (
                                    <div
                                      key={ev.id}
                                      className="relative flex items-start gap-4 p-6 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                                    >
                                      <div
                                        className={`relative z-10 flex-shrink-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                                          ev.direction === "Incoming"
                                            ? "bg-[#FF7F50]"
                                            : "bg-[#4A4A4A]"
                                        }`}
                                      ></div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="flex items-center gap-2">
                                            <div
                                              className={`w-6 h-6 rounded-sm flex items-center justify-center ${
                                                ev.app
                                                  .toLowerCase()
                                                  .includes("whatsapp")
                                                  ? "bg-[#FFF5F0] dark:bg-[#2A1A0F]"
                                                  : ev.app
                                                        .toLowerCase()
                                                        .includes("sms")
                                                    ? "bg-[#F0F0F0] dark:bg-[#2A2A2A]"
                                                    : ev.app
                                                          .toLowerCase()
                                                          .includes("call")
                                                      ? "bg-purple-100 dark:bg-purple-900/30"
                                                      : "bg-slate-200 dark:bg-slate-600"
                                              }`}
                                            >
                                              <svg
                                                className={`w-3 h-3 ${
                                                  ev.app
                                                    .toLowerCase()
                                                    .includes("whatsapp")
                                                    ? "text-[#FF7F50]"
                                                    : ev.app
                                                          .toLowerCase()
                                                          .includes("sms")
                                                      ? "text-[#4A4A4A] dark:text-[#B0B0B0]"
                                                      : ev.app
                                                            .toLowerCase()
                                                            .includes("call")
                                                        ? "text-purple-600 dark:text-purple-400"
                                                        : "text-slate-600 dark:text-slate-400"
                                                }`}
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
                                                {ev.message_type ||
                                                  ev.type ||
                                                  "Message"}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <div
                                              className={`text-xs px-2 py-1 font-medium rounded-full ${
                                                ev.direction === "Incoming"
                                                  ? "bg-[#FFF5F0] dark:bg-[#2A1A0F] text-[#FF7F50]"
                                                  : "bg-[#F0F0F0] dark:bg-[#2A2A2A] text-[#4A4A4A] dark:text-[#B0B0B0]"
                                              }`}
                                            >
                                              {ev.direction}
                                            </div>
                                            {ev.status === "Deleted" && (
                                              <div className="text-xs px-2 py-1 font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                                Deleted
                                              </div>
                                            )}
                                          </div>

                                          <div className="text-xs text-slate-500 ml-auto">
                                            {new Date(
                                              ev.timestamp,
                                            ).toLocaleTimeString()}
                                          </div>
                                        </div>

                                        <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-3 border border-[#FF7F50] dark:border-[#FF7F50] mb-3">
                                          <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                                            {ev.content}
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3 text-sm">
                                            <div className="flex items-center gap-2">
                                              <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-sm flex items-center justify-center">
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                  {ev.sender &&
                                                  typeof ev.sender === "string"
                                                    ? ev.sender
                                                        .charAt(0)
                                                        .toUpperCase()
                                                    : "?"}
                                                </span>
                                              </div>
                                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                                {ev.sender}
                                              </span>
                                            </div>
                                            {ev.phone_number && (
                                              <>
                                                <div className="text-slate-400">
                                                  •
                                                </div>
                                                <div className="text-slate-500 font-mono text-xs">
                                                  {ev.phone_number}
                                                </div>
                                              </>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-1">
                                            <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
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
                                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                              </svg>
                                            </button>
                                            <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
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
                                                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                                                />
                                              </svg>
                                            </button>
                                          </div>
                                        </div>

                                        {ev.tagBadges.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-3">
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
                              ),
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "network" && (
                  <div className="bg-[#F8F8F8] dark:bg-[#0F0F0F]">
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-full flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-[#FF7F50]"
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
                          <div className="w-12 h-12 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg
                              className="w-6 h-6 text-[#FF7F50]"
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
                          <div className="relative bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-8 border border-[#FF7F50] dark:border-[#FF7F50]">
                            <div className="flex items-center justify-center h-64">
                              <div className="relative">
                                <div className="w-16 h-16 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center text-sm font-medium text-slate-700 dark:text-slate-300 border-2 border-white dark:border-slate-800 shadow-sm">
                                  User
                                </div>

                                <div className="absolute -top-8 -left-8 w-12 h-12 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-full flex items-center justify-center text-xs font-medium text-[#FF7F50] border-2 border-white dark:border-slate-800 shadow-sm">
                                  Contact
                                </div>

                                <div className="absolute -top-8 -right-8 w-12 h-12 bg-[#F0F0F0] dark:bg-[#2A2A2A] rounded-full flex items-center justify-center text-xs font-medium text-[#4A4A4A] dark:text-[#B0B0B0] border-2 border-white dark:border-slate-800 shadow-sm">
                                  +1234567890
                                </div>

                                <div className="absolute -bottom-8 -left-4 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-xs font-medium text-purple-700 dark:text-purple-300 border-2 border-white dark:border-slate-800 shadow-sm">
                                  contact@example.com
                                </div>

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

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-4 border border-[#FF7F50] dark:border-[#FF7F50]">
                              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Total Contacts
                              </div>
                              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                3
                              </div>
                            </div>

                            <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-4 border border-[#FF7F50] dark:border-[#FF7F50]">
                              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Communication Types
                              </div>
                              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                2
                              </div>
                            </div>

                            <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-4 border border-[#FF7F50] dark:border-[#FF7F50]">
                              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                International Contacts
                              </div>
                              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                1
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              Contact Details
                            </h3>
                            {[
                              {
                                name: "Contact 1",
                                type: "WhatsApp",
                                status: "Active",
                                messages: 15,
                              },
                              {
                                name: "+1234567890",
                                type: "SMS",
                                status: "International",
                                messages: 6,
                              },
                              {
                                name: "contact@example.com",
                                type: "Email",
                                status: "External",
                                messages: 2,
                              },
                            ].map((contact, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg border border-[#FF7F50] dark:border-[#FF7F50]"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                      {contact.name &&
                                      typeof contact.name === "string"
                                        ? contact.name.charAt(0).toUpperCase()
                                        : "?"}
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

                {activeTab === "summary" && (
                  <div className="bg-[#F8F8F8] dark:bg-[#0F0F0F]">
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-full flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-[#FF7F50]"
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
                      {searchData.totalResults === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-12 h-12 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg
                              className="w-6 h-6 text-[#FF7F50]"
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
                          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                            No Evidence Summary
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 max-w-md mx-auto">
                            Run a search to generate a comprehensive summary of
                            your case evidence.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-[#FF7F50] mb-1">
                                {searchData.totalResults}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                Total Results
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-[#FF7F50] mb-1">
                                {Math.floor(searchData.totalResults * 0.6)}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                WhatsApp
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-[#FF7F50] mb-1">
                                {Math.floor(searchData.totalResults * 0.3)}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                SMS
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-[#FF7F50] mb-1">
                                {Math.floor(searchData.totalResults * 0.1)}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                Email
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                              Analysis Overview
                            </h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  Search Query
                                </span>
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {query || "No query entered"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  Processing Time
                                </span>
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {searchData.processingTime}ms
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  AI Intent
                                </span>
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {searchData.intent}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  Case ID
                                </span>
                                <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
                                  {caseId}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
