/**
 * 中文职责说明：maintenance 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import { maintenanceService } from "@/services/maintenance";
import { MaintenanceCache } from "../cache";
import type {
  MaintenanceFixIssueInput,
  MaintenanceImageCompatInput,
} from "../types";

let maintenanceCacheSequence = 0;

function nextMaintenanceCacheSequence() {
  maintenanceCacheSequence += 1;
  return maintenanceCacheSequence;
}

async function writeMaintenanceMutationPayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
) {
  MaintenanceCache.writeAuthoritativePayload(queryClient, {
    payload,
    source: "mutation-payload",
    sequence: nextMaintenanceCacheSequence(),
    receivedAt: Date.now(),
  });
  await MaintenanceCache.invalidateContractQueries(queryClient);
}

export function useMaintenanceCacheController() {
  return useModuleCacheController(MaintenanceCache);
}

export function useMaintenanceActionMutations(options: {
  onDiagnosed: (result: Awaited<ReturnType<typeof api.diagnose>>) => void;
  onDiagnoseError: (error: unknown) => void;
  onCleaned: (result: Awaited<ReturnType<typeof api.clean>>) => void;
  onCleanError: (error: unknown) => void;
  onRebuilt: (result: Awaited<ReturnType<typeof api.rebuildRegistry>>) => void;
  onRebuildError: (error: unknown) => void;
  onRestarted: () => void;
  onRestartError: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const imageCompatQueryKey = [...MaintenanceCache.queryKeys.root, "image-compat"] as const;

  const imageCompatQuery = useQuery({
    queryKey: imageCompatQueryKey,
    queryFn: () => maintenanceService.getImageCompat(),
    staleTime: 30_000,
  });
  const systemInfoQuery = useQuery({
    queryKey: [...MaintenanceCache.queryKeys.root, "system-info"],
    queryFn: () => maintenanceService.getSystemInfo(),
    staleTime: 30_000,
  });

  const diagnoseMutation = useMutation({
    mutationFn: () => api.diagnose(),
    onSuccess: async (result) => {
      await writeMaintenanceMutationPayload(queryClient, result);
      options.onDiagnosed(result);
    },
    onError: options.onDiagnoseError,
  });

  const cleanMutation = useMutation({
    mutationFn: () => api.clean(),
    onSuccess: async (result) => {
      await writeMaintenanceMutationPayload(queryClient, result);
      options.onCleaned(result);
    },
    onError: options.onCleanError,
  });

  const rebuildMutation = useMutation({
    mutationFn: () => api.rebuildRegistry(),
    onSuccess: async (result) => {
      await writeMaintenanceMutationPayload(queryClient, result);
      options.onRebuilt(result);
    },
    onError: options.onRebuildError,
  });

  const restartMutation = useMutation({
    mutationFn: () => api.restartCodex(),
    onSuccess: async (result) => {
      await writeMaintenanceMutationPayload(queryClient, result);
      options.onRestarted();
    },
    onError: options.onRestartError,
  });

  const forceKillMutation = useMutation({
    mutationFn: () => maintenanceService.forceKillCodex(),
    onSuccess: async (result) => {
      await writeMaintenanceMutationPayload(queryClient, result);
    },
  });

  const resetConfigMutation = useMutation({
    mutationFn: () => maintenanceService.resetCodexConfig(),
    onSuccess: async (result) => {
      await writeMaintenanceMutationPayload(queryClient, result);
    },
  });

  const setImageCompatMutation = useMutation({
    mutationFn: ({ enabled }: MaintenanceImageCompatInput) =>
      maintenanceService.setImageCompat(enabled),
    onSuccess: async (result) => {
      queryClient.setQueryData(imageCompatQueryKey, result);
      await writeMaintenanceMutationPayload(queryClient, result);
    },
  });

  const routerDiagnosticsMutation = useMutation({
    mutationFn: () => maintenanceService.runCodexRouterDiagnostics(),
    onSuccess: async (result) => {
      await writeMaintenanceMutationPayload(queryClient, result);
    },
  });

  const fixRouterIssueMutation = useMutation({
    mutationFn: ({ itemId }: MaintenanceFixIssueInput) =>
      maintenanceService.fixCodexRouterIssue(itemId),
    onSuccess: async (result) => {
      await writeMaintenanceMutationPayload(queryClient, result);
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
  };
}
