import type { ReactNode } from "react";
import { CheckCircle2, KeyRound, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AccountPlanFilter, AccountsPageController } from "../types";
import { formatPlan } from "./display";
import type { AccountDetailActions } from "./detail";
import { AccountDetailPanel } from "./detail";
import { AccountsListPanel } from "./list";

export function AccountsPagePanel({
  controller,
  addSessionDialog,
  actionControls,
}: {
  controller: AccountsPageController;
  addSessionDialog: ReactNode;
  actionControls: AccountDetailActions;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <AccountsPageHeader />
      <AccountsToolbar controller={controller} addSessionDialog={addSessionDialog} />
      <AccountsFilterBar controller={controller} />
      <AccountsWorkspace controller={controller} actionControls={actionControls} />
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

function AccountsToolbar({
  controller,
  addSessionDialog,
}: {
  controller: AccountsPageController;
  addSessionDialog: ReactNode;
}) {
  const { t } = useTranslation();
  const refreshing = controller.isFetching || controller.isRefreshing;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 py-4">
      {addSessionDialog}
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        disabled={refreshing}
        aria-label={t("common.refresh")}
        onClick={() => void controller.refresh()}
      >
        <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
      </Button>
      <div className="ml-auto flex min-w-0 items-center gap-2">
        <ApiStatusBadge status={controller.apiReachability} />
      </div>
    </div>
  );
}

function AccountsFilterBar({
  controller,
}: {
  controller: AccountsPageController;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 pb-4">
      <div className="relative min-w-[180px] max-w-[260px] flex-1">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={controller.query}
          onChange={(event) => controller.setQuery(event.target.value)}
          placeholder={t("accounts.search")}
          className="h-8 rounded-[8px] pl-8 text-xs"
        />
      </div>
      <select
        value={controller.planFilter}
        onChange={(event) =>
          controller.setPlanFilter(event.target.value as AccountPlanFilter)
        }
        className="h-8 rounded-[8px] border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
        aria-label={t("accounts.planFilter")}
      >
        {controller.planFilters.map((plan) => (
          <option key={plan} value={plan}>
            {plan === "all" ? t("accounts.allPlans") : formatPlan(plan, t)}
          </option>
        ))}
      </select>
      <Badge variant="outline" className="ml-auto shrink-0">
        {t("accounts.accountCount")}: {controller.accounts.length}
      </Badge>
    </div>
  );
}

function AccountsWorkspace({
  controller,
  actionControls,
}: {
  controller: AccountsPageController;
  actionControls: AccountDetailActions;
}) {
  const { t } = useTranslation();

  if (controller.loading) {
    return <PanelState label={t("common.loading")} />;
  }

  if (controller.error && controller.accounts.length === 0) {
    return <PanelState label={t("common.error")} destructive />;
  }

  if (controller.accounts.length === 0) {
    return <EmptyAccountsState />;
  }

  return (
    <div className="flex min-h-0 flex-1 gap-3 pb-4">
      <AccountsListPanel controller={controller} />
      <AccountDetailPanel controller={controller} actions={actionControls} />
    </div>
  );
}

function PanelState({
  label,
  destructive,
}: {
  label: string;
  destructive?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground",
        destructive && "text-destructive",
      )}
    >
      {label}
    </div>
  );
}

function EmptyAccountsState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border">
      <KeyRound className="h-12 w-12 text-muted-foreground/30" />
      <p className="mt-3 text-sm text-muted-foreground">{t("accounts.empty")}</p>
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
