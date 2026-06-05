import { useQuery } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { analyticsService } from "@/services/analytics";
import type { AnalyticsRange } from "@/types";
import { AnalyticsCache } from "../cache";

export function useAnalyticsCacheController() {
  return useModuleCacheController(AnalyticsCache);
}

export function useAnalyticsModule(range: AnalyticsRange = "week") {
  const usageQuery = useQuery({
    queryKey: [...AnalyticsCache.queryKeys.root, "usage"],
    queryFn: () => analyticsService.loadUsageAnalytics(),
    staleTime: 30_000,
  });
  const sessionQuery = useQuery({
    queryKey: [...AnalyticsCache.queryKeys.root, "sessions", range],
    queryFn: () => analyticsService.loadSessionAnalytics(range),
    staleTime: 30_000,
  });
  const tokenQuery = useQuery({
    queryKey: [...AnalyticsCache.queryKeys.root, "tokens", range],
    queryFn: () => analyticsService.loadTokenAnalytics(range),
    staleTime: 30_000,
  });
  const toolQuery = useQuery({
    queryKey: [...AnalyticsCache.queryKeys.root, "tools", range],
    queryFn: () => analyticsService.loadToolAnalytics(range),
    staleTime: 30_000,
  });
  const changeQuery = useQuery({
    queryKey: [...AnalyticsCache.queryKeys.root, "changes", range],
    queryFn: () => analyticsService.loadChangeAnalytics(range),
    staleTime: 30_000,
  });

  return {
    usageQuery,
    sessionQuery,
    tokenQuery,
    toolQuery,
    changeQuery,
  };
}
