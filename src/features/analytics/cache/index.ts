import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type { ModuleCacheEnvelope, ModuleCacheSource } from "@/features/_shared/cache";
import type { AnalyticsRange } from "@/types";
import type { AnalyticsCachePayload } from "../types";

export const AnalyticsCache = createModuleCacheOwner<AnalyticsCachePayload>("analytics");
export const AnalyticsQueryKeys = AnalyticsCache.queryKeys;
export const writeAnalyticsAuthoritativePayload = AnalyticsCache.writeAuthoritativePayload;
export const invalidateAnalyticsContractQueries = AnalyticsCache.invalidateContractQueries;

export const AnalyticsDumpedQueryKeys = {
  usage: ["usage-analytics"] as const,
  sessions: (range: AnalyticsRange) => ["session-analytics", range] as const,
  tokens: (range: AnalyticsRange) => ["token-analytics", range] as const,
  tools: (range: AnalyticsRange) => ["tool-analytics", range] as const,
  changes: (range: AnalyticsRange) => ["change-analytics", range] as const,
  quota: (accountKey: string | null | undefined) =>
    ["quota-history", accountKey?.trim() || "none"] as const,
};

export const AnalyticsAuthoritativeQueryKeys = {
  usage: ["analytics", "usage-analytics", "authoritative"] as const,
  sessions: (range: AnalyticsRange) =>
    ["analytics", "session-analytics", range, "authoritative"] as const,
  tokens: (range: AnalyticsRange) =>
    ["analytics", "token-analytics", range, "authoritative"] as const,
  tools: (range: AnalyticsRange) =>
    ["analytics", "tool-analytics", range, "authoritative"] as const,
  changes: (range: AnalyticsRange) =>
    ["analytics", "change-analytics", range, "authoritative"] as const,
  quota: (accountKey: string | null | undefined) =>
    ["analytics", "quota-history", accountKey?.trim() || "none", "authoritative"] as const,
};

export interface AnalyticsPanelCacheWrite<TPayload> {
  payload: TPayload;
  source: ModuleCacheSource;
  sequence: number;
  receivedAt: number;
}

export function writeAnalyticsPanelPayload<TPayload extends AnalyticsCachePayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  write: AnalyticsPanelCacheWrite<TPayload>,
) {
  const next: ModuleCacheEnvelope<TPayload> = {
    moduleId: "analytics",
    ...write,
    mutationFenceAt: write.source === "mutation-payload" ? write.receivedAt : undefined,
  };

  queryClient.setQueryData<ModuleCacheEnvelope<AnalyticsCachePayload>>(
    queryKey,
    (current) => {
      if (isStaleEnvelope(current, next)) return current;
      return {
        ...next,
        mutationFenceAt: next.mutationFenceAt ?? current?.mutationFenceAt,
      };
    },
  );

  return next;
}

export function fenceAnalyticsPanelPayload<TPayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  mutationEnvelope: ModuleCacheEnvelope<TPayload>,
) {
  queryClient.setQueryData<ModuleCacheEnvelope<AnalyticsCachePayload>>(queryKey, (current) => {
    if (!current) {
      return {
        ...mutationEnvelope,
        payload: null,
      };
    }
    return {
      ...current,
      sequence: Math.max(current.sequence, mutationEnvelope.sequence),
      mutationFenceAt: mutationEnvelope.receivedAt,
    };
  });
}

function isStaleEnvelope(
  current: ModuleCacheEnvelope<AnalyticsCachePayload> | undefined,
  next: ModuleCacheEnvelope<AnalyticsCachePayload>,
) {
  if (!current) return false;
  if (next.sequence < current.sequence) return true;
  if (
    current.mutationFenceAt &&
    next.source !== "mutation-payload" &&
    next.receivedAt < current.mutationFenceAt
  ) {
    return true;
  }
  return next.source === "replay" && next.receivedAt <= current.receivedAt;
}
