"use client";

import { useState, useEffect, useRef } from "react";
import {
  Home,
  Github,
  Heart,
  User,
  Laptop,
  BarChart3,
  Trash2,
  Plus,
  Minus,
  Square,
  TrendingUp,
  Download,
  FileText,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface GraphNode {
  id: string;
  label: string;
  type: "user" | "device";
  email?: string;
  hostname?: string;
  address?: string;
  created?: string;
  description?: string;
  host?: string;
  updated?: string;
}

export default function DashboardPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const nodes: GraphNode[] = [
    {
      id: "1",
      label: "areeb@testing.com",
      type: "user",
      email: "areeb@testing.com",
      created: "07/09/2025, 4:17:11 PM",
      updated: "07/09/2025, 4:17:11 PM",
    },
    {
      id: "2",
      label: "michael@testing",
      type: "device",
      hostname: "michael@testing",
      address: "192.168.1.100",
      created: "07/09/2025, 4:17:11 PM",
      description: "michael@testing",
      host: "michael; darwin; darwin; Standalone Workstation; 15.3.1; 24.3.0; arm64",
      updated: "07/09/2025, 4:17:11 PM",
    },
  ];

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleExport = (format: "pdf" | "json" | "csv") => {
    const summaryData = {
      totalNodes: nodes.length,
      connections: 1,
      threatLevel: selectedNode ? "Low" : "Unknown",
      securityStatus: selectedNode ? "Analyzed" : "Pending",
      dataSources: 3,
      lastScan: selectedNode ? "2 min ago" : "Never",
      cryptoAddresses: 12,
      foreignComms: 5,
      selectedNode: selectedNode?.label || "None",
      timestamp: new Date().toISOString(),
    };

    if (format === "json") {
      const dataStr = JSON.stringify(summaryData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "forensic-summary.json";
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === "csv") {
      const csvData = [
        ["Metric", "Value"],
        ["Total Nodes", summaryData.totalNodes],
        ["Connections", summaryData.connections],
        ["Threat Level", summaryData.threatLevel],
        ["Security Status", summaryData.securityStatus],
        ["Data Sources", summaryData.dataSources],
        ["Last Scan", summaryData.lastScan],
        ["Crypto Addresses", summaryData.cryptoAddresses],
        ["Foreign Communications", summaryData.foreignComms],
        ["Selected Node", summaryData.selectedNode],
        ["Export Timestamp", summaryData.timestamp],
      ]
        .map((row) => row.join(","))
        .join("\n");

      const dataBlob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "forensic-summary.csv";
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === "pdf") {
      // For PDF, we'll create a simple text-based PDF using a library or show a message
      alert(
        "PDF export feature will be implemented with a PDF library. For now, please use JSON or CSV export."
      );
    }

    setShowExportMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      <Navbar />

      <main className="flex-1 flex relative z-10 px-6">
        <div className="flex-1 flex gap-6">
          <div className="flex-1 relative bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="absolute inset-0 bg-slate-50 bg-dot-pattern opacity-50"></div>
            <div
              className="relative h-full flex items-center justify-center p-8 overflow-hidden cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className="relative transition-transform duration-300 ease-in-out"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
                }}
              >
                <svg
                  width="400"
                  height="300"
                  className="absolute inset-0 opacity-30"
                >
                  <defs>
                    <pattern
                      id="grid"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                <div className="relative z-10">
                  <div
                    className={`absolute cursor-pointer transition-all duration-300 hover:scale-110 ${
                      selectedNode?.id === "1"
                        ? "ring-4 ring-gray-300 shadow-xl"
                        : "hover:shadow-lg"
                    }`}
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: "translateX(-50%)",
                    }}
                    onClick={() => handleNodeClick(nodes[0])}
                  >
                    <div className="bg-black text-white px-4 py-3 rounded-xl flex items-center space-x-2 shadow-lg">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        areeb@testing.com
                      </span>
                    </div>
                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-600 rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 flex space-x-2">
              <button
                onClick={handleZoomIn}
                className="p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-md hover:bg-white hover:shadow-lg transition-all duration-200 border border-slate-200"
              >
                <Plus className="h-4 w-4 text-slate-600" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-md hover:bg-white hover:shadow-lg transition-all duration-200 border border-slate-200"
              >
                <Minus className="h-4 w-4 text-slate-600" />
              </button>
              <button
                onClick={handleResetView}
                className="p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-md hover:bg-white hover:shadow-lg transition-all duration-200 border border-slate-200"
              >
                <Square className="h-4 w-4 text-slate-600" />
              </button>
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-2 shadow-md">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-black rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-96 flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 flex-1 overflow-y-auto">
              {selectedNode ? (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    {selectedNode.type === "user" ? (
                      <User className="h-5 w-5 text-slate-600" />
                    ) : (
                      <Laptop className="h-5 w-5 text-slate-600" />
                    )}
                    <h2 className="text-lg font-semibold text-slate-900">
                      {selectedNode.label}
                    </h2>
                  </div>

                  <p className="text-sm text-slate-600 mb-4">
                    {selectedNode.type === "user"
                      ? "A user account in the system"
                      : "An environment on a host with address [redacted IP address]"}
                  </p>

                  <div className="flex space-x-2 mb-6">
                    <button className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-all duration-200 shadow-md hover:shadow-lg">
                      <TrendingUp className="h-3 w-3" />
                      <span>Analytics</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-white text-black border-2 border-black rounded-lg text-sm hover:bg-gray-100 transition-all duration-200 shadow-md hover:shadow-lg">
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedNode.address && (
                      <div>
                        <span className="text-sm font-medium text-slate-700">
                          Address:
                        </span>
                        <span className="text-sm text-slate-600 ml-2">
                          {selectedNode.address}
                        </span>
                      </div>
                    )}
                    {selectedNode.created && (
                      <div>
                        <span className="text-sm font-medium text-slate-700">
                          Created:
                        </span>
                        <span className="text-sm text-slate-600 ml-2">
                          {selectedNode.created}
                        </span>
                      </div>
                    )}
                    {selectedNode.description && (
                      <div>
                        <span className="text-sm font-medium text-slate-700">
                          Description:
                        </span>
                        <span className="text-sm text-slate-600 ml-2">
                          {selectedNode.description}
                        </span>
                      </div>
                    )}
                    {selectedNode.host && (
                      <div>
                        <span className="text-sm font-medium text-slate-700">
                          Host:
                        </span>
                        <span className="text-sm text-slate-600 ml-2">
                          {selectedNode.host}
                        </span>
                      </div>
                    )}
                    {selectedNode.updated && (
                      <div>
                        <span className="text-sm font-medium text-slate-700">
                          Updated:
                        </span>
                        <span className="text-sm text-slate-600 ml-2">
                          {selectedNode.updated}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <BarChart3 className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Node Information
                    </h3>
                    <p className="text-sm text-slate-600">
                      Click on a node in the graph to view its details
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Summary
                  </h3>
                </div>
                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                  >
                    <Download className="h-4 w-4 text-slate-600" />
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                      <div className="py-2">
                        <button
                          onClick={() => handleExport("pdf")}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-200"
                        >
                          <FileText className="h-4 w-4 text-red-500" />
                          <span>Export as PDF</span>
                        </button>
                        <button
                          onClick={() => handleExport("json")}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-200"
                        >
                          <FileJson className="h-4 w-4 text-yellow-500" />
                          <span>Export as JSON</span>
                        </button>
                        <button
                          onClick={() => handleExport("csv")}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-200"
                        >
                          <FileSpreadsheet className="h-4 w-4 text-green-500" />
                          <span>Export as CSV</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg h-20 flex flex-col justify-center">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Total Nodes
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {nodes.length}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg h-20 flex flex-col justify-center">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Connections
                  </p>
                  <p className="text-2xl font-bold text-slate-900">1</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg h-20 flex flex-col justify-center">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Threat Level
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedNode ? "Low" : "Unknown"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg h-20 flex flex-col justify-center">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Security Status
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedNode ? "Analyzed" : "Pending"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg h-20 flex flex-col justify-center">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Data Sources
                  </p>
                  <p className="text-2xl font-bold text-slate-900">3</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg h-20 flex flex-col justify-center">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Last Scan
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedNode ? "2 min ago" : "Never"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg h-20 flex flex-col justify-center">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Crypto Addresses
                  </p>
                  <p className="text-2xl font-bold text-slate-900">12</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg h-20 flex flex-col justify-center">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Foreign Comms
                  </p>
                  <p className="text-2xl font-bold text-slate-900">5</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
