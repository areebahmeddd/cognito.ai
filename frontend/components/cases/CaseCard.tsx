export interface CaseItem {
  id: string;
  title: string;
  updatedAt: string; // ISO date
  sourcesCount: number;
  color?: string;
}

export default function CaseCard({
  item,
  onOpen,
  onMenu,
}: {
  item: CaseItem;
  onOpen: (id: string) => void;
  onMenu?: (id: string) => void;
}) {
  return (
    <div
      className="group relative h-48 w-full cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all"
      onClick={() => onOpen(item.id)}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div
            className="h-8 w-8 rounded-md"
            style={{ backgroundColor: item.color || "#94a3b8" }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenu?.(item.id);
            }}
            className="rounded p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label="Open menu"
          >
            ⋯
          </button>
        </div>
        <div>
          <div className="line-clamp-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {item.title}
          </div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {new Date(item.updatedAt).toLocaleDateString()} •{" "}
            {item.sourcesCount} sources
          </div>
        </div>
      </div>
    </div>
  );
}
