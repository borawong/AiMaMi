import { previewText, recordEntries } from "../utils";

export function DaemonPayloadSummary({ value }: { value: unknown }) {
  const entries = recordEntries(value).slice(0, 4);

  if (entries.length === 0) {
    return <p className="min-w-0 truncate text-sm">{previewText(value)}</p>;
  }

  return (
    <div className="min-w-0 flex-1 space-y-2">
      {entries.map(([key, item]) => (
        <div key={key} className="grid gap-2 text-xs sm:grid-cols-[9rem_minmax(0,1fr)]">
          <span className="text-muted-foreground">{key}</span>
          <span className="min-w-0 truncate text-foreground">{previewText(item)}</span>
        </div>
      ))}
    </div>
  );
}
