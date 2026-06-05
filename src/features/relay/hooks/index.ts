import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import { RelayCache } from "../cache";

export function useRelayCacheController() {
  return useModuleCacheController(RelayCache);
}

export function useRelayModule() {
  const queryClient = useQueryClient();

  const stateQuery = useQuery({
    queryKey: [...RelayCache.queryKeys.root, "state"],
    queryFn: () => api.loadRelayState(),
    staleTime: 30_000,
  });
  const activeQuery = useQuery({
    queryKey: [...RelayCache.queryKeys.root, "active"],
    queryFn: () => api.getRelayActive(),
    staleTime: 30_000,
  });
  const proxyQuery = useQuery({
    queryKey: [...RelayCache.queryKeys.root, "proxy-status"],
    queryFn: () => api.getRelayProxyStatus(),
    staleTime: 30_000,
  });

  const diagnosticsMutation = useMutation({
    mutationFn: () => api.runCodexRouterDiagnostics(),
    onSuccess: (payload) => {
      RelayCache.writeAuthoritativePayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: Date.now(),
        receivedAt: Date.now(),
      });
      void RelayCache.invalidateContractQueries(queryClient);
    },
  });

  return {
    stateQuery,
    activeQuery,
    proxyQuery,
    diagnosticsAction: {
      id: "diagnostics",
      labelKey: "relay.runDiagnostics",
      run: () => diagnosticsMutation.mutateAsync(),
      isPending: diagnosticsMutation.isPending,
    },
  };
}
