import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import { AccountsCache } from "../cache";

export function useAccountsCacheController() {
  return useModuleCacheController(AccountsCache);
}

export function useAccountsModule() {
  const queryClient = useQueryClient();

  const snapshotQuery = useQuery({
    queryKey: [...AccountsCache.queryKeys.root, "snapshot"],
    queryFn: () => api.loadSnapshot(true),
    staleTime: 30_000,
  });

  const attachMonitorMutation = useMutation({
    mutationFn: () => api.beginAddAccountAttachMonitor(),
    onSuccess: (payload) => {
      AccountsCache.writeAuthoritativePayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: Date.now(),
        receivedAt: Date.now(),
      });
      void AccountsCache.invalidateContractQueries(queryClient);
    },
  });

  return {
    snapshotQuery,
    attachMonitorAction: {
      id: "attach-monitor",
      labelKey: "accounts.beginAttachMonitor",
      run: () => attachMonitorMutation.mutateAsync(),
      isPending: attachMonitorMutation.isPending,
    },
  };
}
