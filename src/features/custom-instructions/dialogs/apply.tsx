import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { CustomInstructionsPageController } from "../hooks";

type CustomInstructionsPreviewApplyDialogProps =
  CustomInstructionsPageController["previewDialog"];

export function CustomInstructionsPreviewApplyDialog({
  open,
  preview,
  applying,
  onOpenChange,
  onApply,
}: CustomInstructionsPreviewApplyDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("customInstructions.previewTitle")}</DialogTitle>
          <DialogDescription>
            {t("customInstructions.previewDescription")}
          </DialogDescription>
        </DialogHeader>

        {preview ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {t("customInstructions.currentManagedBlock")}
              </div>
              <Textarea
                value={
                  preview.currentManagedContent ||
                  t("customInstructions.noManagedContent")
                }
                readOnly
                className="min-h-[260px] font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {t("customInstructions.nextManagedBlock")}
              </div>
              <Textarea
                value={
                  preview.nextManagedContent ||
                  t("customInstructions.clearedManagedContent")
                }
                readOnly
                className="min-h-[260px] font-mono text-xs"
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={onApply} disabled={!preview || applying}>
            {applying
              ? t("customInstructions.applying")
              : t("customInstructions.confirmApply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
