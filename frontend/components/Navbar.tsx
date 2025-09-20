import React from "react";
import Link from "next/link";
import { Home, Github } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4 relative z-30">
      <div className="flex-1 flex justify-start">
        <Link
          href="/"
          className="text-slate-700 flex items-center gap-2 hover:bg-gray-200 p-2 rounded-sm hover:text-slate-900 transition-colors duration-200"
        >
          <Image
            src="/logo.png"
            alt="logo"
            width={100}
            height={100}
            className="h-5 w-5"
          />
          <span className="text-slate-700 text-md font-bold">Cognito AI</span>
        </Link>
      </div>
      <div className="flex space-x-8">
        <Link
          href="/how-it-works"
          className="text-slate-600 hover:text-slate-900 transition-colors duration-300 font-medium relative group"
        >
          How it works
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 transition-all duration-300 group-hover:w-full"></span>
        </Link>
        <Link
          href="/how-to-use"
          className="text-slate-600 hover:text-slate-900 transition-colors duration-300 font-medium relative group"
        >
          How to use
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 transition-all duration-300 group-hover:w-full"></span>
        </Link>
      </div>
      <div className="flex-1 flex justify-end">
        <a
          href="https://github.com/areebahmeddd/cognito.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-700 hover:bg-gray-200 p-2 rounded-sm hover:text-slate-900 transition-colors duration-200"
        >
          <Github className="h-5 w-5" />
        </a>
      </div>
    </nav>
  );
}
