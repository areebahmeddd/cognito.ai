import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          Built with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> for
          Smart India Hackathon
        </p>
      </div>
    </footer>
  );
}
