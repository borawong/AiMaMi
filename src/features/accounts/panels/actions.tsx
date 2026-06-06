/**
 * 中文职责说明：账号动作面板只收集 1.0.9 证据支持的 IPC 参数，并把用户意图交给模块 mutation owner。
 */
import { useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  FileSearch,
  Import,
  LogOut,
  MonitorUp,
  RotateCcw,
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
import type { useAccountsModule } from "../hooks";

type AccountsModuleController = ReturnType<typeof useAccountsModule>;

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
            {t("accounts.accountKeyInput")}
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
              aria-label={t("accounts.previewImport")}
              onClick={() =>
                void module.previewAccountImport.run({
                  filePath: importFilePath.trim(),
                })
              }
            >
              <ButtonBusyContent
                busy={module.previewAccountImport.isPending}
                idleIcon={<FileSearch className="h-3.5 w-3.5" />}
                idleLabel={t("accounts.previewImport")}
                busyLabel={t("common.refreshing")}
              />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canUseImportFile || module.importAccountsFromFile.isPending}
              aria-label={t("accounts.importFromFile")}
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
                idleLabel={t("accounts.importFromFile")}
                busyLabel={t("common.refreshing")}
              />
            </Button>
          </div>
        </div>

        <div className="space-y-3 xl:col-span-2">
          <Label htmlFor="accounts-session-json">
            {t("accounts.sessionJsonInput")}
          </Label>
          <Textarea
            id="accounts-session-json"
            value={sessionJson}
            placeholder={t("accounts.sessionJsonPlaceholder")}
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
            aria-label={t("accounts.importSession")}
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
              idleLabel={t("accounts.importSession")}
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
              aria-label={t("accounts.exportAccounts")}
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
                idleLabel={t("accounts.exportAccounts")}
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
