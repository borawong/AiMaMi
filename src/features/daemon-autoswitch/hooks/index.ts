import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import { DaemonAutoswitchCache } from "../cache";

export function useDaemonAutoswitchCacheController() {
  return useModuleCacheController(DaemonAutoswitchCache);
}

export function useDaemonAutoswitchModule() {
  const queryClient = useQueryClient();
  const writeDaemonPayload = (payload: unknown) => {
    DaemonAutoswitchCache.writeAuthoritativePayload(queryClient, {
      payload,
      source: "mutation-payload",
      sequence: Date.now(),
      receivedAt: Date.now(),
    });
    void DaemonAutoswitchCache.invalidateContractQueries(queryClient);
    void queryClient.invalidateQueries({ queryKey: ["accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["runtime-state", "display"] });
    void queryClient.invalidateQueries({ queryKey: ["quota-history"] });
  };

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
    onSuccess: writeDaemonPayload,
  });

  const dismissPendingMutation = useMutation({
    mutationFn: () => api.dismissPendingAutoSwitch(),
    onSuccess: writeDaemonPayload,
  });

  const confirmPendingMutation = useMutation({
    mutationFn: () => api.confirmPendingAutoSwitch(),
    onSuccess: writeDaemonPayload,
  });

  const confirmPendingAndRestartMutation = useMutation({
    mutationFn: () => api.confirmPendingAutoSwitchAndRestartCodex(),
    onSuccess: writeDaemonPayload,
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
    dismissPendingAction: {
      id: "dismiss-pending",
      labelKey: "daemonAutoswitch.dismissPending",
      run: () => dismissPendingMutation.mutateAsync(),
      isPending: dismissPendingMutation.isPending,
    },
    confirmPendingAction: {
      id: "confirm-pending",
      labelKey: "daemonAutoswitch.confirmPending",
      run: () => confirmPendingMutation.mutateAsync(),
      isPending: confirmPendingMutation.isPending,
    },
    confirmPendingAndRestartAction: {
      id: "confirm-pending-restart",
      labelKey: "daemonAutoswitch.confirmPendingRestart",
      run: () => confirmPendingAndRestartMutation.mutateAsync(),
      isPending: confirmPendingAndRestartMutation.isPending,
    },
  };
}
