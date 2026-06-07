import { AlertTriangle, RotateCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BentoCard } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/busy";
import type { CustomInstructionsLoadErrorPanelController } from "../types";

export function CustomInstructionsLoadErrorPanel({
  visible,
  refreshing,
  onRefresh,
}: CustomInstructionsLoadErrorPanelController) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <BentoCard role="alert" className="border-destructive/30 bg-destructive/5">
      <div className="flex items-start gap-3 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="min-w-0">
          <div className="font-medium text-destructive">
            {t("customInstructions.loadFailed")}
          </div>
          <p className="mt-1 text-muted-foreground">
            {t("customInstructions.loadFailedDesc")}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => void onRefresh()}
            disabled={refreshing}
          >
            <ButtonBusyContent
              busy={refreshing}
              idleIcon={<RotateCw className="h-3.5 w-3.5" />}
              idleLabel={t("common.retry")}
              busyLabel={t("common.refreshing")}
              spinnerClassName="h-3.5 w-3.5"
            />
          </Button>
        </div>
      </div>
    </BentoCard>
  );
}
