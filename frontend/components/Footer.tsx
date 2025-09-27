import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#1A1A1A] border-t border-[#E0E0E0] dark:border-[#2A2A2A]">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <p className="flex items-center justify-center gap-2 text-sm text-[#4A4A4A] dark:text-[#808080]">
          Built with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> for
          Smart India Hackathon
        </p>
      </div>
    </footer>
  );
}
