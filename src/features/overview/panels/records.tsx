import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { OverviewPayloadSummaryValue } from "../types";
import { SafePayloadSummary } from "./payload";

export function OverviewRecordList<TItem extends OverviewPayloadSummaryValue>({
  items,
  emptyKey,
  renderItem,
}: {
  items: TItem[];
  emptyKey: string;
  renderItem?: (item: TItem, index: number) => ReactNode;
}) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <p className="rounded-[8px] border border-dashed border-border p-4 text-sm text-muted-foreground">
        {t(emptyKey)}
      </p>
    );
  }

  return (
    <div className="divide-y divide-border rounded-[8px] border border-border">
      {items.map((item, index) => (
        <div key={index} className="min-w-0 px-4 py-3">
          {renderItem ? renderItem(item, index) : <SafePayloadSummary value={item} />}
        </div>
      ))}
    </div>
  );
}
