interface ResultStatsProps {
  total: number;
  query: string;
}

export default function ResultStats({ total, query }: ResultStatsProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-900 dark:text-slate-100 font-medium">
          {total}
        </span>
        <span className="text-slate-500">results</span>
        {query ? <span className="text-slate-500">for “{query}”</span> : null}
      </div>
    </div>
  );
}
