import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import {
  sessionsService,
  type ImportChatGptSessionAccountInput,
} from "@/services/sessions";
import { SessionsCache } from "../cache";

export function useSessionsCacheController() {
  return useModuleCacheController(SessionsCache);
}

export function useSessionsModule() {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: [...SessionsCache.queryKeys.root, "list"],
    queryFn: () => api.loadSessions(),
    staleTime: 30_000,
  });

  const usageQuery = useQuery({
    queryKey: [...SessionsCache.queryKeys.root, "usage"],
    queryFn: () => api.loadUsageAnalytics(),
    staleTime: 30_000,
  });

  const deleteSessionsMutation = useMutation({
    mutationFn: (ids: string[]) => api.deleteSessions(ids),
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

  const importSessionMutation = useMutation({
    mutationFn: (input: ImportChatGptSessionAccountInput) =>
      sessionsService.importChatGptSessionAccount(input),
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
    usageQuery,
    deleteSessionsMutation,
    importSessionMutation,
  };
}
