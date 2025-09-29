"use client";

import { useEffect, useState } from "react";

interface UserStats {
  name: string;
  timeSaved: number;
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
    const fetchUserStats = async () => {
      try {
        const mockStats: UserStats = {
          name: "Areeb",
          timeSaved: 21.5,
          filesAnalyzed: 156,
          casesCreated: 8,
          searchesPerformed: 342,
        };
        setStats(mockStats);
      } catch (error) {}
    };

    fetchUserStats();
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#2A2A2A] via-[#1A1A1A] to-[#0F0F0F] dark:from-[#2A2A2A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] rounded-xl p-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2">
            Welcome back, <span className="text-[#FF7F50]">{stats.name}</span>!
            👋
          </h1>
          <p className="text-[#B0B0B0] text-lg font-light">
            Ready to analyze your next case?
          </p>
        </div>
        <div className="hidden md:block">
          <div className="w-20 h-20 bg-[#FF7F50]/20 rounded-full flex items-center justify-center border border-[#FF7F50]/30">
            <svg
              className="w-10 h-10 text-[#FF7F50]"
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
