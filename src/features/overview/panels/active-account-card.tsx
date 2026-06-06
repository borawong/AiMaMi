import { UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { cn } from "@/lib/utils";
import type {
  OverviewActiveAccountModel,
  OverviewBoundaryAction,
  OverviewQuotaWindow,
} from "../types";
import { BoundaryButton } from "./boundary-button";

export function ActiveAccountCard({
  account,
  boundaryAction,
}: {
  account: OverviewActiveAccountModel;
  boundaryAction: OverviewBoundaryAction;
}) {
  const { t } = useTranslation();
  const displayName = account.hasAccount
    ? account.accountLabel || account.accountKeyLabel
    : t("overview.noActiveAccountHint");

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
                !account.hasAccount && "text-muted-foreground",
              )}
            >
              {displayName}
            </span>
          </div>
          <p className="mt-1 min-h-4 truncate text-xs text-muted-foreground">
            {account.hasAccount ? account.accountKeyLabel : " "}
          </p>
        </div>
        <Badge variant={account.apiReachable ? "default" : "destructive"} className="shrink-0">
          {t(account.apiReachable ? "overview.apiReachable" : "overview.apiUnreachable")}
        </Badge>
      </div>

      <div className="mt-2 flex min-h-5 items-center gap-2">
        {account.hasAccount ? (
          <span className="inline-flex items-center gap-[5px] text-xs font-semibold text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_2px_rgba(59,130,246,0.2)]" />
            {account.plan || t("accounts.planUnknown")}
          </span>
        ) : null}
      </div>

      <div className="relative my-4">
        <div className="grid grid-cols-2 gap-3">
          <QuotaWindowCard
            label={t("overview.fiveHour")}
            window={account.primaryWindow}
            disabled={!account.hasAccount || account.loading}
          />
          <QuotaWindowCard
            label={t("overview.thisWeek")}
            window={account.secondaryWindow}
            disabled={!account.hasAccount || account.loading}
          />
        </div>
        {!account.apiReachable ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-[8px] border border-destructive/20 bg-background/85 p-4 backdrop-blur-[2px]">
            <p className="max-w-[280px] text-center text-xs leading-relaxed text-muted-foreground">
              {t("overview.apiUnreachableHintPrefix")} {t("overview.configureProxy")}
            </p>
          </div>
        ) : null}
      </div>

      <BoundaryButton action={boundaryAction} />
    </BentoCard>
  );
}

function QuotaWindowCard({
  label,
  window,
  disabled,
}: {
  label: string;
  window: OverviewQuotaWindow | null;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const percent = window?.remainingPercent;
  const rounded = percent == null ? null : Math.round(percent);
  const tone = quotaTone(rounded);

  return (
    <div className={cn("rounded-[8px] border border-border bg-card px-3.5 py-3", disabled && "opacity-50")}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-bold">{disabled || rounded == null ? "-" : `${rounded}%`}</span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-[3px] bg-accent">
        <div
          className={cn("h-full rounded-[3px] transition-[width] duration-500", tone.barClass)}
          style={{
            width: disabled || rounded == null ? "0%" : `${Math.max(0, Math.min(100, rounded))}%`,
          }}
        />
      </div>
      {!disabled && rounded != null && window?.resetLabel ? (
        <p className="mt-[7px] flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className={cn("h-[5px] w-[5px] rounded-full", tone.dotClass)} />
          {t("accounts.resetAt")} {window.resetLabel}
        </p>
      ) : null}
    </div>
  );
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
