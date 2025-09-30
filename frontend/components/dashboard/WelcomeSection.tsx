"use client";

import { getUser } from "@/lib/user";
import { useEffect, useState } from "react";

interface UserStats {
  name: string;
  role: string;
  timeSaved: number;
  filesAnalyzed: number;
  casesCreated: number;
  searchesPerformed: number;
}

export default function WelcomeSection() {
  const [stats, setStats] = useState<UserStats>({
    name: "User",
    role: "Analyst",
    timeSaved: 0,
    filesAnalyzed: 0,
    casesCreated: 0,
    searchesPerformed: 0,
  });

  const [nowString, setNowString] = useState<string>("");

  const formatDateTime = (date: Date): string => {
    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const weekday = weekdays[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    const hours24 = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours24 >= 12 ? "PM" : "AM";
    const hh = String(hours24).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");

    return `${weekday}, ${month} ${day}, ${year} | ${hh}:${mm} ${ampm}`;
  };

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const user = getUser() || { name: "User", email: "", role: "Analyst" };

        const mockStats: UserStats = {
          name: user.name,
          role: user.role,
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

  useEffect(() => {
    const updateNow = () => setNowString(formatDateTime(new Date()));
    updateNow();
    const id = setInterval(updateNow, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#2A2A2A] via-[#1A1A1A] to-[#0F0F0F] dark:from-[#2A2A2A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] rounded-xl p-8 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            animation: "waveMove 8s ease-in-out infinite",
          }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
          >
            <path
              d="M0,100 Q100,50 200,100 T400,100 L400,200 L0,200 Z"
              fill="url(#waveGradient1)"
              opacity="0.6"
            />
            <defs>
              <linearGradient
                id="waveGradient1"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#FF7F50" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div
          className="absolute inset-0"
          style={{
            animation: "waveMove 10s ease-in-out infinite reverse",
            animationDelay: "2s",
          }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
          >
            <path
              d="M0,120 Q100,80 200,120 T400,120 L400,200 L0,200 Z"
              fill="url(#waveGradient2)"
              opacity="0.5"
            />
            <defs>
              <linearGradient
                id="waveGradient2"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#FF7F50" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div
          className="absolute inset-0"
          style={{
            animation: "waveMove 12s ease-in-out infinite",
            animationDelay: "4s",
          }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
          >
            <path
              d="M0,140 Q100,100 200,140 T400,140 L400,200 L0,200 Z"
              fill="url(#waveGradient3)"
              opacity="0.4"
            />
            <defs>
              <linearGradient
                id="waveGradient3"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#FF7F50" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <style jsx>{`
        @keyframes waveMove {
          0% {
            transform: translateX(-100%) scaleX(1);
            opacity: 0.6;
          }
          25% {
            transform: translateX(-50%) scaleX(1.1);
            opacity: 0.8;
          }
          50% {
            transform: translateX(0%) scaleX(1);
            opacity: 1;
          }
          75% {
            transform: translateX(50%) scaleX(1.1);
            opacity: 0.8;
          }
          100% {
            transform: translateX(100%) scaleX(1);
            opacity: 0.6;
          }
        }
      `}</style>

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight mb-2">
              Welcome back, <span className="text-[#FF7F50]">{stats.name}</span>
              !
            </h1>
            <p className="text-[#B0B0B0] text-lg font-light">{nowString}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
