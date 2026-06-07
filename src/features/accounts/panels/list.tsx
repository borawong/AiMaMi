import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AccountRecord, AccountsPageController } from "../types";
import {
  accountEmail,
  accountKey,
  accountPlan,
  isActiveAccount,
  quotaPercent,
} from "../utils";
import { formatPercent, formatPlan, quotaTextClass } from "./display";
import { AccountTokenStatusBadge } from "./token";

export function AccountsListPanel({
  controller,
}: {
  controller: AccountsPageController;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="px-4 pb-2 pt-3 text-[11px] text-muted-foreground">
        {t("accounts.listTitle")}
      </div>
      <Separator />
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {controller.filteredAccounts.map((account) => (
          <AccountListItem
            key={accountKey(account)}
            account={account}
            selected={accountKey(account) === controller.effectiveSelectedKey}
            onSelect={() => controller.selectAccount(accountKey(account))}
          />
        ))}
      </div>
    </div>
  );
}

function AccountListItem({
  account,
  selected,
  onSelect,
}: {
  account: AccountRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onSelect}
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
              selected && "border-white/35 bg-white/10 text-white hover:bg-white/10",
            )}
          >
            {formatPlan(accountPlan(account), t)}
          </Badge>
          <AccountTokenStatusBadge account={account} selected={selected} />
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
