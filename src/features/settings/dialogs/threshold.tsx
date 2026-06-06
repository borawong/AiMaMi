import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { SettingsPageController } from "../hooks";

export function SettingsThresholdDialog({
  controller,
}: {
  controller: SettingsPageController;
}) {
  const { t } = useTranslation();
  const dialog = controller.thresholdDialog;

  return (
    <Dialog open={dialog.open} onOpenChange={dialog.setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("settings.thresholdDialogTitle")}</DialogTitle>
          <DialogDescription>{t("settings.thresholdDialogDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t("settings.threshold5h")}</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={dialog.draft5h}
                onChange={(event) => dialog.setDraft5h(Number(event.target.value))}
                className="h-8 w-20 rounded-[8px] text-right text-xs"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t("settings.thresholdWeekly")}</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={dialog.draftWeekly}
                onChange={(event) => dialog.setDraftWeekly(Number(event.target.value))}
                className="h-8 w-20 rounded-[8px] text-right text-xs"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => dialog.setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={controller.actions.saveThresholds} disabled={dialog.saving}>
            {dialog.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
