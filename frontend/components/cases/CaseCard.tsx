export interface CaseItem {
  id: string;
  title: string;
  description?: string;
  updatedAt: string;
  createdAt?: string;
  color?: string;
  files?: { name: string; size: number; type: string }[];
  status?: string;
  filesCount?: number;
  archivedAt?: string;
}

export default function CaseCard({
  item,
  onOpen,
  index,
}: {
  item: CaseItem;
  onOpen: (id: string) => void;
  index: number;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timePart = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return { datePart, timePart };
  };

  return (
    <div
      className="group relative w-full cursor-pointer rounded-xl border border-[#E0E0E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] p-6 h-[200px] overflow-hidden"
      onClick={() => onOpen(item.id)}
    >
      <div className="flex h-full items-center gap-6">
        <div className="text-7xl font-bold text-[#FF7F50] flex-shrink-0 leading-none">
          {(index + 1).toString().padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <h3 className="text-lg font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-2 leading-tight break-words">
            {item.title}
          </h3>
          {item.status === "archived" ? (
            <div className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0] font-light">
              Archived: {formatDate(item.updatedAt).datePart}{" "}
              {formatDate(item.updatedAt).timePart}
            </div>
          ) : (
            <>
              <div className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0] font-light">
                {formatDate(item.createdAt || item.updatedAt).datePart}
              </div>
              <div className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0] font-light">
                {formatDate(item.createdAt || item.updatedAt).timePart}
              </div>
            </>
          )}
          <div className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0] font-light">
            {item.filesCount || 0} sources
          </div>
        </div>
      </div>
    </div>
  );
}
