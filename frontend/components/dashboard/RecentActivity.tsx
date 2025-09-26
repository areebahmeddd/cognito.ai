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
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Load recent activities from localStorage or API
    const savedActivities = localStorage.getItem("cognito-recent-activities");
    if (savedActivities) {
      setActivities(JSON.parse(savedActivities));
    } else {
      // Mock data for demo
      const mockActivities: ActivityItem[] = [
        {
          id: "1",
          type: "case_created",
          title: "Created new case",
          description: "Crypto messaging ring investigation",
          timestamp: "2 hours ago",
          caseId: "1",
        },
        {
          id: "2",
          type: "search_performed",
          title: "Performed search",
          description: "Found 23 results for 'bitcoin transactions'",
          timestamp: "4 hours ago",
        },
        {
          id: "3",
          type: "file_uploaded",
          title: "Uploaded files",
          description: "Added 5 WhatsApp export files",
          timestamp: "1 day ago",
        },
        {
          id: "4",
          type: "analysis_completed",
          title: "Analysis completed",
          description: "Foreign communications sweep - 156 files processed",
          timestamp: "2 days ago",
          caseId: "2",
        },
      ];
      setActivities(mockActivities);
      localStorage.setItem(
        "cognito-recent-activities",
        JSON.stringify(mockActivities),
      );
    }
  }, []);

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "case_created":
        return (
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
            className="w-5 h-5 text-green-600 dark:text-green-400"
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
            className="w-5 h-5 text-orange-600 dark:text-orange-400"
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
            className="w-5 h-5 text-purple-600 dark:text-purple-400"
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
        return "bg-blue-100 dark:bg-blue-900/30";
      case "search_performed":
        return "bg-green-100 dark:bg-green-900/30";
      case "file_uploaded":
        return "bg-orange-100 dark:bg-orange-900/30";
      case "analysis_completed":
        return "bg-purple-100 dark:bg-purple-900/30";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Recent Activity
      </h2>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
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
            <p className="text-slate-500 dark:text-slate-400">
              No recent activity
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div
                className={`w-10 h-10 ${getActivityColor(activity.type)} rounded-xl flex items-center justify-center flex-shrink-0`}
              >
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {activity.title}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {activity.timestamp}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {activity.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
