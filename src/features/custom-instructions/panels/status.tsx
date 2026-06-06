import { AlertTriangle, FileCode2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento";
import { BentoInnerPanel } from "@/components/ui/inner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/time";
import type { CustomInstructionStatePayload } from "@/types";
import { getCustomInstructionProtectionTone } from "../utils";

interface CustomInstructionsCurrentStatusPanelProps {
  current: CustomInstructionStatePayload["current"] | null;
  protectedMode: boolean;
  clearPending: boolean;
  onOpenGlobalPath: () => void;
  onRestoreCurrent: () => void;
  onRequestClear: () => void;
}

export function CustomInstructionsCurrentStatusPanel({
  current,
  protectedMode,
  clearPending,
  onOpenGlobalPath,
  onRestoreCurrent,
  onRequestClear,
}: CustomInstructionsCurrentStatusPanelProps) {
  const { t } = useTranslation();

  return (
    <BentoCard>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileCode2 className="h-4 w-4 text-primary" />
            {t("customInstructions.currentTitle")}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("customInstructions.currentDescription")}
          </p>
        </div>
        <Badge
          variant={
            protectedMode
              ? "destructive"
              : current?.managedBlockPresent
                ? "default"
                : "outline"
          }
        >
          {protectedMode
            ? t("customInstructions.stateProtected")
            : current?.managedBlockPresent
              ? t("customInstructions.stateManaged")
              : t("customInstructions.stateUnmanaged")}
        </Badge>
      </div>

      {current ? (
        <div className="space-y-4">
          <BentoInnerPanel className={getCustomInstructionProtectionTone(current.protectionState)}>
            <div className="space-y-2 text-sm">
              <div className="font-medium">
                {t("customInstructions.globalScopeHint")}
              </div>
              <div className="text-xs text-muted-foreground dark:text-white/70">
                {current.globalPath}
              </div>
              {current.lastAppliedAt ? (
                <div className="flex flex-wrap gap-1 text-xs">
                  <span>{t("customInstructions.lastApplied")}</span>
                  <span>{formatDateTime(current.lastAppliedAt)}</span>
                </div>
              ) : null}
              {current.lastTemplateTitle ? (
                <div className="flex flex-wrap gap-1 text-xs">
                  <span>{t("customInstructions.lastTemplate")}</span>
                  <span>{current.lastTemplateTitle}</span>
                </div>
              ) : null}
              {current.issueMessage ? (
                <div className="flex items-start gap-2 text-xs">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{current.issueMessage}</span>
                </div>
              ) : null}
            </div>
          </BentoInnerPanel>

          <div className="space-y-2">
            <div className="text-sm font-medium">
              {t("customInstructions.currentManagedBlock")}
            </div>
            <Textarea
              value={current.managedContent || t("customInstructions.noManagedContent")}
              readOnly
              className="min-h-[160px] font-mono text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={onOpenGlobalPath}
              disabled={!current.fileExists}
            >
              {t("customInstructions.openGlobalFile")}
            </Button>
            <Button
              variant="outline"
              onClick={onRestoreCurrent}
              disabled={protectedMode}
            >
              {t("customInstructions.restoreCurrent")}
            </Button>
            <Button
              variant="outline"
              onClick={onRequestClear}
              disabled={protectedMode || !current.managedBlockPresent || clearPending}
            >
              {clearPending
                ? t("customInstructions.clearing")
                : t("customInstructions.clearManagedBlock")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center">
          <Spinner />
        </div>
      )}
    </BentoCard>
  );
}
