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
}: {
  item: CaseItem;
  onOpen: (id: string) => void;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className="group relative w-full cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-200 min-h-[200px]"
      onClick={() => onOpen(item.id)}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between mb-4">
          <div
            className="h-10 w-10 rounded-lg shadow-sm"
            style={{ backgroundColor: item.color || "#94a3b8" }}
          />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2 leading-tight">
            {item.title}
          </h3>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {formatDate(item.updatedAt)} • {item.sourcesCount} sources
          </div>
        </div>
      </div>
    </div>
  );
}
