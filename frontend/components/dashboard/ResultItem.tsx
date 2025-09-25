import { MessageCircle, MessageSquare } from "lucide-react";

export type Channel = "whatsapp" | "sms";

export interface ResultItemData {
  id: string;
  channel: Channel;
  snippet: string;
  timestampISO: string;
}

interface ResultItemProps {
  item: ResultItemData;
  onDetails: (item: ResultItemData) => void;
  onAdd: (item: ResultItemData) => void;
}

function formatDisplayTime(iso: string): string {
  const dt = new Date(iso);
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  };
  return dt.toLocaleString(undefined, options);
}

export default function ResultItem({
  item,
  onDetails,
  onAdd,
}: ResultItemProps) {
  const Icon = item.channel === "whatsapp" ? MessageCircle : MessageSquare;
  const title = item.channel === "whatsapp" ? "WhatsApp" : "SMS";

  return (
    <div className="flex items-start justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 p-2">
          <Icon
            className="h-4 w-4 text-slate-600 dark:text-slate-300"
            aria-hidden="true"
          />
        </div>
        <div>
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {title}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
            “{item.snippet}”
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {formatDisplayTime(item.timestampISO)}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => onDetails(item)}
          className="rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
          aria-label="Details"
        >
          Details
        </button>
        <button
          onClick={() => onAdd(item)}
          className="rounded-lg bg-black px-3 py-1.5 text-xs text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          aria-label="Add"
        >
          Add
        </button>
      </div>
    </div>
  );
}
