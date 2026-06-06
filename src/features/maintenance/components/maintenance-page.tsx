import { useState, useCallback } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Stethoscope,
  Trash2,
  RotateCw,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Info,
  type LucideIcon,
} from "lucide-react";
import { useMaintenanceActionMutations } from "../hooks";

const MIN_FEEDBACK_MS = 800;

interface ActionResult {
  type: "success" | "error";
  message: string;
}

export function MaintenancePage() {
  const { t } = useTranslation();
  const [results, setResults] = useState<Record<string, ActionResult>>({});
  const [runningKeys, setRunningKeys] = useState<Record<string, boolean>>({});
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);

  const setActionResult = (key: string, result: ActionResult) => {
    setResults((prev) => ({ ...prev, [key]: result }));
  };

  const {
    imageCompatQuery,
    systemInfoQuery,
    diagnoseMutation,
    cleanMutation,
    rebuildMutation,
    restartMutation,
    forceKillMutation,
    resetConfigMutation,
    setImageCompatMutation,
    routerDiagnosticsMutation,
    fixRouterIssueMutation,
  } = useMaintenanceActionMutations({
    onDiagnosed: (res) => {
      const d = res.data;
      setActionResult("diagnose", {
        type: "success",
        message: t("maintenance.diagnoseResult", {
          os: d.platform.os,
          arch: d.platform.arch,
          version: d.coreVersion,
          count: d.registryState.accountCount,
        }),
      });
    },
    onDiagnoseError: (err) => setActionResult("diagnose", { type: "error", message: String(err) }),
    onCleaned: (res) => {
      const d = res.data;
      setActionResult("clean", {
        type: "success",
        message: t("maintenance.cleanResult", {
          authBackups: d.authBackupsRemoved,
          registryBackups: d.registryBackupsRemoved,
          staleEntries: d.staleEntriesRemoved,
        }),
      });
    },
    onCleanError: (err) => setActionResult("clean", { type: "error", message: String(err) }),
    onRebuilt: (res) => {
      setActionResult("rebuild", {
        type: "success",
        message: t("maintenance.rebuildResult", { count: res.data.accountCount }),
      });
    },
    onRebuildError: (err) => setActionResult("rebuild", { type: "error", message: String(err) }),
    onRestarted: () => setActionResult("restart", { type: "success", message: t("maintenance.codexRestarted") }),
    onRestartError: (err) => setActionResult("restart", { type: "error", message: String(err) }),
  });

  const runAction = useCallback(async (key: string, mutateAsync: () => Promise<unknown>) => {
    if (runningKeys[key]) return;
    flushSync(() => setRunningKeys((prev) => ({ ...prev, [key]: true })));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const startedAt = Date.now();
    try {
      await mutateAsync();
    } catch (error) {
      setActionResult(key, { type: "error", message: String(error) });
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_FEEDBACK_MS) {
        await new Promise((r) => setTimeout(r, MIN_FEEDBACK_MS - elapsed));
      }
      setRunningKeys((prev) => ({ ...prev, [key]: false }));
    }
  }, [runningKeys]);

  const handleRestartClick = () => {
    setRestartConfirmOpen(true);
  };

  const handleRestartConfirm = () => {
    setRestartConfirmOpen(false);
    runAction("restart", () => restartMutation.mutateAsync());
  };

  const systemInfo = systemInfoQuery.data;
  const systemInfoFields = [
    {
      label: t("maintenance.systemInfoOs"),
      value: readSystemInfoField(systemInfo, [["platform", "os"], ["os"]]),
    },
    {
      label: t("maintenance.systemInfoArch"),
      value: readSystemInfoField(systemInfo, [["platform", "arch"], ["arch"]]),
    },
    {
      label: t("maintenance.systemInfoVersion"),
      value: readSystemInfoField(systemInfo, [["coreVersion"], ["version"]]),
    },
  ];

  const actions: {
    key: string;
    icon: LucideIcon;
    iconColor: string;
    label: string;
    description: string;
    actionLabel: string;
    loadingLabel: string;
    onAction: () => void;
    disabled?: boolean;
    variant?: "destructive";
  }[] = [
    {
      key: "diagnose",
      icon: Stethoscope,
      iconColor: "text-blue-500",
      label: t("maintenance.diagnose"),
      description: t("maintenance.diagnoseDesc"),
      actionLabel: t("maintenance.diagnoseAction"),
      loadingLabel: t("maintenance.diagnosing"),
      onAction: () => runAction("diagnose", () => diagnoseMutation.mutateAsync()),
    },
    {
      key: "routerDiagnostics",
      icon: Stethoscope,
      iconColor: "text-cyan-500",
      label: t("maintenance.routerDiagnostics"),
      description: t("maintenance.routerDiagnosticsDesc"),
      actionLabel: t("maintenance.routerDiagnosticsAction"),
      loadingLabel: t("maintenance.routerDiagnosing"),
      onAction: () =>
        runAction("routerDiagnostics", async () => {
          await routerDiagnosticsMutation.mutateAsync();
          setActionResult("routerDiagnostics", {
            type: "success",
            message: t("maintenance.routerDiagnosticsResult"),
          });
        }),
    },
    {
      key: "fixRouterAll",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      label: t("maintenance.fixRouterAll"),
      description: t("maintenance.fixRouterAllDesc"),
      actionLabel: t("maintenance.fixRouterAllAction"),
      loadingLabel: t("maintenance.fixingRouter"),
      onAction: () =>
        runAction("fixRouterAll", async () => {
          await fixRouterIssueMutation.mutateAsync({ itemId: "all" });
          setActionResult("fixRouterAll", {
            type: "success",
            message: t("maintenance.routerFixAllResult"),
          });
        }),
    },
    {
      key: "clean",
      icon: Trash2,
      iconColor: "text-amber-500",
      label: t("maintenance.clean"),
      description: t("maintenance.cleanDesc"),
      actionLabel: t("maintenance.cleanAction"),
      loadingLabel: t("maintenance.cleaning"),
      onAction: () => runAction("clean", () => cleanMutation.mutateAsync()),
    },
    {
      key: "openPathBoundary",
      icon: FolderOpen,
      iconColor: "text-slate-500",
      label: t("maintenance.openPath"),
      description: t("maintenance.openPathDesc"),
      actionLabel: t("maintenance.openPathAction"),
      loadingLabel: t("maintenance.running"),
      onAction: () => undefined,
      disabled: true,
    },
    {
      key: "rebuild",
      icon: RotateCw,
      iconColor: "text-violet-500",
      label: t("maintenance.rebuild"),
      description: t("maintenance.rebuildDesc"),
      actionLabel: t("maintenance.rebuildAction"),
      loadingLabel: t("maintenance.rebuilding"),
      onAction: () => runAction("rebuild", () => rebuildMutation.mutateAsync()),
    },
    {
      key: "forceKill",
      icon: AlertCircle,
      iconColor: "text-orange-500",
      label: t("maintenance.forceKillCodex"),
      description: t("maintenance.forceKillCodexDesc"),
      actionLabel: t("maintenance.forceKillCodexAction"),
      loadingLabel: t("maintenance.forceKilling"),
      onAction: () =>
        runAction("forceKill", async () => {
          await forceKillMutation.mutateAsync();
          setActionResult("forceKill", {
            type: "success",
            message: t("maintenance.forceKillResult"),
          });
        }),
      variant: "destructive",
    },
    {
      key: "resetConfig",
      icon: RotateCcw,
      iconColor: "text-rose-500",
      label: t("maintenance.resetCodexConfig"),
      description: t("maintenance.resetCodexConfigDesc"),
      actionLabel: t("maintenance.resetCodexConfigAction"),
      loadingLabel: t("maintenance.resettingConfig"),
      onAction: () =>
        runAction("resetConfig", async () => {
          await resetConfigMutation.mutateAsync();
          setActionResult("resetConfig", {
            type: "success",
            message: t("maintenance.resetConfigResult"),
          });
        }),
      variant: "destructive",
    },
    {
      key: "imageCompat",
      icon: CheckCircle2,
      iconColor: "text-sky-500",
      label: t("maintenance.imageCompat"),
      description: t("maintenance.imageCompatDesc"),
      actionLabel: imageCompatQuery.data
        ? t("maintenance.imageCompatDisable")
        : t("maintenance.imageCompatEnable"),
      loadingLabel: t("maintenance.imageCompatRunning"),
      onAction: () =>
        runAction("imageCompat", async () => {
          const enabled = !(imageCompatQuery.data ?? false);
          const nextEnabled = await setImageCompatMutation.mutateAsync({
            enabled,
          });
          setActionResult("imageCompat", {
            type: "success",
            message: t("maintenance.imageCompatResult", {
              state: t(nextEnabled ? "maintenance.enabled" : "maintenance.disabled"),
            }),
          });
        }),
    },
    {
      key: "restart",
      icon: RotateCcw,
      iconColor: "text-red-500",
      label: t("maintenance.restartCodex"),
      description: t("maintenance.restartCodexDesc"),
      actionLabel: t("maintenance.restartCodexAction"),
      loadingLabel: t("maintenance.running"),
      onAction: handleRestartClick,
      variant: "destructive",
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("maintenance.description")}</p>

      <BentoCard className="p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sky-500" />
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
        {actions.map(({ key, icon: Icon, iconColor, label, description, actionLabel, loadingLabel, onAction, disabled, variant }) => {
          const result = results[key];
          const busy = !!runningKeys[key];
          return (
            <div key={key} className="px-5 py-4 transition-colors hover:bg-accent">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={cn("h-[18px] w-[18px] shrink-0", iconColor)} />
                  <div className="min-w-0">
                    <span className="text-[14px] font-semibold">{label}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAction}
                  disabled={busy || disabled}
                  className={cn("shrink-0", variant === "destructive" ? "text-muted-foreground hover:bg-destructive hover:text-white hover:border-destructive" : "")}
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
                      : "border-destructive/20 bg-destructive/5 text-destructive"
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
          );
        })}
        </div>
      </BentoCard>

      <AlertDialog open={restartConfirmOpen} onOpenChange={setRestartConfirmOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("maintenance.restartConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("maintenance.restartConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestartConfirm}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t("maintenance.restartCodexAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function readSystemInfoField(value: unknown, paths: string[][]) {
  for (const path of paths) {
    const field = readUnknownPath(value, path);
    if (
      typeof field === "string" ||
      typeof field === "number" ||
      typeof field === "boolean"
    ) {
      return String(field);
    }
  }

  return "-";
}

function readUnknownPath(value: unknown, path: string[]) {
  let current = value;
  for (const segment of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}
