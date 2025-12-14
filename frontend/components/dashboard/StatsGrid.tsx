"use client";

import { useEffect, useState } from "react";

interface UserStats {
  timeSaved: number;
  filesAnalyzed: number;
  casesCreated: number;
  searchesPerformed: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-xl p-6 border border-[#E0E0E0] dark:border-[#2A2A2A]">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-2xl font-light text-[#2A2A2A] dark:text-[#E0E0E0] mb-1">
            {value}
          </div>
          <div className="text-sm font-medium text-[#4A4A4A] dark:text-[#B0B0B0]">
            {title}
          </div>
        </div>
        <div
          className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function StatsGrid() {
  const [stats] = useState<UserStats>({
    timeSaved: 0,
    filesAnalyzed: 0,
    casesCreated: 0,
    searchesPerformed: 0,
  });

  useEffect(() => {
    // TODO: Add API call to fetch user stats from backend
  }, []);

  const statsData = [
    {
      title: "Time Saved",
      value: `${stats.timeSaved}h`,
      icon: (
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
      ),
      color:
        "bg-[#FFF5F0] dark:bg-[#2A1A0F] border border-[#FF7F50]/20 dark:border-[#FF7F50]/30",
    },
    {
      title: "Files Analyzed",
      value: stats.filesAnalyzed,
      icon: (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color:
        "bg-[#FFF5F0] dark:bg-[#2A1A0F] border border-[#FF7F50]/20 dark:border-[#FF7F50]/30",
    },
    {
      title: "Cases Created",
      value: stats.casesCreated,
      icon: (
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      color:
        "bg-[#FFF5F0] dark:bg-[#2A1A0F] border border-[#FF7F50]/20 dark:border-[#FF7F50]/30",
    },
    {
      title: "Searches Performed",
      value: stats.searchesPerformed,
      icon: (
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
      ),
      color:
        "bg-[#FFF5F0] dark:bg-[#2A1A0F] border border-[#FF7F50]/20 dark:border-[#FF7F50]/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
