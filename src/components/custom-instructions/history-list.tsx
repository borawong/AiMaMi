import { Button } from "@/components/ui/button";
import { BentoInnerPanel } from "@/components/ui/bento-inner-panel";
import type { CustomInstructionHistoryEntry } from "@/types";
import { formatDateTime, formatRelative } from "@/lib/format-time";
import { useTranslation } from "react-i18next";

interface HistoryListProps {
  items: CustomInstructionHistoryEntry[];
  rollbackingId?: string | null;
  onRollback: (historyId: string) => void;
}

export function HistoryList({ items, rollbackingId, onRollback }: HistoryListProps) {
  const { t } = useTranslation();
  const actionLabel = (action: CustomInstructionHistoryEntry["action"]) => {
    switch (action) {
      case "apply":
        return t("customInstructions.historyActionApply");
      case "clear":
        return t("customInstructions.historyActionClear");
      case "rollback":
        return t("customInstructions.historyActionRollback");
      default:
        return action;
    }
  };

  if (items.length === 0) {
    return (
      <BentoInnerPanel>
        <p className="text-sm text-muted-foreground">{t("customInstructions.noHistory")}</p>
      </BentoInnerPanel>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <BentoInnerPanel key={item.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{actionLabel(item.action)}</span>
                <span className="text-xs text-muted-foreground">
                  {item.templateTitle ?? t("customInstructions.manualContent")}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                <span title={formatDateTime(item.createdAt)}>{formatRelative(item.createdAt)}</span>
                <span className="mx-1.5">·</span>
                <span>{item.source}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRollback(item.id)}
              disabled={rollbackingId === item.id}
            >
              {rollbackingId === item.id
                ? t("customInstructions.rollingBack")
                : t("customInstructions.rollbackAction")}
            </Button>
          </div>
        </BentoInnerPanel>
      ))}
    </div>
  );
}
