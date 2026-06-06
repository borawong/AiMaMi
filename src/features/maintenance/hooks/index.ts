import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  RotateCcw,
  RotateCw,
  Stethoscope,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useModuleCacheController } from "@/features/_shared/controller";
import { maintenanceService } from "@/services/maintenance";
import {
  beginMaintenanceMutation,
  MaintenanceCache,
  MAINTENANCE_IMAGE_COMPAT_QUERY_KEY,
  MAINTENANCE_SYSTEM_INFO_QUERY_KEY,
  runMaintenanceQuery,
  writeMaintenanceActionPayload,
  writeMaintenanceMutationPayload,
} from "../cache";
import type {
  MaintenanceActionResult,
  MaintenanceFixIssueInput,
  MaintenanceImageCompatInput,
} from "../types";

const MIN_FEEDBACK_MS = 800;

interface MaintenanceActionView {
  key: string;
  icon: LucideIcon;
  iconColor: string;
  label: string;
  description: string;
  actionLabel: string;
  loadingLabel: string;
  onAction: () => void;
  result?: MaintenanceActionResult;
  busy: boolean;
  variant?: "destructive";
}

type MaintenanceActionDefinition = Omit<MaintenanceActionView, "result" | "busy">;

interface MaintenanceSystemInfoField {
  label: string;
  value: string;
}

export function useMaintenanceCacheController() {
  return useModuleCacheController(MaintenanceCache);
}

export function useMaintenanceActionMutations(options: {
  onDiagnosed: (result: Awaited<ReturnType<typeof maintenanceService.diagnose>>) => void;
  onDiagnoseError: (error: unknown) => void;
  onCleaned: (result: Awaited<ReturnType<typeof maintenanceService.clean>>) => void;
  onCleanError: (error: unknown) => void;
  onRebuilt: (result: Awaited<ReturnType<typeof maintenanceService.rebuildRegistry>>) => void;
  onRebuildError: (error: unknown) => void;
  onRestarted: () => void;
  onRestartError: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  const imageCompatQuery = useQuery({
    queryKey: MAINTENANCE_IMAGE_COMPAT_QUERY_KEY,
    queryFn: () =>
      runMaintenanceQuery(
        queryClient,
        MAINTENANCE_IMAGE_COMPAT_QUERY_KEY,
        () => maintenanceService.getImageCompat(),
      ),
    staleTime: 30_000,
  });
  const systemInfoQuery = useQuery({
    queryKey: MAINTENANCE_SYSTEM_INFO_QUERY_KEY,
    queryFn: () =>
      runMaintenanceQuery(queryClient, MAINTENANCE_SYSTEM_INFO_QUERY_KEY, () =>
        maintenanceService.getSystemInfo(),
      ),
    staleTime: 30_000,
  });

  const diagnoseMutation = useMutation({
    mutationFn: () => maintenanceService.diagnose(),
    onSuccess: async (result) => {
      await writeMaintenanceActionPayload(queryClient, result);
      options.onDiagnosed(result);
    },
    onError: options.onDiagnoseError,
  });

  const cleanMutation = useMutation({
    mutationFn: () => maintenanceService.clean(),
    onSuccess: async (result) => {
      await writeMaintenanceActionPayload(queryClient, result);
      options.onCleaned(result);
    },
    onError: options.onCleanError,
  });

  const rebuildMutation = useMutation({
    mutationFn: () => maintenanceService.rebuildRegistry(),
    onSuccess: async (result) => {
      await writeMaintenanceActionPayload(queryClient, result);
      options.onRebuilt(result);
    },
    onError: options.onRebuildError,
  });

  const restartMutation = useMutation({
    mutationFn: () => maintenanceService.restartCodex(),
    onSuccess: async (result) => {
      await writeMaintenanceActionPayload(queryClient, result);
      options.onRestarted();
    },
    onError: options.onRestartError,
  });

  const forceKillMutation = useMutation({
    mutationFn: () => maintenanceService.forceKillCodex(),
    onSuccess: async (result) => {
      await writeMaintenanceActionPayload(queryClient, result);
    },
  });

  const resetConfigMutation = useMutation({
    mutationFn: () => maintenanceService.resetCodexConfig(),
    onSuccess: async (result) => {
      await writeMaintenanceActionPayload(queryClient, result);
    },
  });

  const setImageCompatMutation = useMutation({
    mutationFn: ({ enabled }: MaintenanceImageCompatInput) =>
      maintenanceService.setImageCompat(enabled),
    onMutate: async () => {
      const sequence = beginMaintenanceMutation(MAINTENANCE_IMAGE_COMPAT_QUERY_KEY);
      await queryClient.cancelQueries({
        queryKey: MAINTENANCE_IMAGE_COMPAT_QUERY_KEY,
      });
      return { sequence };
    },
    onSuccess: async (result, _variables, context) => {
      await writeMaintenanceMutationPayload(
        queryClient,
        MAINTENANCE_IMAGE_COMPAT_QUERY_KEY,
        result,
        context?.sequence,
      );
    },
  });

  const routerDiagnosticsMutation = useMutation({
    mutationFn: () => maintenanceService.runCodexRouterDiagnostics(),
    onSuccess: async (result) => {
      await writeMaintenanceActionPayload(queryClient, result);
    },
  });

  const fixRouterIssueMutation = useMutation({
    mutationFn: ({ itemId }: MaintenanceFixIssueInput) =>
      maintenanceService.fixCodexRouterIssue(itemId),
    onSuccess: async (result) => {
      await writeMaintenanceActionPayload(queryClient, result);
    },
  });

  const runRouterDiagnosticsMutation = routerDiagnosticsMutation.mutateAsync;
  const fixRouterIssue = fixRouterIssueMutation.mutateAsync;

  const runRouterDiagnostics = useCallback(
    () => runRouterDiagnosticsMutation(),
    [runRouterDiagnosticsMutation],
  );

  const fixRouterIssueAndRefresh = useCallback(
    async (input: MaintenanceFixIssueInput) => {
      const fixResult = await fixRouterIssue(input);
      const diagnosticsResult = await runRouterDiagnosticsMutation();
      return { fixResult, diagnosticsResult };
    },
    [fixRouterIssue, runRouterDiagnosticsMutation],
  );

  const openPathMutation = useMutation({
    mutationFn: ({ path }: { path: string }) => maintenanceService.openPath(path),
    onSuccess: async (result) => {
      await writeMaintenanceActionPayload(queryClient, result);
    },
  });

  return {
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
    runRouterDiagnostics,
    fixRouterIssueAndRefresh,
    openPathMutation,
  };
}

export function useMaintenancePageController() {
  const { t } = useTranslation();
  const [results, setResults] = useState<Record<string, MaintenanceActionResult>>({});
  const [runningKeys, setRunningKeys] = useState<Record<string, boolean>>({});
  const runningKeysRef = useRef<Record<string, boolean>>({});
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [routerDiagnosticsOpen, setRouterDiagnosticsOpen] = useState(false);

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
    imageCompatQuery,
    systemInfoQuery,
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
    onDiagnoseError: (err) =>
      setActionResult("diagnose", { type: "error", message: String(err) }),
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
    onCleanError: (err) =>
      setActionResult("clean", { type: "error", message: String(err) }),
    onRebuilt: (res) => {
      setActionResult("rebuild", {
        type: "success",
        message: t("maintenance.rebuildResult", { count: res.data.accountCount }),
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
    async (key: string, mutateAsync: () => Promise<unknown>) => {
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
    void runAction("restart", () => restartMutation.mutateAsync());
  }, [restartMutation, runAction]);

  const systemInfoFields: MaintenanceSystemInfoField[] = [
    {
      label: t("maintenance.systemInfoOs"),
      value: readSystemInfoField(systemInfoQuery.data, [["platform", "os"], ["os"]]),
    },
    {
      label: t("maintenance.systemInfoArch"),
      value: readSystemInfoField(systemInfoQuery.data, [["platform", "arch"], ["arch"]]),
    },
    {
      label: t("maintenance.systemInfoVersion"),
      value: readSystemInfoField(systemInfoQuery.data, [["coreVersion"], ["version"]]),
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
      onAction: () => void runAction("diagnose", () => diagnoseMutation.mutateAsync()),
    },
    {
      key: "routerDiagnostics",
      icon: Stethoscope,
      iconColor: "text-cyan-500",
      label: t("maintenance.routerDiagnostics"),
      description: t("maintenance.routerDiagnosticsDesc"),
      actionLabel: t("maintenance.routerDiagnosticsAction"),
      loadingLabel: t("maintenance.routerDiagnosing"),
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
      onAction: () => void runAction("clean", () => cleanMutation.mutateAsync()),
    },
    {
      key: "rebuild",
      icon: RotateCw,
      iconColor: "text-violet-500",
      label: t("maintenance.rebuild"),
      description: t("maintenance.rebuildDesc"),
      actionLabel: t("maintenance.rebuildAction"),
      loadingLabel: t("maintenance.rebuilding"),
      onAction: () => void runAction("rebuild", () => rebuildMutation.mutateAsync()),
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
      label: t("maintenance.resetCodexConfig"),
      description: t("maintenance.resetCodexConfigDesc"),
      actionLabel: t("maintenance.resetCodexConfigAction"),
      loadingLabel: t("maintenance.resettingConfig"),
      onAction: () =>
        void runAction("resetConfig", async () => {
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
        void runAction("imageCompat", async () => {
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
