import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { daemonAutoswitchService } from "@/services/daemon-autoswitch";
import { DaemonAutoswitchCache } from "../cache";

export function useDaemonAutoswitchCacheController() {
  return useModuleCacheController(DaemonAutoswitchCache);
}

export function useDaemonAutoswitchModule() {
  const queryClient = useQueryClient();

  const bootstrapQuery = useQuery({
    queryKey: [...DaemonAutoswitchCache.queryKeys.root, "bootstrap"],
    queryFn: () => daemonAutoswitchService.loadBootstrapState(),
    staleTime: 30_000,
  });
  const pendingQuery = useQuery({
    queryKey: [...DaemonAutoswitchCache.queryKeys.root, "pending"],
    queryFn: () => daemonAutoswitchService.loadPendingAutoSwitch(),
    staleTime: 30_000,
  });

  const runOnceMutation = useMutation({
    mutationFn: () => daemonAutoswitchService.runDaemonOnce(),
    onSuccess: (payload) => {
      DaemonAutoswitchCache.writeAuthoritativePayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: Date.now(),
        receivedAt: Date.now(),
      });
      void DaemonAutoswitchCache.invalidateContractQueries(queryClient);
    },
  });

  return {
    bootstrapQuery,
    pendingQuery,
    runOnceAction: {
      id: "run-once",
      labelKey: "daemonAutoswitch.runOnce",
      run: () => runOnceMutation.mutateAsync(),
      isPending: runOnceMutation.isPending,
    },
  };
}
