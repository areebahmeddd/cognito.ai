"use client";

import CaseSidebar from "@/components/cases/CaseSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EvidenceItem, searchQuery } from "@/lib/search";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Network } from "vis-network";

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
  const [fileMetadata, setFileMetadata] = useState<{
    file_name: string;
    files_count: number;
    files_list: string[];
  } | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [selectedNetworkFilter, setSelectedNetworkFilter] =
    useState("All Contacts");
  const [selectedNetworkVolume, setSelectedNetworkVolume] =
    useState("All Volumes");
  const [selectedNetworkTime, setSelectedNetworkTime] = useState("All Time");
  const [selectedNetworkSuspicious, setSelectedNetworkSuspicious] =
    useState("All");
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(
    new Set(),
  );
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstance = useRef<Network | null>(null);

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
      const allDates = new Set(filteredDailySummaries.map((day) => day.date));
      setExpandedDates(allDates);
    } else {
      setExpandedDates(new Set());
    }
  };

  const filterResults = (results: EvidenceItem[]) => {
    let filtered = [...results];

    if (selectedType !== "All Types") {
      filtered = filtered.filter((ev) => {
        const category = ev.file_type?.toLowerCase() || "";
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
    const SESSION_TIMEOUT = 30 * 60 * 1000;

    for (const event of sortedResults) {
      const eventTime = parseFlexibleTimestamp(event.timestamp);
      if (isNaN(eventTime)) {
        return;
      }

      if (
        currentSession &&
        currentSession.app === event.app &&
        currentSession.conversation_name === event.conversation_name &&
        eventTime - currentSession.endTime <= SESSION_TIMEOUT
      ) {
        currentSession.events.push(event);
        currentSession.endTime = eventTime;
        currentSession.messageCount++;

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
          preview: event.content || "",
          priority: "normal",
        };

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

      if (event.sender) {
        currentSession.participants.add(event.sender);
      }
    }

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

        const startMs = Math.min(
          ...(daySessions || []).map((s: any) => s.startTime),
        );
        const endMs = Math.max(
          ...(daySessions || []).map((s: any) => s.endTime),
        );
        const startTime = new Date(startMs);
        const endTime = new Date(endMs);

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

  const extractContactsFromResults = (results: EvidenceItem[]) => {
    const contactMap = new Map<string, any>();

    results.forEach((result) => {
      const senderFields = [
        result.sender,
        result.phone_number,
        result.email,
        result.jid,
      ].filter(Boolean);

      const recipientFields = [
        result.phone_number,
        result.email,
        result.jid,
      ].filter(Boolean);

      [...senderFields, ...recipientFields].forEach((contact) => {
        if (!contact || contact === "Unknown") return;

        const contactKey = contact.toString().toLowerCase();
        if (!contactMap.has(contactKey)) {
          contactMap.set(contactKey, {
            id: contactKey,
            name: contact.toString(),
            type: getContactType(contact.toString()),
            communicationCount: 0,
            lastCommunication: result.timestamp,
            communicationTypes: new Set(),
            suspicious: false,
            evidenceItems: [],
          });
        }

        const contactData = contactMap.get(contactKey);
        contactData.communicationCount++;
        contactData.communicationTypes.add(result.app);
        contactData.evidenceItems.push(result);

        if (
          new Date(result.timestamp) > new Date(contactData.lastCommunication)
        ) {
          contactData.lastCommunication = result.timestamp;
        }
      });
    });

    return Array.from(contactMap.values());
  };

  const getContactType = (contact: string) => {
    if (contact.includes("@")) return "email";
    if (/^\+?[\d\s\-\(\)]+$/.test(contact.replace(/\s/g, ""))) return "phone";
    return "username";
  };

  const analyzeSuspiciousContacts = (contacts: any[]) => {
    return contacts.map((contact) => {
      let suspicious = false;
      const flags: string[] = [];

      if (contact.type === "phone" && contact.name.startsWith("+")) {
        suspicious = true;
        flags.push("International");
      }

      if (contact.communicationCount > 100) {
        suspicious = true;
        flags.push("High Volume");
      }

      if (
        contact.name === contact.id &&
        (contact.type === "phone" || contact.type === "email")
      ) {
        suspicious = true;
        flags.push("No Name");
      }

      if (contact.communicationTypes.size > 3) {
        suspicious = true;
        flags.push("Multiple Types");
      }

      return {
        ...contact,
        suspicious,
        flags,
      };
    });
  };

  const filterNetworkContacts = (contacts: any[]) => {
    let filtered = [...contacts];

    if (selectedNetworkFilter !== "All Contacts") {
      filtered = filtered.filter((contact) => {
        switch (selectedNetworkFilter) {
          case "Phone":
            return contact.type === "phone";
          case "Email":
            return contact.type === "email";
          case "Username":
            return contact.type === "username";
          default:
            return true;
        }
      });
    }

    if (selectedNetworkVolume !== "All Volumes") {
      filtered = filtered.filter((contact) => {
        switch (selectedNetworkVolume) {
          case "High (50+)":
            return contact.communicationCount >= 50;
          case "Medium (10-49)":
            return (
              contact.communicationCount >= 10 &&
              contact.communicationCount < 50
            );
          case "Low (<10)":
            return contact.communicationCount < 10;
          default:
            return true;
        }
      });
    }

    if (selectedNetworkTime !== "All Time") {
      const now = new Date();
      const cutoffDate = new Date();

      switch (selectedNetworkTime) {
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

      filtered = filtered.filter((contact) => {
        return new Date(contact.lastCommunication) >= cutoffDate;
      });
    }

    if (selectedNetworkSuspicious !== "All") {
      filtered = filtered.filter((contact) => {
        switch (selectedNetworkSuspicious) {
          case "Flagged":
            return contact.suspicious;
          case "Normal":
            return !contact.suspicious;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const toggleContactExpansion = (contactId: string) => {
    setExpandedContacts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const createNetworkVisualization = (contacts: any[]) => {
    if (!networkRef.current || contacts.length === 0) return;

    const nodes = [
      {
        id: "subject",
        label: "Subject",
        color: {
          background: "#374151",
          border: "#1f2937",
          highlight: {
            background: "#1f2937",
            border: "#374151",
          },
        },
        font: { color: "white", size: 14, face: "Arial" },
        size: 30,
        shape: "circle",
      },
      ...contacts.map((contact) => ({
        id: contact.id,
        label:
          contact.name.length > 15
            ? contact.name.substring(0, 15) + "..."
            : contact.name,
        color: {
          background: contact.suspicious
            ? "#ef4444"
            : contact.type === "phone"
              ? "#6b7280"
              : contact.type === "email"
                ? "#9ca3af"
                : "#d1d5db",
          border: contact.suspicious
            ? "#dc2626"
            : contact.type === "phone"
              ? "#4b5563"
              : contact.type === "email"
                ? "#6b7280"
                : "#9ca3af",
          highlight: {
            background: contact.suspicious
              ? "#dc2626"
              : contact.type === "phone"
                ? "#4b5563"
                : contact.type === "email"
                  ? "#6b7280"
                  : "#9ca3af",
            border: contact.suspicious
              ? "#b91c1c"
              : contact.type === "phone"
                ? "#374151"
                : contact.type === "email"
                  ? "#4b5563"
                  : "#6b7280",
          },
        },
        font: { color: "white", size: 12, face: "Arial" },
        size: Math.min(Math.max(contact.communicationCount / 5, 15), 40),
        shape: "circle",
        title: `${contact.name}\nType: ${contact.type}\nCommunications: ${contact.communicationCount}\nLast: ${formatSafeDateOnly(contact.lastCommunication)}`,
        chosen: false,
      })),
    ];

    const edges = contacts.map((contact) => ({
      from: "subject",
      to: contact.id,
      width: Math.min(Math.max(contact.communicationCount / 10, 1), 5),
      color: {
        color: contact.suspicious ? "#ef4444" : "#9ca3af",
        highlight: contact.suspicious ? "#dc2626" : "#6b7280",
      },
      smooth: { enabled: true, type: "continuous", roundness: 0.2 },
    }));

    const data = { nodes, edges };

    const options = {
      physics: {
        enabled: true,
        stabilization: { iterations: 100 },
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.3,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        hideEdgesOnDrag: true,
        hoverConnectedEdges: false,
        selectConnectedEdges: false,
      },
      nodes: {
        borderWidth: 2,
        shadow: true,
        chosen: false,
      },
      edges: {
        shadow: true,
        smooth: {
          enabled: true,
          type: "continuous",
          roundness: 0.2,
        },
      },
      layout: {
        improvedLayout: true,
      },
      configure: {
        enabled: false,
      },
    };

    if (networkInstance.current) {
      networkInstance.current.destroy();
    }

    networkInstance.current = new Network(networkRef.current, data, options);
  };

  const filteredResults = filterResults(results);
  const timelineSessions = groupEventsIntoSessions(results || []);
  const allDailySummaries = getDailySummaries(timelineSessions || []);
  const filteredDailySummaries = filterDailySummaries(allDailySummaries);

  const allNetworkContacts = analyzeSuspiciousContacts(
    extractContactsFromResults(filteredResults),
  );
  const filteredNetworkContacts = filterNetworkContacts(allNetworkContacts);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    if (filteredNetworkContacts.length > 0) {
      createNetworkVisualization(filteredNetworkContacts);
    }
  }, [filteredNetworkContacts]);

  useEffect(() => {}, [expandedContacts]);

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
      const searchResult = await searchQuery(query, caseId);
      setHasSearched(true);
      setResults(searchResult.results);
      setSearchData({
        intent: searchResult.intent,
        totalResults: searchResult.totalResults,
        processingTime: searchResult.processingTime,
      });
    } catch (error) {
      toast.error("Search failed", {
        description:
          error instanceof Error
            ? error.message
            : "Unable to perform search. Please try again.",
      });
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

  const ExpandableText = ({
    text,
    collapsedChars = 280,
  }: {
    text: string;
    collapsedChars?: number;
  }) => {
    const [expanded, setExpanded] = useState(false);
    const needsCollapse = (text || "").length > collapsedChars;
    const shown =
      expanded || !needsCollapse ? text : (text || "").slice(0, collapsedChars);
    return (
      <>
        <span>{shown}</span>
        {needsCollapse && !expanded && <span>…</span>}
        {needsCollapse && (
          <button
            type="button"
            className="ml-1 text-[#FF7F50] hover:underline"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "less" : "more"}
          </button>
        )}
      </>
    );
  };

  function parseFlexibleTimestamp(ts?: string): number {
    if (!ts) return NaN;
    const native = new Date(ts);
    if (!isNaN(native.getTime())) return native.getTime();
    const parts = ts.split(",");
    const datePart = parts[0]?.trim();
    const timePart = (parts[1] || "").trim();
    if (!datePart) return NaN;
    const dateSegs = datePart.split(/[\/-]/);
    if (dateSegs.length !== 3) return NaN;
    const d = parseInt(dateSegs[0] || "", 10);
    const m = parseInt(dateSegs[1] || "", 10);
    const y = parseInt(dateSegs[2] || "", 10);
    if (!y || !m || !d) return NaN;
    let hh = 0,
      mi = 0,
      ss = 0;
    if (timePart) {
      const [hStr, miStr, sStr] = timePart.split(":");
      hh = parseInt(hStr || "0", 10) || 0;
      mi = parseInt(miStr || "0", 10) || 0;
      ss = parseInt(sStr || "0", 10) || 0;
    }
    const dt = new Date(y, (m || 1) - 1, d, hh, mi, ss);
    return isNaN(dt.getTime()) ? NaN : dt.getTime();
  }

  function formatSafeDate(timestamp?: string): string {
    if (!timestamp) return "No date";

    const timestampMs = parseFlexibleTimestamp(timestamp);
    if (!isNaN(timestampMs)) {
      return new Date(timestampMs).toLocaleString();
    }

    const directDate = new Date(timestamp);
    if (!isNaN(directDate.getTime())) {
      return directDate.toLocaleString();
    }

    return timestamp;
  }

  function formatSafeDateOnly(timestamp?: string): string {
    if (!timestamp) return "No date";

    const timestampMs = parseFlexibleTimestamp(timestamp);
    if (!isNaN(timestampMs)) {
      return new Date(timestampMs).toLocaleDateString();
    }

    const directDate = new Date(timestamp);
    if (!isNaN(directDate.getTime())) {
      return directDate.toLocaleDateString();
    }

    return timestamp;
  }

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
            fileMetadata={fileMetadata}
            onFileUploaded={setFileMetadata}
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
                      className="h-10 border border-[#FF7F50] dark:border-[#FF7F50] pl-10 pr-10 focus:border-[#FF7F50] focus-visible:border-[#FF7F50] focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0"
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
                      } ${!recognition ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      { id: "search", label: "Search Results" },
                      { id: "timeline", label: "Timeline" },
                      { id: "network", label: "Network" },
                      { id: "summary", label: "Summary" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? "border-[#FF7F50] text-[#FF7F50]"
                            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-[#FF7F50]"
                        }`}
                      >
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
                        <div className="mb-4 p-3 bg-[#F8F8F8] dark:bg-[#0F0F0F] rounded-lg border border-[#10B981] dark:border-[#10B981]">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-4 h-4 bg-[#F0FDF4] dark:bg-[#0F1A0F] rounded-full flex items-center justify-center relative">
                              <div className="absolute inset-0 bg-[#10B981] rounded-full animate-gentle-glow opacity-30"></div>
                              <svg
                                className="w-2 h-2 text-[#10B981] relative z-10"
                                fill="currentColor"
                                viewBox="0 0 8 8"
                              >
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              AI Query Intent:
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
                        <div className="flex items-center justify-center h-full min-h-[400px]">
                          <div className="text-center">
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
                                  : "Ready to analyze?"}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 max-w-md mx-auto">
                              {loading
                                ? "Processing your search query and analyzing case data..."
                                : hasSearched
                                  ? "No results found for your search. Try different keywords or broaden your search."
                                  : "Enter a search query to analyze case data and find relevant evidence."}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 p-4">
                          {filteredResults.map((ev, index) => (
                            <div
                              key={`${ev.id || ev.artifact_id || "row"}-${index}`}
                              className="bg-[#F8F8F8] dark:bg-[#0F0F0F] border border-[#FF7F50] dark:border-[#FF7F50] rounded-lg overflow-hidden"
                            >
                              <div className="flex items-center justify-between p-4 border-b border-[#FF7F50] dark:border-[#FF7F50] bg-[#FFF5F0] dark:bg-[#2A1A0F]">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#FF7F50] dark:bg-[#FF7F50] rounded-lg flex items-center justify-center">
                                      <span className="text-white font-bold text-sm">
                                        {index + 1}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {ev.app}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        Artifact ID: {ev.artifact_id}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-xs font-medium text-[#FF7F50] bg-[#FFF5F0] dark:bg-[#2A1A0F] border border-[#FF7F50] dark:border-[#FF7F50] px-2 py-1 rounded-full">
                                    {ev.direction}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {ev.timestamp}
                                  </div>
                                </div>
                              </div>

                              <div className="p-4">
                                <div className="mb-4">
                                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    {ev.sender} →{" "}
                                    {ev.phone_number ||
                                      ev.email ||
                                      ev.jid ||
                                      "Unknown"}
                                  </div>
                                  <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-4 border border-[#FF7F50] dark:border-[#FF7F50]">
                                    <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                                      <ExpandableText
                                        text={String(ev.content || "")}
                                      />
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

                                {(() => {
                                  const allTags = [
                                    ...(ev.tag_badges || []),
                                    ev.message_type,
                                    ev.file_type,
                                  ].filter(Boolean) as string[];

                                  return allTags.length > 0 ? (
                                    <div className="mb-4">
                                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                        Tags
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {allTags.map((tag, tagIndex) => (
                                          <span
                                            key={tagIndex}
                                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-[#FF7F50] bg-[#FFF5F0] dark:bg-[#2A1A0F] border border-[#FF7F50] dark:border-[#FF7F50] rounded-full"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null;
                                })()}

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                  <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors">
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
                                  <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors">
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
                                  <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors">
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
                        <div className="flex items-center justify-center h-full min-h-[400px]">
                          <div className="text-center">
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
                                <div
                                  className="bg-gradient-to-r from-[#FFF5F0] to-[#FFF8F5] dark:from-[#2A1A0F] dark:to-[#2A1F15]  p-4 cursor-pointer hover:from-[#FFF0E6] hover:to-[#FFF5F0] dark:hover:from-[#2A1F15] dark:hover:to-[#2A1A0F] transition-all"
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

                                {isExpanded && (
                                  <div className="relative p-4 bg-[#F8F8F8]/50 dark:bg-[#1A1A1A]/50">
                                    <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-[#E0E0E0] dark:bg-[#2A2A2A]"></div>

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
                                                : "border-[#E0E0E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A]"
                                            }`}
                                          >
                                            <div className="absolute -left-12 top-2 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap bg-white dark:bg-[#1A1A1A] px-1 py-0.5 rounded shadow-sm border border-[#E0E0E0] dark:border-[#2A2A2A]">
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
                                                <ExpandableText
                                                  text={`Participants: ${Array.from(session.participants).join(", ")}`}
                                                  collapsedChars={160}
                                                />
                                              </div>
                                              <div className="bg-[#F8F8F8] dark:bg-[#2A2A2A] rounded-lg p-3">
                                                <div className="text-sm text-slate-800 dark:text-slate-200">
                                                  <ExpandableText
                                                    text={String(
                                                      session.preview || "",
                                                    )}
                                                    collapsedChars={200}
                                                  />
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
                                              <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors">
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
                                              <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors">
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
                                              <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors">
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
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                          </div>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Communication Network
                          </h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {filteredNetworkContacts.length} contacts
                          </div>
                          <svg
                            className="w-2 h-2 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                          >
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {
                              allNetworkContacts.filter((c) => c.suspicious)
                                .length
                            }{" "}
                            flagged
                          </div>
                        </div>
                      </div>

                      {allNetworkContacts.length > 0 && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              Filter:
                            </span>
                            <CustomDropdown
                              value={selectedNetworkFilter}
                              onChange={setSelectedNetworkFilter}
                              options={[
                                "All Contacts",
                                "Phone",
                                "Email",
                                "Username",
                              ]}
                              placeholder="All Contacts"
                            />
                            <CustomDropdown
                              value={selectedNetworkVolume}
                              onChange={setSelectedNetworkVolume}
                              options={[
                                "All Volumes",
                                "High (50+)",
                                "Medium (10-49)",
                                "Low (<10)",
                              ]}
                              placeholder="All Volumes"
                            />
                            <CustomDropdown
                              value={selectedNetworkTime}
                              onChange={setSelectedNetworkTime}
                              options={[
                                "All Time",
                                "Last 24 Hours",
                                "Last 7 Days",
                                "Last 30 Days",
                              ]}
                              placeholder="All Time"
                            />
                            <CustomDropdown
                              value={selectedNetworkSuspicious}
                              onChange={setSelectedNetworkSuspicious}
                              options={["All", "Flagged", "Normal"]}
                              placeholder="All"
                            />
                            <button
                              onClick={() => {
                                setSelectedNetworkFilter("All Contacts");
                                setSelectedNetworkVolume("All Volumes");
                                setSelectedNetworkTime("All Time");
                                setSelectedNetworkSuspicious("All");
                              }}
                              className="text-sm text-slate-500 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      {filteredNetworkContacts.length === 0 ? (
                        <div className="flex items-center justify-center h-full min-h-[400px]">
                          <div className="text-center">
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
                            {allNetworkContacts.length === 0 ? (
                              <>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                  Communication Network
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 max-w-md mx-auto">
                                  Analyze communication patterns and
                                  relationships between contacts to understand
                                  the network structure.
                                </p>
                              </>
                            ) : (
                              <>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                  No Contacts Found
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 max-w-md mx-auto">
                                  No contacts match your current filter
                                  criteria. Try adjusting your filters to see
                                  more contacts.
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 p-4">
                          <div className="space-y-6">
                            <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-4 border border-[#FF7F50] dark:border-[#FF7F50] relative">
                              <div className="mb-3">
                                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  Communication Network
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Interactive visualization of contact
                                  relationships. Drag nodes to explore, hover
                                  for details.
                                </p>
                              </div>

                              <div
                                ref={networkRef}
                                className="w-full h-96 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 relative overflow-hidden"
                                style={{
                                  backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
                                  backgroundSize: "20px 20px",
                                  backgroundPosition: "0 0, 10px 10px",
                                }}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-4 border border-[#FF7F50] dark:border-[#FF7F50]">
                                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  Total Contacts
                                </div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                  {filteredNetworkContacts.length}
                                </div>
                              </div>
                              <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-4 border border-[#FF7F50] dark:border-[#FF7F50]">
                                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  Flagged Contacts
                                </div>
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                  {
                                    filteredNetworkContacts.filter(
                                      (c) => c.suspicious,
                                    ).length
                                  }
                                </div>
                              </div>
                              <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-4 border border-[#FF7F50] dark:border-[#FF7F50]">
                                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  Phone Contacts
                                </div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                  {
                                    filteredNetworkContacts.filter(
                                      (c) => c.type === "phone",
                                    ).length
                                  }
                                </div>
                              </div>
                              <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-4 border border-[#FF7F50] dark:border-[#FF7F50]">
                                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  Email Contacts
                                </div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  {
                                    filteredNetworkContacts.filter(
                                      (c) => c.type === "email",
                                    ).length
                                  }
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              Contact Details
                            </h3>
                            {filteredNetworkContacts
                              .sort(
                                (a, b) =>
                                  b.communicationCount - a.communicationCount,
                              )
                              .map((contact) => {
                                const isExpanded = expandedContacts.has(
                                  contact.id,
                                );
                                return (
                                  <div
                                    key={contact.id}
                                    className={`bg-[#F8F8F8] dark:bg-[#0F0F0F] border rounded-lg overflow-hidden ${
                                      contact.suspicious
                                        ? "border-red-300 dark:border-red-700"
                                        : "border-[#FF7F50] dark:border-[#FF7F50]"
                                    }`}
                                  >
                                    <div
                                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FFF5F0] dark:hover:bg-[#2A1A0F] transition-colors"
                                      onClick={() =>
                                        toggleContactExpansion(contact.id)
                                      }
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                          <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                              contact.type === "phone"
                                                ? "bg-blue-100 dark:bg-blue-900/30"
                                                : contact.type === "email"
                                                  ? "bg-green-100 dark:bg-green-900/30"
                                                  : "bg-purple-100 dark:bg-purple-900/30"
                                            }`}
                                          >
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                              {contact.name
                                                .charAt(0)
                                                .toUpperCase()}
                                            </span>
                                          </div>
                                          <div>
                                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                              {contact.name}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                              {contact.type} •{" "}
                                              {contact.communicationCount}{" "}
                                              communications
                                            </div>
                                          </div>
                                        </div>
                                        {contact.suspicious && (
                                          <div className="flex items-center gap-1">
                                            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                              <svg
                                                className="w-2 h-2 text-white"
                                                fill="currentColor"
                                                viewBox="0 0 8 8"
                                              >
                                                <circle cx="4" cy="4" r="3" />
                                              </svg>
                                            </div>
                                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                              Flagged
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="text-xs text-slate-500">
                                          {formatSafeDateOnly(
                                            contact.lastCommunication,
                                          )}
                                        </div>
                                        <svg
                                          className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
                                      </div>
                                    </div>

                                    {isExpanded && (
                                      <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700">
                                        <div className="pt-4 space-y-3">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-3 border border-[#FF7F50] dark:border-[#FF7F50]">
                                              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                                Communication Summary
                                              </div>
                                              <div className="space-y-1 text-xs">
                                                <div className="flex justify-between">
                                                  <span className="text-slate-500">
                                                    Total:
                                                  </span>
                                                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                                                    {contact.communicationCount}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-slate-500">
                                                    Types:
                                                  </span>
                                                  <span className="text-slate-700 dark:text-slate-300">
                                                    {Array.from(
                                                      contact.communicationTypes,
                                                    ).join(", ")}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-slate-500">
                                                    Last Contact:
                                                  </span>
                                                  <span className="text-slate-700 dark:text-slate-300">
                                                    {formatSafeDate(
                                                      contact.lastCommunication,
                                                    )}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-lg p-3 border border-[#FF7F50] dark:border-[#FF7F50]">
                                              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                                Analysis
                                              </div>
                                              <div className="space-y-1 text-xs">
                                                <div className="flex justify-between">
                                                  <span className="text-slate-500">
                                                    Type:
                                                  </span>
                                                  <span className="text-slate-700 dark:text-slate-300 capitalize">
                                                    {contact.type}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-slate-500">
                                                    Status:
                                                  </span>
                                                  <span
                                                    className={`font-medium ${
                                                      contact.suspicious
                                                        ? "text-red-600 dark:text-red-400"
                                                        : "text-green-600 dark:text-green-400"
                                                    }`}
                                                  >
                                                    {contact.suspicious
                                                      ? "Suspicious"
                                                      : "Normal"}
                                                  </span>
                                                </div>
                                                {contact.flags &&
                                                  contact.flags.length > 0 && (
                                                    <div className="flex justify-between">
                                                      <span className="text-slate-500">
                                                        Flags:
                                                      </span>
                                                      <span className="text-slate-700 dark:text-slate-300">
                                                        {contact.flags.join(
                                                          ", ",
                                                        )}
                                                      </span>
                                                    </div>
                                                  )}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                            <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors">
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
                                              View Evidence
                                            </button>
                                            <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors">
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
                                              Export Contact
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "summary" && (
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
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                          </div>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Case Summary
                          </h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Investigation overview
                          </div>
                          <svg
                            className="w-2 h-2 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                          >
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {searchData.totalResults} items analyzed
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="">
                      {searchData.totalResults === 0 ? (
                        <div className="flex items-center justify-center h-full min-h-[400px]">
                          <div className="text-center">
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
                              No Summary Available
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 max-w-md mx-auto">
                              Run a search to generate actionable insights and
                              comprehensive case analysis.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                              <div className="text-4xl font-bold text-[#FF7F50] mb-2">
                                {searchData.totalResults}
                              </div>
                              <div className="text-lg text-slate-600 dark:text-slate-400">
                                Evidence Items
                              </div>
                            </div>

                            <div className="text-center">
                              <div className="text-4xl font-bold text-red-500 mb-2">
                                {
                                  results.filter((r) =>
                                    (r.tag_badges || []).some(
                                      (tag) =>
                                        tag.includes("Cryptocurrency") ||
                                        tag.includes("Financial") ||
                                        tag.includes("Suspicious"),
                                    ),
                                  ).length
                                }
                              </div>
                              <div className="text-lg text-slate-600 dark:text-slate-400">
                                Flagged Items
                              </div>
                            </div>

                            <div className="text-center">
                              <div className="text-4xl font-bold text-blue-500 mb-2">
                                {new Set(results.map((r) => r.sender)).size}
                              </div>
                              <div className="text-lg text-slate-600 dark:text-slate-400">
                                Unique Contacts
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 text-center">
                              Evidence Breakdown
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                              {(() => {
                                const appCounts = results.reduce(
                                  (acc, result) => {
                                    const app = result.app.toLowerCase();
                                    if (app.includes("whatsapp"))
                                      acc.whatsapp++;
                                    else if (app.includes("sms")) acc.sms++;
                                    else if (app.includes("email")) acc.email++;
                                    else acc.other++;
                                    return acc;
                                  },
                                  { whatsapp: 0, sms: 0, email: 0, other: 0 },
                                );

                                return [
                                  {
                                    label: "WhatsApp",
                                    count: appCounts.whatsapp,
                                    color: "text-green-500",
                                  },
                                  {
                                    label: "SMS",
                                    count: appCounts.sms,
                                    color: "text-blue-500",
                                  },
                                  {
                                    label: "Email",
                                    count: appCounts.email,
                                    color: "text-purple-500",
                                  },
                                  {
                                    label: "Other",
                                    count: appCounts.other,
                                    color: "text-slate-500",
                                  },
                                ].map((item, index) => (
                                  <div key={index} className="text-center">
                                    <div
                                      className={`text-3xl font-bold ${item.color} mb-2`}
                                    >
                                      {item.count}
                                    </div>
                                    <div className="text-base text-slate-600 dark:text-slate-400">
                                      {item.label}
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 text-center">
                              Investigation Timeline
                            </h3>
                            <div className="max-w-md mx-auto space-y-4">
                              {(() => {
                                const timelineSessions =
                                  groupEventsIntoSessions(results || []);
                                const dailySummaries = getDailySummaries(
                                  timelineSessions || [],
                                );
                                const totalSessions = dailySummaries.reduce(
                                  (sum, day) => sum + day.sessions.length,
                                  0,
                                );
                                const dateRange =
                                  dailySummaries.length > 0
                                    ? `${dailySummaries[0].date} - ${dailySummaries[dailySummaries.length - 1].date}`
                                    : "No data";

                                return (
                                  <>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                                      <span className="text-slate-600 dark:text-slate-400">
                                        Investigation Period
                                      </span>
                                      <span className="font-medium text-slate-900 dark:text-slate-100">
                                        {dateRange}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                                      <span className="text-slate-600 dark:text-slate-400">
                                        Active Days
                                      </span>
                                      <span className="font-medium text-slate-900 dark:text-slate-100">
                                        {dailySummaries.length}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                      <span className="text-slate-600 dark:text-slate-400">
                                        Communication Sessions
                                      </span>
                                      <span className="font-medium text-slate-900 dark:text-slate-100">
                                        {totalSessions}
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 text-center">
                              Communication Network
                            </h3>
                            <div className="max-w-md mx-auto space-y-4">
                              {(() => {
                                const allNetworkContacts =
                                  analyzeSuspiciousContacts(
                                    extractContactsFromResults(results),
                                  );
                                const flaggedContacts =
                                  allNetworkContacts.filter(
                                    (c) => c.suspicious,
                                  ).length;
                                const phoneContacts = allNetworkContacts.filter(
                                  (c) => c.type === "phone",
                                ).length;
                                const emailContacts = allNetworkContacts.filter(
                                  (c) => c.type === "email",
                                ).length;

                                return (
                                  <>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                                      <span className="text-slate-600 dark:text-slate-400">
                                        Total Contacts
                                      </span>
                                      <span className="font-medium text-slate-900 dark:text-slate-100">
                                        {allNetworkContacts.length}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                                      <span className="text-slate-600 dark:text-slate-400">
                                        Flagged Contacts
                                      </span>
                                      <span className="font-medium text-red-500">
                                        {flaggedContacts}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                                      <span className="text-slate-600 dark:text-slate-400">
                                        Phone Numbers
                                      </span>
                                      <span className="font-medium text-slate-900 dark:text-slate-100">
                                        {phoneContacts}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                      <span className="text-slate-600 dark:text-slate-400">
                                        Email Addresses
                                      </span>
                                      <span className="font-medium text-slate-900 dark:text-slate-100">
                                        {emailContacts}
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 text-center">
                              Case Information
                            </h3>
                            <div className="max-w-md mx-auto space-y-4">
                              <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                                <span className="text-slate-600 dark:text-slate-400">
                                  Case ID
                                </span>
                                <span className="font-mono text-sm text-slate-900 dark:text-slate-100 break-all">
                                  {caseId}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                                <span className="text-slate-600 dark:text-slate-400">
                                  Search Query
                                </span>
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                  {query || "No query entered"}
                                </span>
                              </div>
                              <div className="py-3 border-b border-slate-200 dark:border-slate-700">
                                <div className="text-slate-600 dark:text-slate-400 mb-2">
                                  Query Intent
                                </div>
                                <div className="font-medium text-slate-900 dark:text-slate-100 text-sm leading-relaxed">
                                  {searchData.intent}
                                </div>
                              </div>
                              <div className="flex justify-between items-center py-3">
                                <span className="text-slate-600 dark:text-slate-400">
                                  Processing Time
                                </span>
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                  {searchData.processingTime}ms
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
