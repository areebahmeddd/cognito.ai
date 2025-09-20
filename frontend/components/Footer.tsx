import React from "react";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="text-center pb-5 mt-auto pt-5 relative z-30">
      <p className="text-slate-600 flex items-center justify-center gap-2">
        Built with <Heart className="h-4 w-4 text-accent fill-current" /> for
        Smart India Hackathon
      </p>
    </footer>
  );
}
