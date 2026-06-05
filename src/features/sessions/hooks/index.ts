import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { sessionsService } from "@/services/sessions";
import { SessionsCache } from "../cache";

export function useSessionsCacheController() {
  return useModuleCacheController(SessionsCache);
}

export function useSessionsModule() {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: [...SessionsCache.queryKeys.root, "list"],
    queryFn: () => sessionsService.loadSessions(),
    staleTime: 30_000,
  });

  const deleteSessionsMutation = useMutation({
    mutationFn: (ids: string[]) => sessionsService.deleteSessions(ids),
    onSuccess: (payload) => {
      SessionsCache.writeAuthoritativePayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: Date.now(),
        receivedAt: Date.now(),
      });
      void SessionsCache.invalidateContractQueries(queryClient);
      void queryClient.invalidateQueries({ queryKey: ["usage-analytics"] });
      void queryClient.invalidateQueries({ queryKey: ["analytics", "usage"] });
    },
  });

  return {
    sessionsQuery,
    deleteSessionsMutation,
  };
}
