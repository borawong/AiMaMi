import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  RotateCcw,
  RotateCw,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { useMaintenanceActionMutations } from "./mutation";
import { useMaintenanceQueries } from "./query";
import type {
  MaintenanceActionDefinition,
  MaintenanceActionResult,
  MaintenanceActionView,
  MaintenancePageController,
  MaintenanceSystemInfoField,
} from "../types";

const MIN_FEEDBACK_MS = 800;

export function useMaintenancePageController(): MaintenancePageController {
  const { t } = useTranslation();
  const [results, setResults] = useState<Record<string, MaintenanceActionResult>>({});
  const [runningKeys, setRunningKeys] = useState<Record<string, boolean>>({});
  const runningKeysRef = useRef<Record<string, boolean>>({});
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [routerDiagnosticsOpen, setRouterDiagnosticsOpen] = useState(false);
  const { imageCompatQuery, systemInfoQuery } = useMaintenanceQueries();

  const setActionResult = useCallback((key: string, result: MaintenanceActionResult) => {
    setResults((prev) => ({ ...prev, [key]: result }));
  }, []);

  const setActionRunning = useCallback((key: string, running: boolean) => {
    setRunningKeys((prev) => {
      const next = { ...prev, [key]: running };
      runningKeysRef.current = next;
      return next;
    });
  }, []);

  const {
    diagnoseMutation,
    cleanMutation,
    rebuildMutation,
    restartMutation,
    forceKillMutation,
    resetConfigMutation,
    setImageCompatMutation,
    runRouterDiagnostics,
    fixRouterIssueAndRefresh,
  } = useMaintenanceActionMutations({
    onDiagnosed: (res) => {
      setActionResult("diagnose", {
        type: "success",
        message: t("maintenance.diagnoseResult", {
          os: res.platform.os,
          arch: res.platform.arch,
          version: res.coreVersion,
          count: res.registryState.accountCount,
        }),
      });
    },
    onDiagnoseError: (err) =>
      setActionResult("diagnose", { type: "error", message: String(err) }),
    onCleaned: (res) => {
      setActionResult("clean", {
        type: "success",
        message: t("maintenance.cleanResult", {
          authBackups: res.authBackupsRemoved,
          registryBackups: res.registryBackupsRemoved,
          staleEntries: res.staleEntriesRemoved,
        }),
      });
    },
    onCleanError: (err) =>
      setActionResult("clean", { type: "error", message: String(err) }),
    onRebuilt: (res) => {
      setActionResult("rebuild", {
        type: "success",
        message: t("maintenance.rebuildResult", { count: res.accountCount }),
      });
    },
    onRebuildError: (err) =>
      setActionResult("rebuild", { type: "error", message: String(err) }),
    onRestarted: () =>
      setActionResult("restart", {
        type: "success",
        message: t("maintenance.codexRestarted"),
      }),
    onRestartError: (err) =>
      setActionResult("restart", { type: "error", message: String(err) }),
  });

  const runAction = useCallback(
    async (key: string, mutateAsync: () => Promise<void>) => {
      if (runningKeysRef.current[key]) {
        return;
      }

      flushSync(() => setActionRunning(key, true));
      await waitForPaint();

      const startedAt = Date.now();
      try {
        await mutateAsync();
      } catch (error) {
        setActionResult(key, { type: "error", message: String(error) });
      } finally {
        await waitForFeedback(startedAt);
        setActionRunning(key, false);
      }
    },
    [setActionResult, setActionRunning],
  );

  const handleRestartClick = useCallback(() => {
    setRestartConfirmOpen(true);
  }, []);

  const handleRestartConfirm = useCallback(() => {
    setRestartConfirmOpen(false);
    void runAction("restart", async () => {
      await restartMutation.mutateAsync();
    });
  }, [restartMutation, runAction]);

  const systemInfoFields: MaintenanceSystemInfoField[] = [
    {
      label: t("maintenance.systemInfoOs"),
      value: systemInfoQuery.data?.os ?? "-",
    },
    {
      label: t("maintenance.systemInfoArch"),
      value: systemInfoQuery.data?.arch ?? "-",
    },
    {
      label: t("maintenance.systemInfoVersion"),
      value: systemInfoQuery.data?.osVersion ?? "-",
    },
  ];

  const actionDefinitions: MaintenanceActionDefinition[] = [
    {
      key: "diagnose",
      icon: Stethoscope,
      iconColor: "text-blue-500",
      label: t("maintenance.diagnose"),
      description: t("maintenance.diagnoseDesc"),
      actionLabel: t("maintenance.diagnoseAction"),
      loadingLabel: t("maintenance.diagnosing"),
      onAction: () =>
        void runAction("diagnose", async () => {
          await diagnoseMutation.mutateAsync();
        }),
    },
    {
      key: "routerDiagnostics",
      icon: Stethoscope,
      iconColor: "text-cyan-500",
      label: t("maintenance.routerDiagnostics"),
      description: t("maintenance.routerDiagnosticsDesc"),
      actionLabel: t("maintenance.routerDiagnosticsAction"),
      loadingLabel: t("maintenance.diagnosing"),
      onAction: () => setRouterDiagnosticsOpen(true),
    },
    {
      key: "clean",
      icon: Trash2,
      iconColor: "text-amber-500",
      label: t("maintenance.clean"),
      description: t("maintenance.cleanDesc"),
      actionLabel: t("maintenance.cleanAction"),
      loadingLabel: t("maintenance.cleaning"),
      onAction: () =>
        void runAction("clean", async () => {
          await cleanMutation.mutateAsync();
        }),
    },
    {
      key: "rebuild",
      icon: RotateCw,
      iconColor: "text-violet-500",
      label: t("maintenance.rebuild"),
      description: t("maintenance.rebuildDesc"),
      actionLabel: t("maintenance.rebuildAction"),
      loadingLabel: t("maintenance.rebuilding"),
      onAction: () =>
        void runAction("rebuild", async () => {
          await rebuildMutation.mutateAsync();
        }),
    },
    {
      key: "forceKill",
      icon: AlertCircle,
      iconColor: "text-orange-500",
      label: t("maintenance.forceKill"),
      description: t("maintenance.forceKillDesc"),
      actionLabel: t("maintenance.forceKillAction"),
      loadingLabel: t("maintenance.forceKilling"),
      onAction: () =>
        void runAction("forceKill", async () => {
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
      label: t("maintenance.resetConfig"),
      description: t("maintenance.resetConfigDesc"),
      actionLabel: t("maintenance.resetConfigAction"),
      loadingLabel: t("maintenance.resetConfigRunning"),
      onAction: () =>
        void runAction("resetConfig", async () => {
          await resetConfigMutation.mutateAsync();
          setActionResult("resetConfig", {
            type: "success",
            message: t("maintenance.resetConfigDone"),
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
      loadingLabel: t("maintenance.running"),
      onAction: () =>
        void runAction("imageCompat", async () => {
          const enabled = !(imageCompatQuery.data ?? false);
          await setImageCompatMutation.mutateAsync({
            enabled,
          });
          setActionResult("imageCompat", {
            type: "success",
            message: t("maintenance.imageCompatDone"),
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

  const actions: MaintenanceActionView[] = actionDefinitions.map((action) => ({
    ...action,
    result: results[action.key],
    busy: Boolean(runningKeys[action.key]),
  }));

  return {
    actions,
    systemInfoFields,
    systemInfoQuery,
    systemInfoIcon: Info,
    restartDialog: {
      open: restartConfirmOpen,
      onOpenChange: setRestartConfirmOpen,
      onConfirm: handleRestartConfirm,
    },
    routerDiagnosticsDialog: {
      open: routerDiagnosticsOpen,
      onOpenChange: setRouterDiagnosticsOpen,
      runDiagnostics: runRouterDiagnostics,
      fixIssueAndRefresh: fixRouterIssueAndRefresh,
    },
  };
}

async function waitForPaint() {
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

async function waitForFeedback(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_FEEDBACK_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_FEEDBACK_MS - elapsed));
  }
}
