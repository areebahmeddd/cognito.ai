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
    "compact",
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
  const [selectedTime, setSelectedTime] = useState("All Time");
  const [selectedSort, setSelectedSort] = useState("Relevance");
  const [selectedTimelineFilter, setSelectedTimelineFilter] =
    useState("All Events");
  const [selectedTimelineTime, setSelectedTimelineTime] = useState("All Time");
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const toggleDateExpansion = (date: string) => {
    setExpandedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const handleTimelineViewChange = (mode: "compact" | "detailed") => {
    setTimelineView(mode);
    if (mode === "detailed") {
      // Auto-expand all dates when detailed view is selected
      const allDates = new Set(filteredDailySummaries.map((day) => day.date));
      setExpandedDates(allDates);
    } else {
      // Collapse all dates when compact view is selected
      setExpandedDates(new Set());
    }
  };

  const filterResults = (results: EvidenceItem[]) => {
    let filtered = [...results];

    // Filter by type
    if (selectedType !== "All Types") {
      filtered = filtered.filter((ev) => {
        const category = ev.raw_data?.category?.toLowerCase() || "";
        const fileType = ev.file_type?.toLowerCase() || "";
        const app = ev.app?.toLowerCase() || "";

        switch (selectedType) {
          case "Messages":
            return (
              category.includes("message") ||
              fileType.includes("message") ||
              app.includes("message") ||
              app.includes("whatsapp") ||
              app.includes("telegram") ||
              app.includes("discord")
            );
          case "Calls":
            return (
              category.includes("call") ||
              fileType.includes("call") ||
              app.includes("call")
            );
          case "Web History":
            return (
              category.includes("browsing") ||
              category.includes("web") ||
              fileType.includes("browser") ||
              app.includes("chrome") ||
              app.includes("firefox") ||
              app.includes("safari")
            );
          case "Files":
            return (
              category.includes("file") ||
              fileType.includes("file") ||
              app.includes("file")
            );
          default:
            return true;
        }
      });
    }

    // Filter by time
    if (selectedTime !== "All Time") {
      const now = new Date();
      const cutoffDate = new Date();

      switch (selectedTime) {
        case "Last 24 Hours":
          cutoffDate.setHours(now.getHours() - 24);
          break;
        case "Last 7 Days":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "Last 30 Days":
          cutoffDate.setDate(now.getDate() - 30);
          break;
      }

      filtered = filtered.filter((ev) => {
        const timestamp = new Date(ev.timestamp);
        return timestamp >= cutoffDate;
      });
    }

    // Sort results
    switch (selectedSort) {
      case "Newest First":
        filtered.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        break;
      case "Oldest First":
        filtered.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
        break;
      case "Relevance":
      default:
        // Keep original order (already sorted by relevance from API)
        break;
    }

    return filtered;
  };

  const groupEventsIntoSessions = (results: EvidenceItem[]) => {
    const sessions: any[] = [];
    const sortedResults = [...results].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    let currentSession: any = null;
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    for (const event of sortedResults) {
      const eventTime = new Date(event.timestamp).getTime();

      // Check if this event belongs to current session
      if (
        currentSession &&
        currentSession.app === event.app &&
        currentSession.conversation_name === event.conversation_name &&
        eventTime - currentSession.endTime <= SESSION_TIMEOUT
      ) {
        // Add to current session
        currentSession.events.push(event);
        currentSession.endTime = eventTime;
        currentSession.messageCount++;

        // Update suspicious content detection
        if (event.content) {
          const content = event.content.toLowerCase();
          if (
            content.includes("crypto") ||
            content.includes("bitcoin") ||
            content.includes("ethereum")
          ) {
            currentSession.hasSuspiciousContent = true;
            currentSession.suspiciousKeywords.push("cryptocurrency");
          }
          if (
            content.includes("money") ||
            content.includes("payment") ||
            content.includes("$")
          ) {
            currentSession.hasSuspiciousContent = true;
            currentSession.suspiciousKeywords.push("financial");
          }
        }
      } else {
        // Start new session
        if (currentSession) {
          sessions.push(currentSession);
        }

        currentSession = {
          id: `session-${sessions.length + 1}`,
          app: event.app,
          conversation_name: event.conversation_name,
          startTime: eventTime,
          endTime: eventTime,
          events: [event],
          messageCount: 1,
          hasSuspiciousContent: false,
          suspiciousKeywords: [],
          participants: new Set([event.sender]),
          preview: event.content?.substring(0, 100) || "",
          priority: "normal",
        };

        // Check for suspicious content in first event
        if (event.content) {
          const content = event.content.toLowerCase();
          if (
            content.includes("crypto") ||
            content.includes("bitcoin") ||
            content.includes("ethereum")
          ) {
            currentSession.hasSuspiciousContent = true;
            currentSession.suspiciousKeywords.push("cryptocurrency");
            currentSession.priority = "high";
          }
          if (
            content.includes("money") ||
            content.includes("payment") ||
            content.includes("$")
          ) {
            currentSession.hasSuspiciousContent = true;
            currentSession.suspiciousKeywords.push("financial");
            currentSession.priority = "high";
          }
        }
      }

      // Add participant
      if (event.sender) {
        currentSession.participants.add(event.sender);
      }
    }

    // Add last session
    if (currentSession) {
      sessions.push(currentSession);
    }

    return sessions;
  };

  const getDailySummaries = (sessions: any[]) => {
    const dailyGroups: { [key: string]: any[] } = {};

    sessions.forEach((session) => {
      const date = new Date(session.startTime).toDateString();
      if (!dailyGroups[date]) {
        dailyGroups[date] = [];
      }
      dailyGroups[date].push(session);
    });

    return Object.entries(dailyGroups)
      .map(([date, daySessions]) => {
        const totalEvents = daySessions.reduce(
          (sum, s) => sum + s.messageCount,
          0,
        );
        const suspiciousCount = daySessions.filter(
          (s) => s.hasSuspiciousContent,
        ).length;
        const appStats = daySessions.reduce((stats: any, session) => {
          stats[session.app] = (stats[session.app] || 0) + session.messageCount;
          return stats;
        }, {});

        const startTime = new Date(
          Math.min(...daySessions.map((s) => s.startTime)),
        );
        const endTime = new Date(
          Math.max(...daySessions.map((s) => s.endTime)),
        );

        return {
          date,
          sessions: daySessions,
          totalEvents,
          suspiciousCount,
          appStats,
          startTime: startTime.toLocaleTimeString(),
          endTime: endTime.toLocaleTimeString(),
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filterTimelineSessions = (sessions: any[]) => {
    let filtered = [...sessions];

    // Filter by timeline event type
    if (selectedTimelineFilter !== "All Events") {
      filtered = filtered.filter((session) => {
        const app = session.app?.toLowerCase() || "";

        switch (selectedTimelineFilter) {
          case "Messages":
            return (
              app.includes("message") ||
              app.includes("whatsapp") ||
              app.includes("telegram") ||
              app.includes("discord") ||
              app.includes("sms")
            );
          case "Calls":
            return app.includes("call") || app.includes("phone");
          case "Web History":
            return (
              app.includes("browser") ||
              app.includes("chrome") ||
              app.includes("firefox") ||
              app.includes("safari") ||
              app.includes("web")
            );
          case "Files":
            return app.includes("file") || app.includes("download");
          default:
            return true;
        }
      });
    }

    // Filter by timeline time
    if (selectedTimelineTime !== "All Time") {
      const now = new Date();
      const cutoffDate = new Date();

      switch (selectedTimelineTime) {
        case "Last 24 Hours":
          cutoffDate.setHours(now.getHours() - 24);
          break;
        case "Last 7 Days":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "Last 30 Days":
          cutoffDate.setDate(now.getDate() - 30);
          break;
      }

      filtered = filtered.filter((session) => {
        const timestamp = new Date(session.startTime);
        return timestamp >= cutoffDate;
      });
    }

    return filtered;
  };

  const filterDailySummaries = (summaries: any[]) => {
    return summaries
      .map((day) => ({
        ...day,
        sessions: filterTimelineSessions(day.sessions),
      }))
      .filter((day) => day.sessions.length > 0);
  };

  const filteredResults = filterResults(results);
  const timelineSessions = groupEventsIntoSessions(results);
  const allDailySummaries = getDailySummaries(timelineSessions);
  const filteredDailySummaries = filterDailySummaries(allDailySummaries);

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

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        if (!target.closest(".custom-dropdown")) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("click", handleClickOutside);
      }

      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }, [isOpen]);

    return (
      <div className="relative custom-dropdown">
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
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#F8F8F8] dark:bg-[#0F0F0F] border border-[#FF7F50] dark:border-[#FF7F50] rounded-lg shadow-lg z-50">
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
                          {hasSearched && (
                            <button
                              onClick={() => {
                                setResults([]);
                                setSearchData({
                                  intent: "",
                                  totalResults: 0,
                                  processingTime: 0,
                                });
                                setHasSearched(false);
                                setQuery("");
                              }}
                              className="ml-3 text-xs text-slate-400 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors flex items-center gap-1"
                            >
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              Clear Results
                            </button>
                          )}
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
                              placeholder="All Time"
                            />
                            <button
                              onClick={() => {
                                setSelectedType("All Types");
                                setSelectedTime("All Time");
                                setSelectedSort("Relevance");
                              }}
                              className="text-sm text-slate-500 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
                            >
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
                      {filteredResults.length === 0 ? (
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
                          {filteredResults.map((ev, index) => (
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
                                        {ev.app}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        Result #
                                        {String(index + 1).padStart(3, "0")} •
                                        Artifact ID: {ev.artifact_id}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 font-medium rounded-full">
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
                                    {ev.raw_data?.recipient ||
                                      ev.raw_data?.to ||
                                      ev.raw_data?.display_to ||
                                      "Unknown"}
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
                                        <span className="text-slate-700 dark:text-slate-300 font-mono text-xs break-all">
                                          {ev.source}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Type:
                                        </span>
                                        <span className="text-slate-700 dark:text-slate-300">
                                          {ev.app}
                                        </span>
                                      </div>
                                      {ev.jid && (
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">
                                            JID:
                                          </span>
                                          <span className="text-slate-700 dark:text-slate-300 font-mono text-xs break-all">
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
                            {filteredDailySummaries.reduce(
                              (total, day) => total + day.sessions.length,
                              0,
                            )}{" "}
                            sessions
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

                      {allDailySummaries.length > 0 && (
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
                                "Messages",
                                "Calls",
                                "Web History",
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
                              placeholder="All Time"
                            />
                            <button
                              onClick={() => {
                                setSelectedTimelineFilter("All Events");
                                setSelectedTimelineTime("All Time");
                              }}
                              className="text-sm text-slate-500 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
                            >
                              Reset
                            </button>
                        </div>

                          <div className="flex items-center gap-3 ml-auto">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            View:
                          </span>
                            <div className="relative">
                              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                          <button
                                  onClick={() =>
                                    handleTimelineViewChange("compact")
                                  }
                                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                              timelineView === "compact"
                                      ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm"
                                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                          >
                            Compact
                          </button>
                          <button
                                  onClick={() =>
                                    handleTimelineViewChange("detailed")
                                  }
                                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                              timelineView === "detailed"
                                      ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm"
                                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                          >
                            Detailed
                          </button>
                        </div>
                      </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      {filteredDailySummaries.length === 0 ? (
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
                          {allDailySummaries.length === 0 ? (
                            <>
                          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                            Timeline Analysis
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 max-w-md mx-auto">
                                View evidence in chronological order to
                                understand the sequence of events.
                              </p>
                            </>
                          ) : (
                            <>
                              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                No Timeline Data Found
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 max-w-md mx-auto">
                                No events match your current filter criteria.
                                Try adjusting your filters or search for
                                different evidence.
                              </p>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 p-4">
                          {filteredDailySummaries.map((day, dayIndex) => {
                            const isExpanded = expandedDates.has(day.date);
                            return (
                              <div
                                key={day.date}
                                className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                              >
                                {/* Collapsible Date Header */}
                                <div
                                  className="bg-gradient-to-r from-[#FFF5F0] to-[#FFF8F5] dark:from-[#2A1A0F] dark:to-[#2A1F15] border-b border-[#FF7F50] dark:border-[#FF7F50] p-4 cursor-pointer hover:from-[#FFF0E6] hover:to-[#FFF5F0] dark:hover:from-[#2A1F15] dark:hover:to-[#2A1A0F] transition-all"
                                  onClick={() => toggleDateExpansion(day.date)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-6 h-6 flex items-center justify-center transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                                      >
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
                                            d="M9 5l7 7-7 7"
                                          />
                                        </svg>
                                      </div>
                                      <div className="w-8 h-8 bg-[#FF7F50] rounded-full flex items-center justify-center">
                                        <svg
                                          className="w-4 h-4 text-white"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                          />
                                        </svg>
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                          {day.date}
                                      </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                          {day.startTime} - {day.endTime}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-[#FF7F50]">
                                        {day.totalEvents}
                                      </div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">
                                        total events
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                    {Object.entries(day.appStats).map(
                                      ([app, count]) => (
                                        <div key={app} className="text-center">
                                          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                            {count as number}
                                          </div>
                                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {app}
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>

                                  {day.suspiciousCount > 0 && (
                                    <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                      <svg
                                        className="w-4 h-4 text-red-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                        />
                                      </svg>
                                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                        {day.suspiciousCount} suspicious
                                        activities detected
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Collapsible Content */}
                                {isExpanded && (
                                  <div className="relative p-4 bg-slate-50/50 dark:bg-slate-800/50">
                                    {/* Timeline Line */}
                                    <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-slate-300 dark:bg-slate-600"></div>

                                    <div className="space-y-3">
                                      {day.sessions.map(
                                        (
                                          session: any,
                                          sessionIndex: number,
                                        ) => (
                                          <div
                                            key={session.id}
                                            className={`relative border rounded-lg p-3 ml-16 ${
                                              session.priority === "high"
                                                ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20"
                                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                            }`}
                                          >
                                            {/* Date Marker */}
                                            <div className="absolute -left-12 top-2 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap bg-white dark:bg-slate-800 px-1 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-600">
                                              {new Date(
                                                session.startTime,
                                              ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true,
                                              })}
                                            </div>
                                            {session.priority === "high" && (
                                              <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                                <svg
                                                  className="w-2 h-2 text-white"
                                                  fill="currentColor"
                                                  viewBox="0 0 8 8"
                                                >
                                                  <circle cx="4" cy="4" r="3" />
                                                </svg>
                                              </div>
                                            )}

                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex items-center gap-3">
                                                <div
                                                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                    session.app
                                                  .toLowerCase()
                                                  .includes("whatsapp")
                                                      ? "bg-green-100 dark:bg-green-900/30"
                                                      : session.app
                                                        .toLowerCase()
                                                        .includes("sms")
                                                        ? "bg-blue-100 dark:bg-blue-900/30"
                                                        : "bg-blue-100 dark:bg-blue-900/30"
                                              }`}
                                            >
                                              <svg
                                                    className={`w-4 h-4 ${
                                                      session.app
                                                    .toLowerCase()
                                                    .includes("whatsapp")
                                                        ? "text-green-600 dark:text-green-400"
                                                        : session.app
                                                          .toLowerCase()
                                                          .includes("sms")
                                                          ? "text-blue-600 dark:text-blue-400"
                                                          : "text-blue-600 dark:text-blue-400"
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
                                                  <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {session.app} Session
                                              </div>
                                                  <div className="text-sm text-slate-500 dark:text-slate-400">
                                                    {session.conversation_name ||
                                                      "Unknown Conversation"}
                                              </div>
                                            </div>
                                          </div>
                                              <div className="text-right">
                                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {new Date(
                                                    session.startTime,
                                                  ).toLocaleTimeString()}{" "}
                                                  -{" "}
                                                  {new Date(
                                                    session.endTime,
                                            ).toLocaleTimeString()}
                                          </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                  {session.messageCount}{" "}
                                                  messages
                                        </div>
                                          </div>
                                        </div>

                                            <div className="mb-2">
                                              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                                Participants:{" "}
                                                {Array.from(
                                                  session.participants,
                                                ).join(", ")}
                                              </div>
                                              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                                                <div className="text-sm text-slate-800 dark:text-slate-200">
                                                  {session.preview}...
                                            </div>
                                                </div>
                                                </div>

                                            {session.hasSuspiciousContent && (
                                              <div className="flex items-center gap-2 mb-2">
                                                <svg
                                                  className="w-4 h-4 text-red-500"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                                  />
                                                </svg>
                                                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                                  Suspicious content:{" "}
                                                  {session.suspiciousKeywords.join(
                                                    ", ",
                                                  )}
                                                </span>
                                          </div>
                                            )}

                                            <div className="flex items-center justify-end gap-2">
                                              <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#FF7F50] hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F] rounded transition-colors">
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
                                                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                                  />
                                                </svg>
                                                Expand Session
                                              </button>
                                              <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#FF7F50] hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F] rounded transition-colors">
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
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                              </svg>
                                                Mark Evidence
                                            </button>
                                              <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#FF7F50] hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F] rounded transition-colors">
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
                                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                              </svg>
                                                Export
                                            </button>
                                          </div>
                                        </div>
                                        ),
                                        )}
                                      </div>
                                    </div>
                                )}
                                </div>
                            );
                          })}
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
                      {filteredResults.length === 0 ? (
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
                                <span className="text-sm font-mono text-slate-900 dark:text-slate-100 break-all">
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
