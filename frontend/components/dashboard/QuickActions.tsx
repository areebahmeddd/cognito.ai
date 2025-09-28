"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface QuickActionsProps {
  onCreateCase?: () => void;
}

export default function QuickActions({ onCreateCase }: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      title: "Create New Case",
      description: "Start a new investigation",
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
      onClick: () => {
        if (onCreateCase) {
          onCreateCase();
        } else {
          router.push("/cases");
        }
      },
      color: "bg-[#FF7F50]",
    },
    {
      title: "View All Cases",
      description: "Browse your investigations",
      icon: (
        <svg
          className="w-6 h-6"
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
      onClick: () => router.push("/cases"),
      color: "bg-[#FF7F50]",
    },
    {
      title: "Analytics",
      description: "View analysis insights",
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
      onClick: () => router.push("/analytics"),
      color: "bg-[#FF7F50]",
    },
    {
      title: "Upload Files",
      description: "Add new evidence",
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
      onClick: () => {
        toast.info("File upload coming soon", {
          description: "This feature will be available in a future update",
        });
      },
      color: "bg-[#FF7F50]",
    },
  ];

  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-xl p-6 border border-[#E0E0E0] dark:border-[#2A2A2A] h-full flex flex-col">
      <h2 className="text-xl font-light text-[#2A2A2A] dark:text-[#E0E0E0] mb-6">
        Quick <span className="text-[#FF7F50]">Actions</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 justify-items-center">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`${action.color} text-white rounded-lg p-6 flex items-center gap-4 text-left w-full max-w-xs transition-all duration-200 hover:opacity-90 hover:scale-[1.02]`}
          >
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              {action.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-base mb-1">{action.title}</div>
              <div className="text-sm opacity-90">{action.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
