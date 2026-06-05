import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import { DaemonAutoswitchCache } from "../cache";

export function useDaemonAutoswitchCacheController() {
  return useModuleCacheController(DaemonAutoswitchCache);
}

export function useDaemonAutoswitchModule() {
  const queryClient = useQueryClient();

  const bootstrapQuery = useQuery({
    queryKey: [...DaemonAutoswitchCache.queryKeys.root, "bootstrap"],
    queryFn: () => api.loadBootstrapState(),
    staleTime: 30_000,
  });
  const pendingQuery = useQuery({
    queryKey: [...DaemonAutoswitchCache.queryKeys.root, "pending"],
    queryFn: () => api.loadPendingAutoSwitch(),
    staleTime: 30_000,
  });

  const runOnceMutation = useMutation({
    mutationFn: () => api.runDaemonOnce(),
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
