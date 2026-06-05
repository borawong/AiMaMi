import { useQuery } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { analyticsService } from "@/services/analytics";
import { mcpService } from "@/services/mcp";
import { skillsService } from "@/services/skills";
import { systemService } from "@/services/system";
import { OverviewCache } from "../cache";

export function useOverviewCacheController() {
  return useModuleCacheController(OverviewCache);
}

export function useOverviewModule() {
  const snapshotQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "snapshot"],
    queryFn: () => systemService.loadSnapshot(true),
    staleTime: 30_000,
  });
  const usageQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "usage"],
    queryFn: () => analyticsService.loadUsageAnalytics(),
    staleTime: 30_000,
  });
  const mcpQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "mcp"],
    queryFn: () => mcpService.loadServers(),
    staleTime: 30_000,
  });
  const skillsQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "skills"],
    queryFn: () => skillsService.loadInstalled(),
    staleTime: 30_000,
  });

  return {
    snapshotQuery,
    usageQuery,
    mcpQuery,
    skillsQuery,
  };
}
