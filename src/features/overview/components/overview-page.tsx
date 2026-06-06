/**
 * 中文职责说明：overview 页面聚合各模块只读事实，只展示 dumped 证据支撑的仪表盘面板和禁用边界动作。
 */
import type { ReactElement, ReactNode } from "react";
import {
  Activity,
  Bell,
  FolderOpen,
  KeyRound,
  Merge,
  Server,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  envelopeData,
  firstPath,
  isRecord,
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
  RecordSummary,
} from "@/features/_shared/evidence-panels";
import { cn } from "@/lib/utils";
import { useOverviewModule } from "../hooks";

export function OverviewPage() {
  const { t } = useTranslation();
  const module = useOverviewModule();
  const snapshot = envelopeData(module.snapshotQuery.data);
  const usage = envelopeData(module.usageQuery.data);
  const mcp = envelopeData(module.mcpQuery.data);
  const skills = envelopeData(module.skillsQuery.data);
  const notificationState = envelopeData(module.notificationStateQuery.data);
  const mysteryUnlockGrants = envelopeData(module.mysteryUnlockGrantsQuery.data);
  const deviceId = module.deviceIdQuery.data ?? "";
  const mcpItems = readArray(mcp, ["items", "servers"]);
  const skillItems = readArray(skills, ["items", "skills"]);
  const health = readHealthPaths(snapshot);
  const activeAccount = findActiveAccount(snapshot);
  const accountPlan = activeAccount ? readAccountPlan(activeAccount) : "";
  const accountLabel = activeAccount ? accountEmail(activeAccount) : "";
  const accountKeyLabel = activeAccount ? accountKey(activeAccount) : "";
  const apiReachable = readBoolean(
    snapshot,
    [
      "apiReachable",
      "status.apiReachable",
      "usageStatus.apiReachable",
      "status.usageStatus.apiReachable",
    ],
    true,
  );
  const todaySessions = readNumber(usage, ["today.sessionCount"]);
  const activeMinutes = readNumber(usage, ["today.activeMinutesEstimate"]);

  return (
    <div className="space-y-5">
      <EvidencePageHeader
        titleKey="nav.overview"
        descriptionKey="overview.description"
        actions={[module.refreshUsageAction, module.focusMainWindowAction]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <ActiveAccountCard
          account={activeAccount}
          accountLabel={accountLabel}
          accountKeyLabel={accountKeyLabel}
          plan={accountPlan}
          apiReachable={apiReachable}
          loading={module.snapshotQuery.isLoading}
        />
        <HealthCard health={health} loading={module.snapshotQuery.isLoading} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          labelKey="overview.todaySessions"
          value={
            <span className="inline-flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              {todaySessions}
            </span>
          }
          hint={t("overview.todayActive", { minutes: activeMinutes })}
        />
        <MetricCard
          labelKey="overview.statMcp"
          value={
            <span className="inline-flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              {mcpItems.length || readNumber(mcp, ["total"])}
            </span>
          }
        />
        <MetricCard
          labelKey="overview.statSkills"
          value={
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              {skillItems.length || readNumber(skills, ["total"])}
            </span>
          }
        />
        <MetricCard
          labelKey="overview.healthTitle"
          value={
            <span className="inline-flex flex-wrap gap-2">
              <BoolBadge
                value={health.authExists}
                trueKey="overview.healthAuthOk"
                falseKey="overview.healthAuthMissing"
              />
              <BoolBadge
                value={health.registryExists}
                trueKey="overview.healthRegistryOk"
                falseKey="overview.healthRegistryMissing"
              />
            </span>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <QueryPanel titleKey="overview.snapshot" state={module.snapshotQuery}>
          <div className="space-y-3 text-sm">
            <HealthRow label={t("overview.deviceId")} value={deviceId || "-"} />
            <HealthRow
              label={t("overview.healthCodexHome")}
              value={health.codexHome || "-"}
            />
            <HealthRow
              label={t("overview.usageSource")}
              value={readString(snapshot, ["status.usageSource", "usageSource"], "-")}
            />
          </div>
        </QueryPanel>
        <QueryPanel titleKey="overview.usage" state={module.usageQuery}>
          <RecordList items={readArray(usage, ["dailyActivity"])} emptyKey="analytics.emptySeries" />
        </QueryPanel>
        <QueryPanel titleKey="overview.mcp" state={module.mcpQuery}>
          <RecordList items={mcpItems} emptyKey="mcp.empty" />
        </QueryPanel>
        <QueryPanel titleKey="overview.skills" state={module.skillsQuery}>
          <RecordList
            items={skillItems}
            emptyKey="skills.empty"
            renderItem={(skill) => (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {readString(skill, ["title", "name", "id"], t("skills.empty"))}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {formatOptionalEpoch(readNumber(skill, ["updatedAt"]))}
                  </p>
                </div>
                <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            )}
          />
        </QueryPanel>
        <QueryPanel titleKey="overview.notificationState" state={module.notificationStateQuery}>
          <RecordSummary value={notificationState} />
        </QueryPanel>
        <QueryPanel titleKey="overview.mysteryGrants" state={module.mysteryUnlockGrantsQuery}>
          <RecordSummary value={mysteryUnlockGrants} />
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {/* 远端设备密钥、grants 合并和通知交互需要完整安全流程证据，当前切片只保留禁用边界。 */}
            <BoundaryButton icon={<KeyRound />} label={t("overview.remoteSecretBoundary")} />
            <BoundaryButton icon={<Bell />} label={t("overview.importRemoteSecretBoundary")} />
            <BoundaryButton icon={<Merge />} label={t("overview.mergeMysteryGrantsBoundary")} />
          </div>
        </QueryPanel>
      </div>
    </div>
  );
}

function ActiveAccountCard({
  account,
  accountLabel,
  accountKeyLabel,
  plan,
  apiReachable,
  loading,
}: {
  account: unknown | null;
  accountLabel: string;
  accountKeyLabel: string;
  plan: string;
  apiReachable: boolean;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const hasAccount = isRecord(account);
  const primaryWindow = readQuotaWindow(account, "primary");
  const secondaryWindow = readQuotaWindow(account, "secondary");

  return (
    <BentoCard className="min-h-[260px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-medium text-muted-foreground">
            {t("overview.activeAccountLabel")}
          </span>
          <div className="mt-1.5 flex min-w-0 items-center gap-2">
            <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span
              className={cn(
                "min-w-0 truncate text-base font-bold leading-snug",
                !hasAccount && "text-muted-foreground",
              )}
            >
              {hasAccount ? accountLabel || accountKeyLabel : t("overview.noActiveAccountHint")}
            </span>
          </div>
          <p className="mt-1 min-h-4 truncate text-xs text-muted-foreground">
            {hasAccount ? accountKeyLabel : " "}
          </p>
        </div>
        <Badge variant={apiReachable ? "default" : "destructive"} className="shrink-0">
          {t(apiReachable ? "overview.apiReachable" : "overview.apiUnreachable")}
        </Badge>
      </div>

      <div className="mt-2 flex min-h-5 items-center gap-2">
        {hasAccount ? (
          <span className="inline-flex items-center gap-[5px] text-xs font-semibold text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_2px_rgba(59,130,246,0.2)]" />
            {formatPlan(plan, t)}
          </span>
        ) : null}
      </div>

      <div className="relative my-4">
        <div className="grid grid-cols-2 gap-3">
          <QuotaWindowCard
            label={t("overview.fiveHour")}
            window={primaryWindow}
            disabled={!hasAccount || loading}
          />
          <QuotaWindowCard
            label={t("overview.thisWeek")}
            window={secondaryWindow}
            disabled={!hasAccount || loading}
          />
        </div>
        {!apiReachable ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-[8px] border border-destructive/20 bg-background/85 p-4 backdrop-blur-[2px]">
            <p className="max-w-[280px] text-center text-xs leading-relaxed text-muted-foreground">
              {t("overview.apiUnreachableHintPrefix")} {t("overview.configureProxy")}
            </p>
          </div>
        ) : null}
      </div>

      <BoundaryButton
        icon={<UserRound />}
        label={t(hasAccount ? "overview.switchAccount" : "overview.addAccountBtn")}
      />
    </BentoCard>
  );
}

function QuotaWindowCard({
  label,
  window,
  disabled,
}: {
  label: string;
  window: QuotaWindow | null;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const percent = window?.remainingPercent;
  const rounded = percent == null ? null : Math.round(percent);
  const tone = quotaTone(rounded);
  const resetLabel = window?.resetsAt ? formatEpoch(window.resetsAt) : "";

  return (
    <div className={cn("rounded-[8px] border border-border bg-card px-3.5 py-3", disabled && "opacity-50")}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-bold">{disabled || rounded == null ? "-" : `${rounded}%`}</span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-[3px] bg-accent">
        <div
          className={cn("h-full rounded-[3px] transition-[width] duration-500", tone.barClass)}
          style={{ width: disabled || rounded == null ? "0%" : `${Math.max(0, Math.min(100, rounded))}%` }}
        />
      </div>
      {!disabled && rounded != null && resetLabel ? (
        <p className="mt-[7px] flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className={cn("h-[5px] w-[5px] rounded-full", tone.dotClass)} />
          {t("accounts.resetAt")} {resetLabel}
        </p>
      ) : null}
    </div>
  );
}

function HealthCard({ health, loading }: { health: HealthPaths; loading: boolean }) {
  const { t } = useTranslation();
  const items = [
    {
      label: t("overview.healthCodexHome"),
      ok: Boolean(health.codexHome),
    },
    {
      label: t("overview.healthAuth"),
      ok: health.authExists,
    },
    {
      label: t("overview.healthRegistry"),
      ok: health.registryExists,
    },
  ];
  const healthy = items.every((item) => item.ok);

  return (
    <BentoCard className="min-h-[260px]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-[13px] font-bold">{t("overview.healthTitle")}</span>
        <StatusPill ok={healthy} loading={loading}>
          {t(healthy ? "overview.healthOk" : "overview.healthMissing")}
        </StatusPill>
      </div>
      <ul className="m-0 list-none p-0">
        {items.map((item, index) => (
          <li
            key={item.label}
            className={cn(
              "flex items-center justify-between py-2.5 text-[13px] text-muted-foreground",
              index < items.length - 1 && "border-b border-border",
            )}
          >
            <span>{item.label}</span>
            <StatusPill ok={item.ok} loading={loading}>
              {t(item.ok ? "overview.healthOk" : "overview.healthMissing")}
            </StatusPill>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-auto shrink-0 self-start"
        disabled
      >
        <FolderOpen className="h-3.5 w-3.5" />
        {t("overview.openCodexFolder")}
      </Button>
    </BentoCard>
  );
}

function StatusPill({
  ok,
  loading,
  children,
}: {
  ok: boolean;
  loading: boolean;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <span className="inline-flex h-5 w-24 animate-pulse rounded-full bg-muted" />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-[160px] items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        ok ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive",
      )}
    >
      <span
        className={cn(
          "h-[5px] w-[5px] shrink-0 rounded-full bg-current",
          ok
            ? "shadow-[0_0_0_2px_rgba(16,185,129,0.2)]"
            : "shadow-[0_0_0_2px_rgba(239,68,68,0.2)]",
        )}
      />
      <span className="truncate">{children}</span>
    </span>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-foreground">{value}</span>
    </div>
  );
}

function BoundaryButton({ icon, label }: { icon: ReactElement; label: string }) {
  return (
    <Button type="button" size="sm" variant="outline" disabled aria-label={label}>
      {icon}
      {label}
    </Button>
  );
}

interface HealthPaths {
  codexHome: string;
  authExists: boolean;
  registryExists: boolean;
}

interface QuotaWindow {
  remainingPercent: number | null;
  resetsAt: number | null;
}

function readHealthPaths(snapshot: unknown): HealthPaths {
  return {
    codexHome: readString(snapshot, ["status.paths.codexHome", "paths.codexHome"]),
    authExists: readBoolean(snapshot, ["status.paths.authExists", "paths.authExists"]),
    registryExists: readBoolean(snapshot, ["status.paths.registryExists", "paths.registryExists"]),
  };
}

function findActiveAccount(snapshot: unknown): unknown | null {
  const direct = firstPath(snapshot, [
    "activeAccount",
    "currentAccount",
    "status.activeAccount",
    "status.currentAccount",
  ]);
  if (isRecord(direct)) return direct;

  const activeKey = readString(snapshot, [
    "activeAccountKey",
    "currentAccountKey",
    "status.activeAccountKey",
    "status.currentAccountKey",
  ]);
  const accounts = readArray(snapshot, [
    "accounts",
    "items",
    "status.accounts",
    "status.accounts.items",
    "registry.accounts",
    "registry.items",
  ]);

  return (
    accounts.find((account) => {
      if (!isRecord(account)) return false;
      return (
        readBoolean(account, ["active", "isActive", "current"]) ||
        (activeKey.length > 0 && accountKey(account) === activeKey)
      );
    }) ?? null
  );
}

function accountKey(account: unknown) {
  return readString(account, ["accountKey", "key", "id", "email"], "");
}

function accountEmail(account: unknown) {
  return readString(account, ["email", "profile.email", "account.email"], "");
}

function readAccountPlan(account: unknown) {
  return readString(account, ["plan", "subscription.plan", "account.plan"], "");
}

function readQuotaWindow(account: unknown, kind: "primary" | "secondary"): QuotaWindow | null {
  const prefix = kind === "primary" ? "primaryWindow" : "secondaryWindow";
  const aliases =
    kind === "primary"
      ? ["primaryWindow", "fiveHourWindow", "quota.primaryWindow", "quota.fiveHourWindow"]
      : ["secondaryWindow", "weeklyWindow", "quota.secondaryWindow", "quota.weeklyWindow"];
  const window = aliases
    .map((path) => firstPath(account, [path]))
    .find((value) => isRecord(value));
  const remainingPercent = readNumber(
    window,
    ["remainingPercent", "remaining", "percent"],
    Number.NaN,
  );
  const resetsAt = readNumber(window, ["resetsAt", "resetAt", "resetAtMs"], Number.NaN);

  if (Number.isFinite(remainingPercent) || Number.isFinite(resetsAt)) {
    return {
      remainingPercent: Number.isFinite(remainingPercent) ? remainingPercent : null,
      resetsAt: Number.isFinite(resetsAt) ? resetsAt : null,
    };
  }

  const flattenedRemaining = readNumber(
    account,
    [
      `${prefix}.remainingPercent`,
      `${prefix}.remaining`,
      kind === "primary" ? "fiveHourRemainingPercent" : "weeklyRemainingPercent",
    ],
    Number.NaN,
  );
  const flattenedReset = readNumber(
    account,
    [
      `${prefix}.resetsAt`,
      `${prefix}.resetAt`,
      kind === "primary" ? "fiveHourResetAt" : "weeklyResetAt",
    ],
    Number.NaN,
  );

  if (!Number.isFinite(flattenedRemaining) && !Number.isFinite(flattenedReset)) {
    return null;
  }

  return {
    remainingPercent: Number.isFinite(flattenedRemaining) ? flattenedRemaining : null,
    resetsAt: Number.isFinite(flattenedReset) ? flattenedReset : null,
  };
}

function quotaTone(value: number | null) {
  if (value == null) {
    return {
      barClass: "bg-muted-foreground/20",
      dotClass: "bg-muted-foreground/40",
    };
  }
  if (value > 50) {
    return {
      barClass: "bg-emerald-500",
      dotClass: "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]",
    };
  }
  if (value > 20) {
    return {
      barClass: "bg-amber-500",
      dotClass: "bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]",
    };
  }
  return {
    barClass: "bg-destructive",
    dotClass: "bg-destructive shadow-[0_0_0_2px_rgba(239,68,68,0.2)]",
  };
}

function formatPlan(plan: string, t: (key: string) => string) {
  if (!plan) return t("accounts.planUnknown");
  return plan;
}

function formatEpoch(value: number) {
  const millis = value > 10_000_000_000 ? value : value * 1000;
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatOptionalEpoch(value: number) {
  return value ? formatEpoch(value) : "";
}
