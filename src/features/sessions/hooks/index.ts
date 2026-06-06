import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { analyticsService } from "@/services/analytics";
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
    queryFn: () => sessionsService.loadSessions(),
    staleTime: 30_000,
  });

  const sessionAnalyticsQuery = useQuery({
    queryKey: [...SessionsCache.queryKeys.root, "analytics", "week"],
    queryFn: () => sessionsService.loadSessionAnalytics("week"),
    staleTime: 30_000,
  });

  const usageQuery = useQuery({
    queryKey: [...SessionsCache.queryKeys.root, "usage"],
    queryFn: () => analyticsService.loadUsageAnalytics(),
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
    sessionAnalyticsQuery,
    usageQuery,
    deleteSessionsMutation,
    importSessionMutation,
  };
}
