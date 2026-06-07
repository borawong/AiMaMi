import { useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { analyticsService } from "@/services/analytics";
import type { AnalyticsRange } from "@/types";
import {
  AnalyticsAuthoritativeQueryKeys,
  AnalyticsCache,
  AnalyticsDumpedQueryKeys,
  writeAnalyticsPanelPayload,
} from "../cache";
import type {
  AnalyticsCacheEnvelope,
  AnalyticsChangeEnvelope,
  AnalyticsModuleOptions,
  AnalyticsQuotaEnvelope,
  AnalyticsSessionEnvelope,
  AnalyticsTokenEnvelope,
  AnalyticsToolEnvelope,
  AnalyticsUsageEnvelope,
} from "../types";

export const ANALYTICS_QUERY_POLICY = {
  staleTime: 5 * 60_000,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
} as const;

export function useAnalyticsCacheController() {
  return useModuleCacheController(AnalyticsCache);
}

export function useAnalyticsModule(
  range: AnalyticsRange = "week",
  options: AnalyticsModuleOptions = {},
) {
  const queryClient = useQueryClient();
  const sequenceRef = useRef(0);
  const nextSequence = () => ++sequenceRef.current;
  const activePanel = options.activePanel ?? "activity";
  const quotaAccountKey = options.quotaAccountKey?.trim() ?? "";
  const queriesEnabled = options.queriesEnabled ?? true;
  const sessionStateKey = AnalyticsAuthoritativeQueryKeys.sessions(range);
  const tokenStateKey = AnalyticsAuthoritativeQueryKeys.tokens(range);
  const toolStateKey = AnalyticsAuthoritativeQueryKeys.tools(range);
  const changeStateKey = AnalyticsAuthoritativeQueryKeys.changes(range);
  const quotaStateKey = AnalyticsAuthoritativeQueryKeys.quota(quotaAccountKey);

  const usageEnvelopeQuery = useQuery<AnalyticsCacheEnvelope<AnalyticsUsageEnvelope> | null>({
    queryKey: AnalyticsAuthoritativeQueryKeys.usage,
    queryFn: async () =>
      queryClient.getQueryData<AnalyticsCacheEnvelope<AnalyticsUsageEnvelope>>(
        AnalyticsAuthoritativeQueryKeys.usage,
      ) ?? null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const sessionEnvelopeQuery = useQuery<AnalyticsCacheEnvelope<AnalyticsSessionEnvelope> | null>({
    queryKey: sessionStateKey,
    queryFn: async () =>
      queryClient.getQueryData<AnalyticsCacheEnvelope<AnalyticsSessionEnvelope>>(
        sessionStateKey,
      ) ?? null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const tokenEnvelopeQuery = useQuery<AnalyticsCacheEnvelope<AnalyticsTokenEnvelope> | null>({
    queryKey: tokenStateKey,
    queryFn: async () =>
      queryClient.getQueryData<AnalyticsCacheEnvelope<AnalyticsTokenEnvelope>>(
        tokenStateKey,
      ) ?? null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const toolEnvelopeQuery = useQuery<AnalyticsCacheEnvelope<AnalyticsToolEnvelope> | null>({
    queryKey: toolStateKey,
    queryFn: async () =>
      queryClient.getQueryData<AnalyticsCacheEnvelope<AnalyticsToolEnvelope>>(toolStateKey) ??
      null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const changeEnvelopeQuery = useQuery<AnalyticsCacheEnvelope<AnalyticsChangeEnvelope> | null>({
    queryKey: changeStateKey,
    queryFn: async () =>
      queryClient.getQueryData<AnalyticsCacheEnvelope<AnalyticsChangeEnvelope>>(
        changeStateKey,
      ) ?? null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const quotaEnvelopeQuery = useQuery<AnalyticsCacheEnvelope<AnalyticsQuotaEnvelope> | null>({
    queryKey: quotaStateKey,
    queryFn: async () =>
      queryClient.getQueryData<AnalyticsCacheEnvelope<AnalyticsQuotaEnvelope>>(quotaStateKey) ??
      null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
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
    enabled: queriesEnabled && activePanel === "activity",
    staleTime: Infinity,
  });
  const sessionQuery = useQuery({
    queryKey: AnalyticsDumpedQueryKeys.sessions(range),
    queryFn: async () => {
      const sequence = nextSequence();
      const payload = await analyticsService.loadSessionAnalytics(range);
      writeAnalyticsPanelPayload(queryClient, sessionStateKey, {
        payload,
        source: "full-refresh",
        sequence,
        receivedAt: Date.now(),
      });
      return payload;
    },
    enabled: queriesEnabled && activePanel === "sessions",
    ...ANALYTICS_QUERY_POLICY,
  });
  const tokenQuery = useQuery({
    queryKey: AnalyticsDumpedQueryKeys.tokens(range),
    queryFn: async () => {
      const sequence = nextSequence();
      const payload = await analyticsService.loadTokenAnalytics(range);
      writeAnalyticsPanelPayload(queryClient, tokenStateKey, {
        payload,
        source: "full-refresh",
        sequence,
        receivedAt: Date.now(),
      });
      return payload;
    },
    enabled: queriesEnabled && activePanel === "token",
    ...ANALYTICS_QUERY_POLICY,
  });
  const toolQuery = useQuery({
    queryKey: AnalyticsDumpedQueryKeys.tools(range),
    queryFn: async () => {
      const sequence = nextSequence();
      const payload = await analyticsService.loadToolAnalytics(range);
      writeAnalyticsPanelPayload(queryClient, toolStateKey, {
        payload,
        source: "full-refresh",
        sequence,
        receivedAt: Date.now(),
      });
      return payload;
    },
    enabled: queriesEnabled && activePanel === "tools",
    ...ANALYTICS_QUERY_POLICY,
  });
  const changeQuery = useQuery({
    queryKey: AnalyticsDumpedQueryKeys.changes(range),
    queryFn: async () => {
      const sequence = nextSequence();
      const payload = await analyticsService.loadChangeAnalytics(range);
      writeAnalyticsPanelPayload(queryClient, changeStateKey, {
        payload,
        source: "full-refresh",
        sequence,
        receivedAt: Date.now(),
      });
      return payload;
    },
    enabled: queriesEnabled && activePanel === "changes",
    ...ANALYTICS_QUERY_POLICY,
  });
  const quotaQuery = useQuery({
    queryKey: AnalyticsDumpedQueryKeys.quota(quotaAccountKey),
    queryFn: async () => {
      const sequence = nextSequence();
      const payload = await analyticsService.loadQuotaHistory(quotaAccountKey);
      writeAnalyticsPanelPayload(queryClient, quotaStateKey, {
        payload,
        source: "full-refresh",
        sequence,
        receivedAt: Date.now(),
      });
      return payload;
    },
    enabled: queriesEnabled && activePanel === "quota" && quotaAccountKey.length > 0,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    activePanel,
    usageEnvelope: usageEnvelopeQuery.data,
    sessionEnvelope: sessionEnvelopeQuery.data,
    tokenEnvelope: tokenEnvelopeQuery.data,
    toolEnvelope: toolEnvelopeQuery.data,
    changeEnvelope: changeEnvelopeQuery.data,
    quotaEnvelope: quotaEnvelopeQuery.data,
    usageQuery,
    sessionQuery,
    tokenQuery,
    toolQuery,
    changeQuery,
    quotaQuery,
  };
}
