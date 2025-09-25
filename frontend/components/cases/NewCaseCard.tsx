export default function NewCaseCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      onClick={onCreate}
      className="group flex h-48 w-full items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all"
    >
      <div className="flex flex-col items-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 group-hover:scale-105 transition-transform">
          +
        </div>
        <div className="text-lg font-medium">Create new case</div>
      </div>
    </button>
  );
}
