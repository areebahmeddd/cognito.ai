"use client";

import { useEffect, useState } from "react";

interface UserStats {
  name: string;
  timeSaved: number; // in hours
  filesAnalyzed: number;
  casesCreated: number;
  searchesPerformed: number;
}

export default function WelcomeSection() {
  const [stats, setStats] = useState<UserStats>({
    name: "User",
    timeSaved: 0,
    filesAnalyzed: 0,
    casesCreated: 0,
    searchesPerformed: 0,
  });

  useEffect(() => {
    // Load user stats from localStorage or API
    const savedStats = localStorage.getItem("cognito-user-stats");
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    } else {
      // Mock data for demo
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

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {stats.name}! 👋
          </h1>
          <p className="text-blue-100 text-lg">
            Ready to analyze your next case?
          </p>
        </div>
        <div className="hidden md:block">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10"
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
          </div>
        </div>
      </div>
    </div>
  );
}
