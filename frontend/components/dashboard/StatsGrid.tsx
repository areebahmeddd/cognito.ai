"use client";

import { useEffect, useState } from "react";

interface UserStats {
  name: string;
  timeSaved: number;
  filesAnalyzed: number;
  casesCreated: number;
  searchesPerformed: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trend.isPositive ? "M7 17l9.2-9.2M17 17V7H7" : "M17 7l-9.2 9.2M7 7v10h10"} />
            </svg>
            {trend.value}%
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          {value}
        </div>
        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
          {title}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-500">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

export default function StatsGrid() {
  const [stats, setStats] = useState<UserStats>({
    name: "User",
    timeSaved: 0,
    filesAnalyzed: 0,
    casesCreated: 0,
    searchesPerformed: 0,
  });

  useEffect(() => {
    const savedStats = localStorage.getItem("cognito-user-stats");
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    } else {
      const mockStats: UserStats = {
        name: "Shivansh",
        timeSaved: 24.5,
        filesAnalyzed: 156,
        casesCreated: 8,
        searchesPerformed: 342,
      };
      setStats(mockStats);
      localStorage.setItem("cognito-user-stats", JSON.stringify(mockStats));
    }
  }, []);

  const statsData = [
    {
      title: "Time Saved",
      value: `${stats.timeSaved}h`,
      subtitle: "vs manual analysis",
      icon: (
        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-green-100 dark:bg-green-900/30",
      trend: { value: 15, isPositive: true }
    },
    {
      title: "Files Analyzed",
      value: stats.filesAnalyzed,
      subtitle: "documents processed",
      icon: (
        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "bg-blue-100 dark:bg-blue-900/30",
      trend: { value: 8, isPositive: true }
    },
    {
      title: "Cases Created",
      value: stats.casesCreated,
      subtitle: "active investigations",
      icon: (
        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: "bg-purple-100 dark:bg-purple-900/30",
      trend: { value: 3, isPositive: true }
    },
    {
      title: "Searches Performed",
      value: stats.searchesPerformed,
      subtitle: "AI-powered queries",
      icon: (
        <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: "bg-orange-100 dark:bg-orange-900/30",
      trend: { value: 12, isPositive: true }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
