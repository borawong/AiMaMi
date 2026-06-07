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
import { Input } from "@/components/ui/input";
import type { OverviewDialogController } from "../types";

export function OverviewDialogsHost({
  dialogs,
}: {
  dialogs: OverviewDialogController;
}) {
  return (
    <ImportRemoteSecretDialog
      dialog={dialogs.importRemoteSecret}
    />
  );
}

function ImportRemoteSecretDialog({
  dialog,
}: {
  dialog: OverviewDialogController["importRemoteSecret"];
}) {
  const { t } = useTranslation();
  const canSubmit = dialog.draft.trim().length > 0 && !dialog.isPending;

  return (
    <Dialog open={dialog.isOpen} onOpenChange={dialog.onOpenChange}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) dialog.onSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("overview.importRemoteSecretTitle")}</DialogTitle>
            <DialogDescription>
              {t("overview.importRemoteSecretDescription")}
            </DialogDescription>
          </DialogHeader>
          <Input
            autoComplete="off"
            disabled={dialog.isPending}
            onChange={(event) => dialog.onDraftChange(event.target.value)}
            placeholder={t("overview.importRemoteSecretPlaceholder")}
            value={dialog.draft}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={dialog.isPending}
              onClick={() => dialog.onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {dialog.isPending ? t("common.loading") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
