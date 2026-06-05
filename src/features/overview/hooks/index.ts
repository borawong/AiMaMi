import { useQuery } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import { OverviewCache } from "../cache";

export function useOverviewCacheController() {
  return useModuleCacheController(OverviewCache);
}

export function useOverviewModule() {
  const snapshotQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "snapshot"],
    queryFn: () => api.loadSnapshot(true),
    staleTime: 30_000,
  });
  const usageQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "usage"],
    queryFn: () => api.loadUsageAnalytics(),
    staleTime: 30_000,
  });
  const mcpQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "mcp"],
    queryFn: () => api.loadMcpServers(),
    staleTime: 30_000,
  });
  const skillsQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "skills"],
    queryFn: () => api.loadInstalledSkills(),
    staleTime: 30_000,
  });

  return {
    snapshotQuery,
    usageQuery,
    mcpQuery,
    skillsQuery,
  };
}
