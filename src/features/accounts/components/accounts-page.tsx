import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/button-busy-content";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  envelopeData,
  readArray,
  readBoolean,
  readNumber,
  readPath,
  readString,
} from "../utils";
import { cn } from "@/lib/utils";
import { useAccountsModule } from "../hooks";

const PLAN_FILTERS = [
  "all",
  "free",
  "plus",
  "pro5x",
  "pro20x",
  "team",
  "business",
  "enterprise",
  "edu",
] as const;

type PlanFilter = (typeof PLAN_FILTERS)[number];
type AccountRecord = unknown;

export function AccountsPage() {
  const { t } = useTranslation();
  const module = useAccountsModule();
  const snapshotPayload =
    module.snapshotEnvelope?.payload ??
    (module.snapshotEnvelope ? null : module.snapshotQuery.data);
  const snapshot = envelopeData(snapshotPayload);
  const accounts = readArray(snapshot, [
    "accounts",
    "items",
    "registry.accounts",
    "accountList",
  ]);
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [switchTarget, setSwitchTarget] = useState<AccountRecord | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AccountRecord | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [sessionJson, setSessionJson] = useState("");
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return accounts
      .slice()
      .sort((left, right) => {
        const activeDelta = Number(isActiveAccount(right)) - Number(isActiveAccount(left));
        if (activeDelta !== 0) return activeDelta;
        return accountEmail(left).localeCompare(accountEmail(right));
      })
      .filter((account) => {
        const plan = accountPlan(account);
        const matchesPlan = planFilter === "all" || plan === planFilter;
        if (!matchesPlan) return false;
        if (!normalizedQuery) return true;
        return [
          accountEmail(account),
          accountKey(account),
          readString(account, ["alias"], ""),
          readString(account, ["accountName"], ""),
          readString(account, ["workspaceName"], ""),
          readString(account, ["profileName"], ""),
        ].some((item) => item.toLowerCase().includes(normalizedQuery));
      });
  }, [accounts, planFilter, query]);

  const effectiveSelectedKey =
    selectedKey && filteredAccounts.some((account) => accountKey(account) === selectedKey)
      ? selectedKey
      : accountKey(filteredAccounts[0]);
  const selectedAccount =
    filteredAccounts.find((account) => accountKey(account) === effectiveSelectedKey) ?? null;
  const activeAccount = accounts.find(isActiveAccount) ?? null;
  const apiReachability = readString(snapshot, [
    "status.apiConnectivity.usageStatus",
    "status.api.usageStatus",
    "apiConnectivity.usageStatus",
  ], "unknown");
  const loading = !snapshotPayload && (module.snapshotQuery.isLoading || module.snapshotQuery.isFetching);

  const refresh = async () => {
    await module.refreshUsageSnapshotAction.run();
  };

  const importSession = async () => {
    const payload = sessionJson.trim();
    if (!payload) return;
    await module.importChatGptSessionAccount.run({
      sessionJson: payload,
      overwriteExisting,
    });
    setSessionJson("");
    setOverwriteExisting(false);
    setAddOpen(false);
    await module.refreshUsageSnapshotAction.run();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AccountsPageHeader />

      <div className="flex shrink-0 flex-wrap items-center gap-2 py-4">
        <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          {t("accounts.addAccount")}
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={module.snapshotQuery.isFetching || module.refreshUsageSnapshotAction.isPending}
          aria-label={t("common.refresh")}
          onClick={() => void refresh()}
        >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5",
              (module.snapshotQuery.isFetching || module.refreshUsageSnapshotAction.isPending) &&
                "animate-spin",
            )}
          />
        </Button>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <ApiStatusBadge status={apiReachability} />
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 pb-4">
        <div className="relative min-w-[180px] max-w-[260px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("accounts.search")}
            className="h-8 rounded-[8px] pl-8 text-xs"
          />
        </div>
        <select
          value={planFilter}
          onChange={(event) => setPlanFilter(event.target.value as PlanFilter)}
          className="h-8 rounded-[8px] border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
          aria-label={t("accounts.planFilter")}
        >
          {PLAN_FILTERS.map((plan) => (
            <option key={plan} value={plan}>
              {plan === "all" ? t("accounts.allPlans") : formatPlan(plan, t)}
            </option>
          ))}
        </select>
        <Badge variant="outline" className="ml-auto shrink-0">
          {t("accounts.accountCount")}: {accounts.length}
        </Badge>
      </div>

      <div className="flex min-h-0 flex-1 gap-3 pb-4">
        {loading ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border">
            <KeyRound className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">{t("accounts.empty")}</p>
          </div>
        ) : (
          <>
            <div className="flex w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
              <div className="px-4 pb-2 pt-3 text-[11px] text-muted-foreground">
                {t("accounts.listTitle")}
              </div>
              <Separator />
              <div className="min-h-0 flex-1 overflow-y-auto py-1">
                {filteredAccounts.map((account) => {
                  const key = accountKey(account);
                  const selected = key === effectiveSelectedKey;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedKey(key)}
                      className={cn(
                        "mx-2 my-0.5 flex w-[calc(100%-16px)] items-start gap-3 rounded-[9px] px-3 py-2.5 text-left transition-colors",
                        selected ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          isActiveAccount(account)
                            ? selected
                              ? "bg-white"
                              : "bg-emerald-500"
                            : selected
                              ? "bg-primary-foreground/40"
                              : "bg-muted-foreground/30",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-medium">
                            {accountEmail(account) || t("accounts.unknown")}
                          </span>
                          {isActiveAccount(account) ? (
                            <Badge
                              className={cn(
                                "shrink-0 border-0 px-1.5 py-0 text-[10px]",
                                selected
                                  ? "bg-white/20 text-white hover:bg-white/20"
                                  : "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400",
                              )}
                            >
                              {t("accounts.currentAccount")}
                            </Badge>
                          ) : null}
                        </span>
                        <span
                          className={cn(
                            "mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] leading-snug",
                            selected ? "text-primary-foreground/75" : "text-muted-foreground",
                          )}
                        >
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-5 shrink-0 px-1.5 py-0 text-[10px] font-medium capitalize leading-none",
                              selected &&
                                "border-white/35 bg-white/10 text-white hover:bg-white/10",
                            )}
                          >
                            {formatPlan(accountPlan(account), t)}
                          </Badge>
                          <TokenStatusBadge account={account} selected={selected} />
                          <QuotaInline
                            label={t("accounts.5hour")}
                            value={quotaPercent(account, "primaryWindow")}
                            selected={selected}
                          />
                          <QuotaInline
                            label={t("accounts.weekly")}
                            value={quotaPercent(account, "secondaryWindow")}
                            selected={selected}
                          />
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
              {selectedAccount ? (
                <AccountDetail
                  account={selectedAccount}
                  activeAccount={activeAccount}
                  apiReachability={apiReachability}
                  switching={module.switchAccountAndRestart.isPending}
                  removing={module.removeAccounts.isPending}
                  onSwitch={() => setSwitchTarget(selectedAccount)}
                  onRemove={() => setRemoveTarget(selectedAccount)}
                />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center">
                  <KeyRound className="h-10 w-10 text-muted-foreground/25" />
                  <p className="mt-2 text-sm text-muted-foreground">{t("accounts.noSelection")}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/60">
                    {t("accounts.selectHint")}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmAccountAction
        open={switchTarget !== null}
        title={t("accounts.switchConfirmTitle")}
        description={t("accounts.switchConfirmDesc", {
          email: switchTarget ? accountEmail(switchTarget) : "",
        })}
        actionLabel={t("accounts.switchAndRestart")}
        pending={module.switchAccountAndRestart.isPending}
        onOpenChange={(open) => !open && setSwitchTarget(null)}
        onConfirm={() => {
          if (!switchTarget) return;
          void module.switchAccountAndRestart
            .run({ accountKey: accountKey(switchTarget) })
            .finally(() => setSwitchTarget(null));
        }}
      />
      <ConfirmAccountAction
        open={removeTarget !== null}
        title={t("accounts.removeConfirmTitle")}
        description={t("accounts.confirmRemove", {
          email: removeTarget ? accountEmail(removeTarget) : "",
        })}
        actionLabel={t("common.confirm")}
        destructive
        pending={module.removeAccounts.isPending}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        onConfirm={() => {
          if (!removeTarget) return;
          void module.removeAccounts
            .run({ accountKeys: [accountKey(removeTarget)] })
            .finally(() => setRemoveTarget(null));
        }}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
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
                disabled={module.importChatGptSessionAccount.isPending}
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
                disabled={module.importChatGptSessionAccount.isPending}
              />
              <SessionImportStep
                step="3"
                title={t("accounts.addAccountSessionStep3Title")}
                description={t("accounts.addAccountSessionStep3Desc")}
                disabled={module.importChatGptSessionAccount.isPending}
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
                  disabled={module.importChatGptSessionAccount.isPending}
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
                disabled={module.importChatGptSessionAccount.isPending}
              />
            </div>
            <label className="flex items-center gap-2 rounded-[8px] border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <Checkbox
                checked={overwriteExisting}
                disabled={module.importChatGptSessionAccount.isPending}
                onCheckedChange={(checked) => setOverwriteExisting(checked === true)}
              />
              {t("accounts.addAccountSessionOverwrite")}
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={module.importChatGptSessionAccount.isPending}
              onClick={() => setAddOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              disabled={
                !sessionJson.trim() || module.importChatGptSessionAccount.isPending
              }
              onClick={() => void importSession()}
            >
              <ButtonBusyContent
                busy={module.importChatGptSessionAccount.isPending}
                idleLabel={t("accounts.addAccountSessionImport")}
                busyLabel={t("accounts.addAccountSessionImporting")}
              />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccountsPageHeader() {
  const { t } = useTranslation();

  return (
    <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border pb-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-normal">
          {t("nav.accounts")}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
          {t("accounts.description")}
        </p>
      </div>
    </header>
  );
}

function AccountDetail({
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
    apiReachability === "unreachable" && accountKey(account) === accountKey(activeAccount);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{t("accounts.selectedAccount")}</p>
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
        <Badge variant={isActiveAccount(account) ? "default" : "secondary"} className="shrink-0">
          {formatPlan(accountPlan(account), t)}
        </Badge>
      </div>

      <div className="relative mt-5">
        <div className="grid min-w-0 grid-cols-2 gap-3">
          <QuotaWindowCard label={t("accounts.5hour")} account={account} slot="primaryWindow" />
          <QuotaWindowCard label={t("accounts.weekly")} account={account} slot="secondaryWindow" />
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

      <TokenStatusPanel account={account} />

      <div className="mt-5 rounded-xl border border-border">
        <DetailRow label={t("accounts.workspaceName")} value={readString(account, ["workspaceName"], t("accounts.notAvailable"))} />
        <Separator />
        <DetailRow label={t("accounts.profileName")} value={readString(account, ["profileName"], t("accounts.notAvailable"))} />
        <Separator />
        <DetailRow label={t("accounts.authMode")} value={formatAuthMode(readString(account, ["authMode"], "")) || t("accounts.notAvailable")} />
        <Separator />
        <DetailRow label={t("accounts.subscriptionStatus")} value={formatSubscription(readPath(account, "hasActiveSubscription"), t)} />
        <Separator />
        <DetailRow label={t("accounts.expiresAt")} value={formatEpoch(readNumber(account, ["subscriptionExpiresAt"])) || t("accounts.notAvailable")} />
        <Separator />
        <DetailRow label={t("accounts.autoRenew")} value={formatAutoRenew(readPath(account, "subscriptionWillRenew"), t)} />
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

function ConfirmAccountAction({
  open,
  title,
  description,
  actionLabel,
  destructive,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  actionLabel: string;
  destructive?: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending ? t("common.loading") : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
        <Button type="button" variant="outline" size="sm" className="mt-3 w-full" disabled={disabled} onClick={onAction}>
          <ExternalLink className="h-3.5 w-3.5" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function ApiStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  if (status === "reachable") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        {t("overview.apiReachable")}
      </Badge>
    );
  }
  if (status === "unreachable") {
    return (
      <Badge variant="outline" className="text-destructive">
        <ShieldAlert className="mr-1 h-3 w-3" />
        {t("overview.apiUnreachable")}
      </Badge>
    );
  }
  return <Badge variant="outline">{t("overview.apiChecking")}</Badge>;
}

function QuotaInline({
  label,
  value,
  selected,
}: {
  label: string;
  value: number | null;
  selected: boolean;
}) {
  return (
    <>
      <span className="opacity-50" aria-hidden>
        -
      </span>
      <span>{label}</span>
      <span className={cn("tabular-nums font-semibold", quotaTextClass(value, selected))}>
        {formatPercent(value)}
      </span>
    </>
  );
}

function QuotaWindowCard({
  label,
  account,
  slot,
}: {
  label: string;
  account: AccountRecord;
  slot: "primaryWindow" | "secondaryWindow";
}) {
  const value = quotaPercent(account, slot);
  const windowValue = readPath(account, slot);
  const reset = formatEpoch(readNumber(windowValue, ["resetsAt"]));
  return (
    <div className="min-w-0 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("text-sm font-bold tabular-nums", quotaTextClass(value, false))}>
          {formatPercent(value)}
        </span>
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all", quotaBarClass(value))}
          style={{ width: value == null ? "0%" : `${Math.max(0, Math.min(value, 100))}%` }}
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

function TokenStatusBadge({
  account,
  selected,
}: {
  account: AccountRecord;
  selected: boolean;
}) {
  const { t } = useTranslation();
  const code = tokenStatusCode(account);
  if (!code || code === "fresh" || code === "refreshed") return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 shrink-0 px-1.5 py-0 text-[10px] font-medium leading-none",
        selected ? "border-white/35 bg-white/10 text-white" : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      )}
    >
      {t(`accounts.tokenStatus.${code}`)}
    </Badge>
  );
}

function TokenStatusPanel({ account }: { account: AccountRecord }) {
  const { t } = useTranslation();
  const status = readPath(account, "tokenStatus");
  const code = tokenStatusCode(account);
  if (!code || code === "fresh" || code === "refreshed") return null;
  const message = readString(status, ["message"], "");
  const expiresAt = readNumber(status, ["accessTokenExpiresAt"]);
  return (
    <div className="mt-3 flex items-start gap-2.5 rounded-[8px] border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1 leading-snug">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <span>{t(`accounts.tokenStatus.${code}`)}</span>
          {expiresAt > 0 ? (
            <span className="text-[11px] font-normal text-muted-foreground">
              {formatEpoch(expiresAt)}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {t(`accounts.tokenStatus.${code}Desc`)}
        </p>
        {message ? (
          <p className="mt-1 break-all text-[10.5px] text-muted-foreground/75">
            {message}
          </p>
        ) : null}
      </div>
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

function accountKey(account: AccountRecord | null | undefined) {
  if (!account) return "";
  return readString(account, ["accountKey", "key", "id"], "");
}

function accountEmail(account: AccountRecord) {
  return readString(account, ["email", "accountName", "alias", "accountKey"], "");
}

function accountPlan(account: AccountRecord) {
  return readString(account, ["plan"], "unknown");
}

function isActiveAccount(account: AccountRecord) {
  return readBoolean(account, ["isActive", "active"], false);
}

function quotaPercent(account: AccountRecord, slot: "primaryWindow" | "secondaryWindow") {
  const value = readNumber(readPath(account, slot), ["remainingPercent"], Number.NaN);
  return Number.isFinite(value) ? value : null;
}

function tokenStatusCode(account: AccountRecord) {
  return readString(readPath(account, "tokenStatus"), ["code"], "");
}

function formatPlan(plan: string, t: (key: string) => string) {
  if (!plan || plan === "unknown") return t("accounts.planUnknown");
  if (plan === "pro5x") return "Pro 5x";
  if (plan === "pro20x") return "Pro 20x";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function formatPercent(value: number | null) {
  return value == null ? "-" : `${Math.round(value)}%`;
}

function quotaTextClass(value: number | null, selected: boolean) {
  if (value == null) return selected ? "text-primary-foreground/70" : "text-muted-foreground";
  if (selected) return value > 50 ? "text-emerald-200" : value > 20 ? "text-amber-200" : "text-red-200";
  return value > 50 ? "text-emerald-500" : value > 20 ? "text-amber-500" : "text-destructive";
}

function quotaBarClass(value: number | null) {
  if (value == null) return "bg-muted-foreground/20";
  return value > 50 ? "bg-emerald-500" : value > 20 ? "bg-amber-500" : "bg-destructive";
}

function quotaDotClass(value: number | null) {
  if (value == null) return "bg-muted-foreground/40";
  return value > 50 ? "bg-emerald-500" : value > 20 ? "bg-amber-500" : "bg-destructive";
}

function formatEpoch(value: number) {
  if (!value) return "";
  const date = new Date(value > 10_000_000_000 ? value : value * 1000);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAuthMode(value: string) {
  if (value === "chatgpt") return "ChatGPT OAuth";
  if (value === "apikey") return "API Key";
  return value;
}

function formatSubscription(value: unknown, t: (key: string) => string) {
  if (value === true) return t("accounts.subscriptionActive");
  if (value === false) return t("accounts.subscriptionInactive");
  return t("accounts.notAvailable");
}

function formatAutoRenew(value: unknown, t: (key: string) => string) {
  if (value === true) return t("accounts.autoRenewEnabled");
  if (value === false) return t("accounts.autoRenewDisabled");
  return t("accounts.notAvailable");
}
