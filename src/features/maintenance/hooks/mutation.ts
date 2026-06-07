import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { maintenanceService } from "@/services/maintenance";
import {
  invalidateMaintenanceContractQueries,
  MAINTENANCE_IMAGE_COMPAT_QUERY_KEY,
  prepareMaintenanceMutation,
  writeMaintenanceActionPayload,
  writeMaintenanceMutationPayload,
} from "../cache";
import type {
  MaintenanceActionMutationCallbacks,
  MaintenanceFixIssueInput,
  MaintenanceImageCompatInput,
} from "../types";

export function useMaintenanceActionMutations(
  options: MaintenanceActionMutationCallbacks,
) {
  const queryClient = useQueryClient();

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
    onSuccess: async () => {
      await invalidateMaintenanceContractQueries(queryClient);
      options.onRestarted();
    },
    onError: options.onRestartError,
  });

  const forceKillMutation = useMutation({
    mutationFn: () => maintenanceService.forceKillCodex(),
    onSuccess: async () => {
      await invalidateMaintenanceContractQueries(queryClient);
    },
  });

  const resetConfigMutation = useMutation({
    mutationFn: () => maintenanceService.resetCodexConfig(),
    onSuccess: async () => {
      await invalidateMaintenanceContractQueries(queryClient);
    },
  });

  const setImageCompatMutation = useMutation({
    mutationFn: ({ enabled }: MaintenanceImageCompatInput) =>
      maintenanceService.setImageCompat(enabled),
    onMutate: () =>
      prepareMaintenanceMutation(queryClient, MAINTENANCE_IMAGE_COMPAT_QUERY_KEY),
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
    onSuccess: async () => {
      await invalidateMaintenanceContractQueries(queryClient);
    },
  });

  return {
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
