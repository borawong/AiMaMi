/**
 * 中文职责说明：历史面板只渲染历史记录和 rollback 意图。
 */
import { History } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BentoCard } from "@/components/ui/bento";
import type { CustomInstructionHistoryEntry } from "@/types";
import { HistoryList } from "../components/history";

interface CustomInstructionsHistoryPanelProps {
  history: CustomInstructionHistoryEntry[];
  rollbackingId: string | null;
  onRollback: (historyId: string) => void;
}

export function CustomInstructionsHistoryPanel({
  history,
  rollbackingId,
  onRollback,
}: CustomInstructionsHistoryPanelProps) {
  const { t } = useTranslation();

  return (
    <BentoCard>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <History className="h-4 w-4 text-primary" />
            {t("customInstructions.historyTitle")}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("customInstructions.historyDescription")}
          </p>
        </div>
      </div>
      <HistoryList
        items={history}
        rollbackingId={rollbackingId}
        onRollback={onRollback}
      />
    </BentoCard>
  );
}
