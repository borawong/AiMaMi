import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AnalyticsAuthoritativeQueryKeys,
  AnalyticsDumpedQueryKeys,
  writeAnalyticsPanelPayload,
} from "@/features/analytics/cache";
import { useModuleCacheController } from "@/features/_shared/controller";
import { analyticsService } from "@/services/analytics";
import { sessionsService } from "@/services/sessions";
import {
  SessionsAuthoritativeQueryKeys,
  SessionsCache,
  SessionsDumpedQueryKeys,
  nextSessionsCacheSequence,
  writeSessionsListPayload,
} from "../cache";
import type {
  SessionsCacheEnvelope,
  SessionsListEnvelope,
  SessionsPageQueries,
  SessionsUsageCacheEnvelope,
  SessionsUsageEnvelope,
} from "../types";

export function useSessionsCacheController() {
  return useModuleCacheController(SessionsCache);
}

export function useSessionsPageQueries(): SessionsPageQueries {
  const queryClient = useQueryClient();

  const sessionsEnvelopeQuery = useQuery<SessionsCacheEnvelope | null>({
    queryKey: SessionsAuthoritativeQueryKeys.sessions,
    queryFn: async () =>
      queryClient.getQueryData<SessionsCacheEnvelope>(
        SessionsAuthoritativeQueryKeys.sessions,
      ) ?? null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const usageEnvelopeQuery = useQuery<SessionsUsageCacheEnvelope | null>({
    queryKey: AnalyticsAuthoritativeQueryKeys.usage,
    queryFn: async () =>
      queryClient.getQueryData<SessionsUsageCacheEnvelope>(
        AnalyticsAuthoritativeQueryKeys.usage,
      ) ?? null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const sessionsQuery = useQuery<SessionsListEnvelope>({
    queryKey: SessionsDumpedQueryKeys.sessions,
    queryFn: async () => {
      const sequence = nextSessionsCacheSequence();
      const payload = await sessionsService.loadSessions();
      writeSessionsListPayload(queryClient, {
        payload,
        source: "full-refresh",
        sequence,
        receivedAt: Date.now(),
      });
      return payload;
    },
    staleTime: 30_000,
  });

  const usageQuery = useQuery<SessionsUsageEnvelope>({
    queryKey: AnalyticsDumpedQueryKeys.usage,
    queryFn: async () => {
      const sequence = nextSessionsCacheSequence();
      const payload = await analyticsService.loadUsageAnalytics();
      writeAnalyticsPanelPayload(queryClient, AnalyticsAuthoritativeQueryKeys.usage, {
        payload,
        source: "full-refresh",
        sequence,
        receivedAt: Date.now(),
      });
      return payload;
    },
    staleTime: Infinity,
  });

  return {
    sessionsEnvelope: sessionsEnvelopeQuery.data,
    usageEnvelope: usageEnvelopeQuery.data,
    sessionsQuery,
    usageQuery,
    refreshSessions: async () => {
      await sessionsQuery.refetch();
    },
    refreshUsage: async () => {
      await usageQuery.refetch();
    },
  };
}
