/**
 * 中文职责说明：maintenance 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useCallback } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
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
  MaintenanceFixIssueInput,
  MaintenanceImageCompatInput,
} from "../types";

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
