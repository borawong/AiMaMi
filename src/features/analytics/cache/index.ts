/**
 * 中文职责说明：analytics 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/module-cache";
import type { AnalyticsRange } from "@/types";

export const AnalyticsCache = createModuleCacheOwner("analytics");
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
