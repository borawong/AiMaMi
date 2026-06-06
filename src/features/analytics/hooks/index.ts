import { useQuery } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { analyticsService } from "@/services/analytics";
import type { AnalyticsRange } from "@/types";
import { AnalyticsCache, AnalyticsDumpedQueryKeys } from "../cache";

export type AnalyticsPanelId =
  | "activity"
  | "sessions"
  | "token"
  | "tools"
  | "changes"
  | "quota";

export interface AnalyticsModuleOptions {
  activePanel?: AnalyticsPanelId;
  quotaAccountKey?: string | null;
  queriesEnabled?: boolean;
}

const ANALYTICS_QUERY_POLICY = {
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
  const activePanel = options.activePanel ?? "activity";
  const quotaAccountKey = options.quotaAccountKey?.trim() ?? "";
  const queriesEnabled = options.queriesEnabled ?? true;

  const usageQuery = useQuery({
    queryKey: AnalyticsDumpedQueryKeys.usage,
    queryFn: () => analyticsService.loadUsageAnalytics(),
    enabled: queriesEnabled && activePanel === "activity",
    staleTime: Infinity,
  });
  const sessionQuery = useQuery({
    queryKey: AnalyticsDumpedQueryKeys.sessions(range),
    queryFn: () => analyticsService.loadSessionAnalytics(range),
    enabled: queriesEnabled && activePanel === "sessions",
    ...ANALYTICS_QUERY_POLICY,
  });
  const tokenQuery = useQuery({
    queryKey: AnalyticsDumpedQueryKeys.tokens(range),
    queryFn: () => analyticsService.loadTokenAnalytics(range),
    enabled: queriesEnabled && activePanel === "token",
    ...ANALYTICS_QUERY_POLICY,
  });
  const toolQuery = useQuery({
    queryKey: AnalyticsDumpedQueryKeys.tools(range),
    queryFn: () => analyticsService.loadToolAnalytics(range),
    enabled: queriesEnabled && activePanel === "tools",
    ...ANALYTICS_QUERY_POLICY,
  });
  const changeQuery = useQuery({
    queryKey: AnalyticsDumpedQueryKeys.changes(range),
    queryFn: () => analyticsService.loadChangeAnalytics(range),
    enabled: queriesEnabled && activePanel === "changes",
    ...ANALYTICS_QUERY_POLICY,
  });
  const quotaQuery = useQuery({
    queryKey: AnalyticsDumpedQueryKeys.quota(quotaAccountKey),
    queryFn: () => analyticsService.loadQuotaHistory(quotaAccountKey),
    enabled: queriesEnabled && activePanel === "quota" && quotaAccountKey.length > 0,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
