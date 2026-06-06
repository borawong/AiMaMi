import { useQuery } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import type { AnalyticsRange } from "@/types";
import { AnalyticsCache } from "../cache";

export type AnalyticsPanelId =
  | "usage"
  | "sessions"
  | "tokens"
  | "tools"
  | "changes"
  | "quota";

export interface AnalyticsModuleOptions {
  activePanel?: AnalyticsPanelId;
  quotaAccountKey?: string | null;
}

const ANALYTICS_QUERY_POLICY = {
  staleTime: 30_000,
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
  const activePanel = options.activePanel ?? "usage";
  const quotaAccountKey = options.quotaAccountKey?.trim() ?? "";

  const usageQuery = useQuery({
    queryKey: [...AnalyticsCache.queryKeys.root, "usage"],
    queryFn: () => api.loadUsageAnalytics(),
    enabled: activePanel === "usage",
    ...ANALYTICS_QUERY_POLICY,
  });
  const sessionQuery = useQuery({
    queryKey: [...AnalyticsCache.queryKeys.root, "sessions", range],
    queryFn: () => api.loadSessionAnalytics(range),
    enabled: activePanel === "sessions",
    ...ANALYTICS_QUERY_POLICY,
  });
  const tokenQuery = useQuery({
    queryKey: [...AnalyticsCache.queryKeys.root, "tokens", range],
    queryFn: () => api.loadTokenAnalytics(range),
    enabled: activePanel === "tokens",
    ...ANALYTICS_QUERY_POLICY,
  });
  const toolQuery = useQuery({
    queryKey: [...AnalyticsCache.queryKeys.root, "tools", range],
    queryFn: () => api.loadToolAnalytics(range),
    enabled: activePanel === "tools",
    ...ANALYTICS_QUERY_POLICY,
  });
  const changeQuery = useQuery({
    queryKey: [...AnalyticsCache.queryKeys.root, "changes", range],
    queryFn: () => api.loadChangeAnalytics(range),
    enabled: activePanel === "changes",
    ...ANALYTICS_QUERY_POLICY,
  });
  const quotaQuery = useQuery({
    queryKey: [...AnalyticsCache.queryKeys.root, "quota-history", quotaAccountKey],
    queryFn: () => api.loadQuotaHistory(quotaAccountKey),
    enabled: activePanel === "quota" && quotaAccountKey.length > 0,
    ...ANALYTICS_QUERY_POLICY,
  });

  return {
    activePanel,
    usageQuery,
    sessionQuery,
    tokenQuery,
    toolQuery,
    changeQuery,
    quotaQuery,
  };
}
