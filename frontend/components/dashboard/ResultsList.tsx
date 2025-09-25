import ResultItem, { ResultItemData } from "./ResultItem";

interface ResultsListProps {
  items: ResultItemData[];
  onDetails: (item: ResultItemData) => void;
  onAdd: (item: ResultItemData) => void;
}

export default function ResultsList({
  items,
  onDetails,
  onAdd,
}: ResultsListProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => (
        <ResultItem key={it.id} item={it} onDetails={onDetails} onAdd={onAdd} />
      ))}
    </div>
  );
}
