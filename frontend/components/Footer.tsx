import React from "react";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-30 mt-auto pt-5 pb-5 text-center">
      <p className="flex items-center justify-center gap-2 text-slate-600">
        Built with <Heart className="text-accent h-4 w-4 fill-current" /> for
        Smart India Hackathon
      </p>
    </footer>
  );
}
