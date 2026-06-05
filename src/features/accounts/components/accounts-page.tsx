/**
 * 中文职责说明：accounts 页面只渲染账号模块视图，不直接拼 IPC 或持有后端事实。
 */
import { KeyRound, ShieldCheck, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  envelopeData,
  readArray,
  readBoolean,
  readNumber,
  readString,
} from "@/features/_shared/evidence-data";
import {
  BoolBadge,
  EvidencePageHeader,
  MetricCard,
  QueryPanel,
  RecordList,
} from "@/features/_shared/evidence-panels";
import { previewText } from "@/features/_shared/evidence-data";
import { useAccountsModule } from "../hooks";
import { AccountActionsPanel } from "../panels";

export function AccountsPage() {
  const { t } = useTranslation();
  const module = useAccountsModule();
  const snapshot = envelopeData(module.snapshotQuery.data);
  const accounts = readArray(snapshot, [
    "accounts",
    "items",
    "registry.accounts",
    "accountList",
  ]);
  const accountCount =
    accounts.length ||
    readNumber(snapshot, [
      "registryState.accountCount",
      "status.registryState.accountCount",
      "accountCount",
    ]);
  const activeAccount = readString(snapshot, [
    "activeAccountKey",
    "status.activeAccountKey",
    "registry.activeAccountKey",
  ], t("accounts.unknown"));
  const authExists = readBoolean(snapshot, [
    "status.paths.authExists",
    "paths.authExists",
  ]);
  const registryExists = readBoolean(snapshot, [
    "status.paths.registryExists",
    "paths.registryExists",
  ]);

  return (
    <div className="space-y-5">
      <EvidencePageHeader
        titleKey="nav.accounts"
        descriptionKey="accounts.description"
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          labelKey="accounts.accountCount"
          value={
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {accountCount}
            </span>
          }
        />
        <MetricCard
          labelKey="accounts.activeAccount"
          value={
            <span className="inline-flex min-w-0 items-center gap-2">
              <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{activeAccount}</span>
            </span>
          }
        />
        <MetricCard
          labelKey="accounts.fileHealth"
          value={
            <span className="inline-flex flex-wrap gap-2">
              <BoolBadge
                value={authExists}
                trueKey="accounts.authExists"
                falseKey="accounts.authMissing"
              />
              <BoolBadge
                value={registryExists}
                trueKey="accounts.registryExists"
                falseKey="accounts.registryMissing"
              />
            </span>
          }
        />
      </div>

      <AccountActionsPanel module={module} />

      <QueryPanel titleKey="accounts.snapshot" state={module.snapshotQuery}>
        <RecordList
          items={accounts}
          emptyKey="accounts.empty"
          renderItem={(account) => (
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {readString(account, ["label", "name", "email", "accountKey"], t("accounts.unknown"))}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {previewText(readString(account, ["accountKey", "id", "key"], ""))}
                </p>
              </div>
              <ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          )}
        />
      </QueryPanel>
    </div>
  );
}
