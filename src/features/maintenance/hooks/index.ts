/**
 * 中文职责说明：maintenance 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import { MaintenanceCache } from "../cache";

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

  return {
    diagnoseMutation,
    cleanMutation,
    rebuildMutation,
    restartMutation,
  };
}
