/**
 * 中文职责说明：maintenance 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import { maintenanceService } from "@/services/maintenance";
import {
  invalidateMaintenanceContractQueries,
  MaintenanceCache,
  MAINTENANCE_IMAGE_COMPAT_QUERY_KEY,
} from "../cache";
import type {
  MaintenanceFixIssueInput,
  MaintenanceImageCompatInput,
} from "../types";

let maintenanceCacheSequence = 0;
let maintenanceLatestAcceptedSequence = 0;

function nextMaintenanceCacheSequence() {
  maintenanceCacheSequence += 1;
  return maintenanceCacheSequence;
}

async function writeMaintenanceMutationPayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
) {
  const sequence = nextMaintenanceCacheSequence();
  if (!writeMaintenanceCachePayload(queryClient, payload, "mutation-payload", sequence)) {
    return false;
  }
  await invalidateMaintenanceContractQueries(queryClient);
  return true;
}

function writeMaintenanceCachePayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
  source: "full-refresh" | "mutation-payload",
  sequence: number,
) {
  if (sequence < maintenanceLatestAcceptedSequence) {
    return false;
  }

  maintenanceLatestAcceptedSequence = sequence;
  MaintenanceCache.writeAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt: Date.now(),
  });
  return true;
}

async function runMaintenanceQuery<TPayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  load: () => Promise<TPayload>,
) {
  const sequence = nextMaintenanceCacheSequence();
  const payload = await load();
  const accepted = writeMaintenanceCachePayload(
    queryClient,
    payload,
    "full-refresh",
    sequence,
  );
  if (!accepted) {
    return queryClient.getQueryData<TPayload>(queryKey) ?? payload;
  }
  return payload;
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
  const systemInfoQueryKey = [...MaintenanceCache.queryKeys.root, "system-info"] as const;

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
    queryKey: systemInfoQueryKey,
    queryFn: () =>
      runMaintenanceQuery(queryClient, systemInfoQueryKey, () =>
        maintenanceService.getSystemInfo(),
      ),
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
    onMutate: () =>
      queryClient.cancelQueries({
        queryKey: MAINTENANCE_IMAGE_COMPAT_QUERY_KEY,
      }),
    onSuccess: async (result) => {
      queryClient.setQueryData(MAINTENANCE_IMAGE_COMPAT_QUERY_KEY, result);
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
      const diagnostics = await maintenanceService.runCodexRouterDiagnostics();
      await writeMaintenanceMutationPayload(queryClient, diagnostics);
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
