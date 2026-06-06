import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { BentoCard } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MaintenanceRestartDialog, RouterDiagnosticsDialog } from "../dialogs";
import { useMaintenancePageController } from "../hooks";

export function MaintenancePage() {
  const { t } = useTranslation();
  const {
    actions,
    systemInfoFields,
    systemInfoQuery,
    systemInfoIcon: SystemInfoIcon,
    restartDialog,
    routerDiagnosticsDialog,
  } = useMaintenancePageController();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("maintenance.description")}</p>

      <BentoCard className="p-5">
        <div className="flex items-start gap-3">
          <SystemInfoIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sky-500" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-semibold">{t("maintenance.systemInfo")}</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {t("maintenance.systemInfoDesc")}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {systemInfoFields.map((field) => (
                <div key={field.label} className="rounded-[8px] border border-border px-3 py-2">
                  <p className="text-[11px] font-medium uppercase text-muted-foreground">
                    {field.label}
                  </p>
                  <p className="mt-1 truncate text-sm text-foreground">{field.value}</p>
                </div>
              ))}
            </div>
            {(systemInfoQuery.isLoading || systemInfoQuery.isError) && (
              <p className="mt-2 text-xs text-muted-foreground">
                {systemInfoQuery.isLoading
                  ? t("maintenance.systemInfoLoading")
                  : String(systemInfoQuery.error)}
              </p>
            )}
          </div>
        </div>
      </BentoCard>

      <BentoCard className="p-0">
        <div className="divide-y divide-border">
          {actions.map(
            ({
              key,
              icon: Icon,
              iconColor,
              label,
              description,
              actionLabel,
              loadingLabel,
              onAction,
              result,
              busy,
              variant,
            }) => (
              <div key={key} className="px-5 py-4 transition-colors hover:bg-accent">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon className={cn("h-[18px] w-[18px] shrink-0", iconColor)} />
                    <div className="min-w-0">
                      <span className="text-[14px] font-semibold">{label}</span>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAction}
                    disabled={busy}
                    className={cn(
                      "shrink-0",
                      variant === "destructive"
                        ? "text-muted-foreground hover:border-destructive hover:bg-destructive hover:text-white"
                        : "",
                    )}
                  >
                    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {busy ? loadingLabel : actionLabel}
                  </Button>
                </div>
                {result && (
                  <div
                    className={cn(
                      "mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs",
                      result.type === "success"
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                        : "border-destructive/20 bg-destructive/5 text-destructive",
                    )}
                  >
                    {result.type === "success" ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{result.message}</span>
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      </BentoCard>

      <MaintenanceRestartDialog {...restartDialog} />

      <RouterDiagnosticsDialog {...routerDiagnosticsDialog} />
    </div>
  );
}
