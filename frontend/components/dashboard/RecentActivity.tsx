"use client";

import { useEffect, useState } from "react";

interface ActivityItem {
  id: string;
  type:
    | "case_created"
    | "search_performed"
    | "file_uploaded"
    | "analysis_completed";
  title: string;
  description: string;
  timestamp: string;
  caseId?: string;
}

export default function RecentActivity() {
  const [activities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // TODO: Add API call to fetch recent activities from backend
  }, []);

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "case_created":
        return (
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        );
      case "search_performed":
        return (
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        );
      case "file_uploaded":
        return (
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        );
      case "analysis_completed":
        return (
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getActivityColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "case_created":
        return "bg-[#FF7F50]";
      case "search_performed":
        return "bg-[#FF7F50]";
      case "file_uploaded":
        return "bg-[#FF7F50]";
      case "analysis_completed":
        return "bg-[#FF7F50]";
    }
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-xl p-6 border border-[#E0E0E0] dark:border-[#2A2A2A] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-light text-[#2A2A2A] dark:text-[#E0E0E0]">
          Recent <span className="text-[#FF7F50]">Activity</span>
        </h2>
        <button className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0] font-medium hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors">
          View All
        </button>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#FFF5F0] dark:bg-[#2A1A0F] rounded-xl flex items-center justify-center mx-auto mb-4 border border-[#FF7F50]/20 dark:border-[#FF7F50]/30">
              <svg
                className="w-8 h-8 text-[#FF7F50]"
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
            <p className="text-[#4A4A4A] dark:text-[#B0B0B0] font-medium">
              No recent activity
            </p>
            <p className="text-xs text-[#4A4A4A] dark:text-[#B0B0B0] mt-1">
              Your activity will appear here
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-[#F8F8F8] dark:bg-[#2A2A2A] rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 ${getActivityColor(activity.type)} rounded-full flex items-center justify-center flex-shrink-0`}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                      {activity.title}
                    </h3>
                    <span className="text-xs text-[#4A4A4A] dark:text-[#B0B0B0] bg-[#E0E0E0] dark:bg-[#4A4A4A] px-2 py-1 rounded-full">
                      {activity.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0] leading-relaxed">
                    {activity.description}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
