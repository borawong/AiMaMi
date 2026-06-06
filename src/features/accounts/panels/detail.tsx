import { Copy, KeyRound, ShieldAlert, Trash2, UserCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/busy";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AccountsPageController } from "../hooks";
import type { AccountQuotaWindowSlot, AccountRecord } from "../types";
import {
  accountEmail,
  accountKey,
  accountPlan,
  isActiveAccount,
  quotaPercent,
  readNumber,
  readPath,
  readString,
} from "../utils";
import {
  formatAuthMode,
  formatAutoRenew,
  formatEpoch,
  formatPercent,
  formatPlan,
  formatSubscription,
  quotaBarClass,
  quotaDotClass,
  quotaTextClass,
} from "./display";
import { AccountTokenStatusPanel } from "./token";

export interface AccountDetailActions {
  requestSwitch: (account: AccountRecord) => void;
  requestRemove: (account: AccountRecord) => void;
}

export function AccountDetailPanel({
  controller,
  actions,
}: {
  controller: AccountsPageController;
  actions: AccountDetailActions;
}) {
  const account = controller.selectedAccount;

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {account ? (
        <AccountDetailContent
          account={account}
          activeAccount={controller.activeAccount}
          apiReachability={controller.apiReachability}
          switching={controller.module.switchAccountAndRestart.isPending}
          removing={controller.module.removeAccounts.isPending}
          onSwitch={() => actions.requestSwitch(account)}
          onRemove={() => actions.requestRemove(account)}
        />
      ) : (
        <NoAccountSelection />
      )}
    </div>
  );
}

function AccountDetailContent({
  account,
  activeAccount,
  apiReachability,
  switching,
  removing,
  onSwitch,
  onRemove,
}: {
  account: AccountRecord;
  activeAccount: AccountRecord | null;
  apiReachability: string;
  switching: boolean;
  removing: boolean;
  onSwitch: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const quotaBlocked =
    apiReachability === "unreachable" &&
    accountKey(account) === accountKey(activeAccount);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {t("accounts.selectedAccount")}
          </p>
          <h2 className="mt-1 truncate text-lg font-semibold">
            {accountEmail(account) || t("accounts.unknown")}
          </h2>
          <button
            type="button"
            className="mt-0.5 flex max-w-full min-w-0 items-center gap-1 text-left text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            title={accountKey(account)}
            onClick={() => void navigator.clipboard?.writeText(accountKey(account))}
          >
            <span className="shrink-0">{t("accounts.snapshotKey")}:</span>
            <span className="min-w-0 flex-1 truncate">{accountKey(account)}</span>
            <Copy className="h-3 w-3 shrink-0" />
          </button>
        </div>
        <Badge
          variant={isActiveAccount(account) ? "default" : "secondary"}
          className="shrink-0"
        >
          {formatPlan(accountPlan(account), t)}
        </Badge>
      </div>

      <div className="relative mt-5">
        <div className="grid min-w-0 grid-cols-2 gap-3">
          <QuotaWindowCard
            label={t("accounts.5hour")}
            account={account}
            slot="primaryWindow"
          />
          <QuotaWindowCard
            label={t("accounts.weekly")}
            account={account}
            slot="secondaryWindow"
          />
        </div>
        {quotaBlocked ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-[10px] border border-destructive/20 bg-background/85 backdrop-blur-[2px]">
            <div className="max-w-[260px] text-center text-xs leading-relaxed text-muted-foreground">
              <ShieldAlert className="mx-auto mb-2 h-4 w-4 text-destructive" />
              {t("overview.apiUnreachableHintPrefix")}{" "}
              <span className="font-medium text-foreground">
                {t("overview.configureProxy")}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <AccountTokenStatusPanel account={account} />

      <div className="mt-5 rounded-xl border border-border">
        <DetailRow
          label={t("accounts.workspaceName")}
          value={readString(account, ["workspaceName"], t("accounts.notAvailable"))}
        />
        <Separator />
        <DetailRow
          label={t("accounts.profileName")}
          value={readString(account, ["profileName"], t("accounts.notAvailable"))}
        />
        <Separator />
        <DetailRow
          label={t("accounts.authMode")}
          value={
            formatAuthMode(readString(account, ["authMode"], ""), t) ||
            t("accounts.notAvailable")
          }
        />
        <Separator />
        <DetailRow
          label={t("accounts.subscriptionStatus")}
          value={formatSubscription(readPath(account, "hasActiveSubscription"), t)}
        />
        <Separator />
        <DetailRow
          label={t("accounts.expiresAt")}
          value={
            formatEpoch(readNumber(account, ["subscriptionExpiresAt"])) ||
            t("accounts.notAvailable")
          }
        />
        <Separator />
        <DetailRow
          label={t("accounts.autoRenew")}
          value={formatAutoRenew(readPath(account, "subscriptionWillRenew"), t)}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isActiveAccount(account) || switching}
          onClick={onSwitch}
        >
          <ButtonBusyContent
            busy={switching}
            idleIcon={<UserCheck className="h-3.5 w-3.5" />}
            idleLabel={t("accounts.switchTo")}
            busyLabel={t("common.refreshing")}
          />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void navigator.clipboard?.writeText(accountEmail(account))}
        >
          <Copy className="h-3.5 w-3.5" />
          {t("accounts.copyEmail")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:border-destructive hover:bg-destructive hover:text-white"
          disabled={isActiveAccount(account) || removing}
          title={isActiveAccount(account) ? t("accounts.removeActiveDisabled") : undefined}
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t("accounts.removeSnapshot")}
        </Button>
      </div>
    </div>
  );
}

function QuotaWindowCard({
  label,
  account,
  slot,
}: {
  label: string;
  account: AccountRecord;
  slot: AccountQuotaWindowSlot;
}) {
  const value = quotaPercent(account, slot);
  const windowValue = readPath(account, slot);
  const reset = formatEpoch(readNumber(windowValue, ["resetsAt"]));
  return (
    <div className="min-w-0 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className={cn("text-sm font-bold tabular-nums", quotaTextClass(value, false))}>
          {formatPercent(value)}
        </span>
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all", quotaBarClass(value))}
          style={{
            width: value == null ? "0%" : `${Math.max(0, Math.min(value, 100))}%`,
          }}
        />
      </div>
      {reset ? (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", quotaDotClass(value))} />
          {reset}
        </p>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 break-words text-right text-xs">{value}</span>
    </div>
  );
}

function NoAccountSelection() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <KeyRound className="h-10 w-10 text-muted-foreground/25" />
      <p className="mt-2 text-sm text-muted-foreground">
        {t("accounts.noSelection")}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground/60">
        {t("accounts.selectHint")}
      </p>
    </div>
  );
}
