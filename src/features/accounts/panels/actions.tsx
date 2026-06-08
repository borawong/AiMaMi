import { useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  FileSearch,
  FolderOpen,
  Import,
  LogOut,
  MonitorUp,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  UserCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/busy";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/toast";
import type {
  AccountExportDialogResult,
  AccountPreviewImportDialogResult,
  AccountsModuleController,
} from "../types";
import {
  envelopeData,
  readArray,
  readNumber,
  readString,
} from "../utils";

function splitAccountKeys(value: string): string[] {
  return value
    .split(/[\s,，]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AccountActionsPanel({
  module,
}: {
  module: AccountsModuleController;
}) {
  const { t } = useTranslation();
  const [accountKey, setAccountKey] = useState("");
  const [accountKeysText, setAccountKeysText] = useState("");
  const [importFilePath, setImportFilePath] = useState("");
  const [exportTargetPath, setExportTargetPath] = useState("");
  const [sessionJson, setSessionJson] = useState("");
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  const selectedAccountKeys = useMemo(
    () => splitAccountKeys(accountKeysText),
    [accountKeysText],
  );
  const canUseSingleAccount = accountKey.trim().length > 0;
  const canUseAccountKeys = selectedAccountKeys.length > 0;
  const canUseImportFile = importFilePath.trim().length > 0;
  const canUseExportTarget = exportTargetPath.trim().length > 0;
  const canUseSessionJson = sessionJson.trim().length > 0;

  const previewImportWithDialog = async () => {
    try {
      const result = await module.previewAccountImportWithDialog.run({
        title: t("accounts.io.openDialogTitle"),
        filterName: t("accounts.io.filterName"),
      });
      setImportFilePath(result.filePath);
      showPreviewToast(t, result);
    } catch (error) {
      if (!isCancelled(error)) {
        toast({
          title: t("accounts.io.previewFailed"),
          description: toErrorMessage(error),
          variant: "destructive",
        });
      }
    }
  };

  const exportAccountsWithDialog = async () => {
    try {
      const result = await module.exportAccountsToFileWithDialog.run({
        title: t("accounts.io.saveDialogTitle"),
        defaultPath: exportTargetPath.trim() || makeAccountsBackupPath(),
        filterName: t("accounts.io.filterName"),
        accountKeys: canUseAccountKeys ? selectedAccountKeys : null,
      });
      setExportTargetPath(result.filePath);
      showExportToast(t, result, selectedAccountKeys.length);
    } catch (error) {
      if (!isCancelled(error)) {
        toast({
          title: t("accounts.io.exportFailed"),
          description: toErrorMessage(error),
          variant: "destructive",
        });
      }
    }
  };

  return (
    <BentoCard className="min-w-0">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-foreground">
          {t("accounts.actions")}
        </h3>
        <p className="text-xs leading-5 text-muted-foreground">
          {t("accounts.actionsDesc")}
        </p>
      </div>

      <div className="mt-4 grid gap-5 xl:grid-cols-3">
        <div className="space-y-3">
          <Label htmlFor="accounts-account-key">
            {t("accounts.snapshotKey")}
          </Label>
          <Input
            id="accounts-account-key"
            value={accountKey}
            placeholder={t("accounts.accountKeyPlaceholder")}
            onChange={(event) => setAccountKey(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canUseSingleAccount || module.switchAccount.isPending}
              aria-label={t("accounts.switchAccount")}
              onClick={() =>
                void module.switchAccount.run({
                  accountKey: accountKey.trim(),
                })
              }
            >
              <ButtonBusyContent
                busy={module.switchAccount.isPending}
                idleIcon={<UserCheck className="h-3.5 w-3.5" />}
                idleLabel={t("accounts.switchAccount")}
                busyLabel={t("common.refreshing")}
              />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={
                !canUseSingleAccount ||
                module.switchAccountAndRestart.isPending
              }
              aria-label={t("accounts.switchAndRestart")}
              onClick={() =>
                void module.switchAccountAndRestart.run({
                  accountKey: accountKey.trim(),
                })
              }
            >
              <ButtonBusyContent
                busy={module.switchAccountAndRestart.isPending}
                idleIcon={<RotateCcw className="h-3.5 w-3.5" />}
                idleLabel={t("accounts.switchAndRestart")}
                busyLabel={t("common.refreshing")}
              />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="accounts-key-list">
            {t("accounts.accountKeysInput")}
          </Label>
          <Textarea
            id="accounts-key-list"
            value={accountKeysText}
            placeholder={t("accounts.accountKeysPlaceholder")}
            className="min-h-20"
            onChange={(event) => setAccountKeysText(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canUseAccountKeys || module.removeAccounts.isPending}
              aria-label={t("accounts.removeSelected")}
              onClick={() =>
                void module.removeAccounts.run({
                  accountKeys: selectedAccountKeys,
                })
              }
            >
              <ButtonBusyContent
                busy={module.removeAccounts.isPending}
                idleIcon={<Trash2 className="h-3.5 w-3.5" />}
                idleLabel={t("accounts.removeSelected")}
                busyLabel={t("common.refreshing")}
              />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={module.logout.isPending}
              aria-label={t("accounts.logout")}
              onClick={() => void module.logout.run()}
            >
              <ButtonBusyContent
                busy={module.logout.isPending}
                idleIcon={<LogOut className="h-3.5 w-3.5" />}
                idleLabel={t("accounts.logout")}
                busyLabel={t("common.refreshing")}
              />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="accounts-import-path">
            {t("accounts.importFilePath")}
          </Label>
          <Input
            id="accounts-import-path"
            value={importFilePath}
            placeholder={t("accounts.importFilePlaceholder")}
            onChange={(event) => setImportFilePath(event.target.value)}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="accounts-overwrite-existing"
              checked={overwriteExisting}
              onCheckedChange={(checked) =>
                setOverwriteExisting(checked === true)
              }
            />
            <Label
              htmlFor="accounts-overwrite-existing"
              className="text-xs text-muted-foreground"
            >
              {t("accounts.overwriteExisting")}
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={module.previewAccountImportWithDialog.isPending}
              aria-label={t("accounts.io.openDialogTitle")}
              onClick={() => void previewImportWithDialog()}
            >
              <ButtonBusyContent
                busy={module.previewAccountImportWithDialog.isPending}
                idleIcon={<FolderOpen className="h-3.5 w-3.5" />}
                idleLabel={t("accounts.io.openDialogTitle")}
                busyLabel={t("common.refreshing")}
              />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canUseImportFile || module.openPath.isPending}
              aria-label={t("accounts.openImportPath")}
              onClick={() =>
                void module.openPath.run({
                  path: importFilePath.trim(),
                })
              }
            >
              <ButtonBusyContent
                busy={module.openPath.isPending}
                idleIcon={<ExternalLink className="h-3.5 w-3.5" />}
                idleLabel={t("accounts.openImportPath")}
                busyLabel={t("common.refreshing")}
              />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={
                !canUseImportFile || module.previewAccountImport.isPending
              }
              aria-label={t("accounts.io.previewTitle")}
              onClick={() =>
                void module.previewAccountImport.run({
                  filePath: importFilePath.trim(),
                })
              }
            >
              <ButtonBusyContent
                busy={module.previewAccountImport.isPending}
                idleIcon={<FileSearch className="h-3.5 w-3.5" />}
                idleLabel={t("accounts.io.previewTitle")}
                busyLabel={t("common.refreshing")}
              />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canUseImportFile || module.importAccountsFromFile.isPending}
              aria-label={t("accounts.io.importAccount")}
              onClick={() =>
                void module.importAccountsFromFile.run({
                  filePath: importFilePath.trim(),
                  overwriteExisting,
                  selectedKeys: canUseAccountKeys ? selectedAccountKeys : null,
                })
              }
            >
              <ButtonBusyContent
                busy={module.importAccountsFromFile.isPending}
                idleIcon={<Import className="h-3.5 w-3.5" />}
                idleLabel={t("accounts.io.importAccount")}
                busyLabel={t("common.refreshing")}
              />
            </Button>
          </div>
        </div>

        <div className="space-y-3 xl:col-span-2">
          <Label htmlFor="accounts-session-json">
            {t("accounts.addAccountSessionInputLabel")}
          </Label>
          <Textarea
            id="accounts-session-json"
            value={sessionJson}
            placeholder={t("accounts.addAccountSessionPlaceholder")}
            className="min-h-24"
            onChange={(event) => setSessionJson(event.target.value)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              !canUseSessionJson ||
              module.importChatGptSessionAccount.isPending
            }
            aria-label={t("accounts.addAccountSessionImport")}
            onClick={() =>
              void module.importChatGptSessionAccount.run({
                sessionJson,
                overwriteExisting,
              })
            }
          >
            <ButtonBusyContent
              busy={module.importChatGptSessionAccount.isPending}
              idleIcon={<Upload className="h-3.5 w-3.5" />}
              idleLabel={t("accounts.addAccountSessionImport")}
              busyLabel={t("common.refreshing")}
            />
          </Button>
        </div>

        <div className="space-y-3">
          <Label htmlFor="accounts-export-target">
            {t("accounts.exportTargetPath")}
          </Label>
          <Input
            id="accounts-export-target"
            value={exportTargetPath}
            placeholder={t("accounts.exportTargetPlaceholder")}
            onChange={(event) => setExportTargetPath(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={module.exportAccountsToFileWithDialog.isPending}
              aria-label={t("accounts.io.saveDialogTitle")}
              onClick={() => void exportAccountsWithDialog()}
            >
              <ButtonBusyContent
                busy={module.exportAccountsToFileWithDialog.isPending}
                idleIcon={<Save className="h-3.5 w-3.5" />}
                idleLabel={t("accounts.io.saveDialogTitle")}
                busyLabel={t("common.refreshing")}
              />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canUseExportTarget || module.openPath.isPending}
              aria-label={t("accounts.openExportPath")}
              onClick={() =>
                void module.openPath.run({
                  path: exportTargetPath.trim(),
                })
              }
            >
              <ButtonBusyContent
                busy={module.openPath.isPending}
                idleIcon={<ExternalLink className="h-3.5 w-3.5" />}
                idleLabel={t("accounts.openExportPath")}
                busyLabel={t("common.refreshing")}
              />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={
                !canUseExportTarget || module.exportAccountsToFile.isPending
              }
              aria-label={t("accounts.io.exportAccount")}
              onClick={() =>
                void module.exportAccountsToFile.run({
                  targetPath: exportTargetPath.trim(),
                  accountKeys: canUseAccountKeys ? selectedAccountKeys : null,
                })
              }
            >
              <ButtonBusyContent
                busy={module.exportAccountsToFile.isPending}
                idleIcon={<Download className="h-3.5 w-3.5" />}
                idleLabel={t("accounts.io.exportAccount")}
                busyLabel={t("common.refreshing")}
              />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={module.attachMonitorAction.isPending}
              aria-label={t("accounts.beginAttachMonitor")}
              onClick={() => void module.attachMonitorAction.run()}
            >
              <ButtonBusyContent
                busy={module.attachMonitorAction.isPending}
                idleIcon={<MonitorUp className="h-3.5 w-3.5" />}
                idleLabel={t("accounts.beginAttachMonitor")}
                busyLabel={t("common.refreshing")}
              />
            </Button>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

type AccountsTranslator = (key: string, options?: Record<string, unknown>) => string;

function showPreviewToast(
  t: AccountsTranslator,
  result: AccountPreviewImportDialogResult,
) {
  const data = envelopeData(result.envelope);
  const accountRows = readArray(data, ["accounts", "items", "candidates", "entries"]);
  const count = readNumber(
    data,
    ["accountCount", "importableCount", "previewCount", "count"],
    accountRows.length,
  );
  toast({
    title: t("accounts.io.previewTitle"),
    description:
      count > 0
        ? t("accounts.io.previewCount", {
            count,
          })
        : t("accounts.io.previewDesc"),
    variant: "success",
  });
}

function showExportToast(
  t: AccountsTranslator,
  result: AccountExportDialogResult,
  selectedCount: number,
) {
  const data = envelopeData(result.envelope);
  const count = readNumber(
    data,
    ["exportedCount", "accountCount", "count"],
    selectedCount,
  );
  const filePath =
    readString(data, ["filePath", "targetPath", "path"], result.filePath) ||
    result.filePath;
  toast({
    title: t("accounts.io.exportSuccess"),
    description: t("accounts.io.exportSuccessDesc", {
      count,
      path: filePath,
    }),
    variant: "success",
  });
}

function isCancelled(error: unknown) {
  return error instanceof Error && error.message === "CANCELLED";
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

function makeAccountsBackupPath() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `accounts-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}-${pad(now.getHours())}${pad(now.getMinutes())}.json`;
}
