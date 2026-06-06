import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ModuleCacheEnvelope } from "@/features/_shared/module-cache";
import {
  AnalyticsAuthoritativeQueryKeys,
  AnalyticsDumpedQueryKeys,
  fenceAnalyticsPanelPayload,
  writeAnalyticsPanelPayload,
} from "@/features/analytics/cache";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { analyticsService } from "@/services/analytics";
import { sessionsService } from "@/services/sessions";
import {
  SessionsAuthoritativeQueryKeys,
  SessionsCache,
  SessionsDumpedQueryKeys,
  invalidateSessionsDumpedQueries,
  writeSessionsListPayload,
  writeSessionsMutationPayload,
} from "../cache";

export function useSessionsCacheController() {
  return useModuleCacheController(SessionsCache);
}

export function useSessionsModule() {
  const queryClient = useQueryClient();
  const sequenceRef = useRef(0);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const nextSequence = () => ++sequenceRef.current;

  const sessionsEnvelopeQuery = useQuery<ModuleCacheEnvelope<unknown> | null>({
    queryKey: SessionsAuthoritativeQueryKeys.sessions,
    queryFn: async () =>
      queryClient.getQueryData<ModuleCacheEnvelope<unknown>>(
        SessionsAuthoritativeQueryKeys.sessions,
      ) ?? null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const usageEnvelopeQuery = useQuery<ModuleCacheEnvelope<unknown> | null>({
    queryKey: AnalyticsAuthoritativeQueryKeys.usage,
    queryFn: async () =>
      queryClient.getQueryData<ModuleCacheEnvelope<unknown>>(
        AnalyticsAuthoritativeQueryKeys.usage,
      ) ?? null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const sessionsQuery = useQuery({
    queryKey: SessionsDumpedQueryKeys.sessions,
    queryFn: async () => {
      const sequence = nextSequence();
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

  const usageQuery = useQuery({
    queryKey: AnalyticsDumpedQueryKeys.usage,
    queryFn: async () => {
      const sequence = nextSequence();
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

  const deleteSessionsMutation = useMutation({
    mutationFn: (ids: string[]) => sessionsService.deleteSessions(ids),
    onSuccess: (payload) => {
      const mutationEnvelope = writeSessionsMutationPayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: nextSequence(),
        receivedAt: Date.now(),
      });
      fenceAnalyticsPanelPayload(
        queryClient,
        AnalyticsAuthoritativeQueryKeys.usage,
        mutationEnvelope,
      );
      void invalidateSessionsDumpedQueries(queryClient);
    },
  });

  const refreshSessions = () => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = Promise.all([
        sessionsQuery.refetch(),
        usageQuery.refetch(),
      ])
        .then(() => undefined)
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }
    return refreshPromiseRef.current;
  };

  return {
    sessionsEnvelope: sessionsEnvelopeQuery.data,
    usageEnvelope: usageEnvelopeQuery.data,
    sessionsQuery,
    usageQuery,
    refreshAction: {
      run: refreshSessions,
      isPending: sessionsQuery.isFetching || usageQuery.isFetching,
    },
    deleteSessions: {
      run: (ids: string[]) => deleteSessionsMutation.mutateAsync(ids),
      isPending: deleteSessionsMutation.isPending,
    },
  };
}
