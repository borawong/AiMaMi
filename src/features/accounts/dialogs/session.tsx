import { useState } from "react";
import { Copy, ExternalLink, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/busy";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { useAccountsModule } from "../hooks";

type AccountsModuleController = ReturnType<typeof useAccountsModule>;

export function AddSessionAccountDialog({
  module,
}: {
  module: AccountsModuleController;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [sessionJson, setSessionJson] = useState("");
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const importing = module.importChatGptSessionAccount.isPending;

  const importSession = async () => {
    const payload = sessionJson.trim();
    if (!payload) return;
    await module.importChatGptSessionAccount.run({
      sessionJson: payload,
      overwriteExisting,
    });
    setSessionJson("");
    setOverwriteExisting(false);
    setOpen(false);
    await module.refreshUsageSnapshotAction.run();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        {t("accounts.addAccount")}
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("accounts.addAccountSessionTitle")}</DialogTitle>
          <DialogDescription>{t("accounts.addAccountSessionDesc")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <SessionImportStep
              step="1"
              title={t("accounts.addAccountSessionStep1Title")}
              description={t("accounts.addAccountSessionStep1Desc")}
              actionLabel={t("accounts.addAccountSessionOpenChatGpt")}
              onAction={() => void module.openPath.run({ path: "https://chatgpt.com/" })}
              disabled={importing}
            />
            <SessionImportStep
              step="2"
              title={t("accounts.addAccountSessionStep2Title")}
              description={t("accounts.addAccountSessionStep2Desc")}
              actionLabel={t("accounts.addAccountSessionOpenSession")}
              onAction={() =>
                void module.openPath.run({
                  path: "https://chatgpt.com/api/auth/session",
                })
              }
              disabled={importing}
            />
            <SessionImportStep
              step="3"
              title={t("accounts.addAccountSessionStep3Title")}
              description={t("accounts.addAccountSessionStep3Desc")}
              disabled={importing}
            />
          </div>
          <p className="rounded-[8px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-100">
            {t("accounts.addAccountSessionRisk")}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="accounts-session-json" className="text-sm font-medium">
                {t("accounts.addAccountSessionInputLabel")}
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={importing}
                onClick={() =>
                  void navigator.clipboard
                    ?.readText()
                    .then((value) => setSessionJson(value))
                }
              >
                <Copy className="h-3.5 w-3.5" />
                {t("accounts.addAccountSessionPaste")}
              </Button>
            </div>
            <Textarea
              id="accounts-session-json"
              value={sessionJson}
              onChange={(event) => setSessionJson(event.target.value)}
              placeholder={t("accounts.addAccountSessionPlaceholder")}
              className="min-h-[162px] resize-y rounded-xl font-mono text-xs"
              disabled={importing}
            />
          </div>
          <label className="flex items-center gap-2 rounded-[8px] border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <Checkbox
              checked={overwriteExisting}
              disabled={importing}
              onCheckedChange={(checked) => setOverwriteExisting(checked === true)}
            />
            {t("accounts.addAccountSessionOverwrite")}
          </label>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={importing}
            onClick={() => setOpen(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!sessionJson.trim() || importing}
            onClick={() => void importSession()}
          >
            <ButtonBusyContent
              busy={importing}
              idleLabel={t("accounts.addAccountSessionImport")}
              busyLabel={t("accounts.addAccountSessionImporting")}
            />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SessionImportStep({
  step,
  title,
  description,
  actionLabel,
  onAction,
  disabled,
}: {
  step: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex min-h-[150px] flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {step}
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          disabled={disabled}
          onClick={onAction}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
