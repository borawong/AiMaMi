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
    restartDialog,
    routerDiagnosticsDialog,
  } = useMaintenancePageController();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("maintenance.description")}</p>

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
