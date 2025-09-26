"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: "Create New Case",
      description: "Start a new investigation",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      onClick: () => {
        // This will be handled by the cases page modal
        router.push("/cases");
      },
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "View All Cases",
      description: "Browse your investigations",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      onClick: () => router.push("/cases"),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Quick Search",
      description: "Search across all data",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      onClick: () => router.push("/dashboard?q="),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Upload Files",
      description: "Add new evidence",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      onClick: () => {
        // Placeholder for file upload functionality
        console.log("Upload files clicked");
      },
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <Button
            key={index}
            onClick={action.onClick}
            className={`${action.color} text-white h-auto p-4 flex items-start gap-3 text-left`}
          >
            <div className="flex-shrink-0">
              {action.icon}
            </div>
            <div>
              <div className="font-medium">{action.title}</div>
              <div className="text-sm opacity-90">{action.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
