import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import { OverviewCache } from "../cache";

export function useOverviewCacheController() {
  return useModuleCacheController(OverviewCache);
}

export function useOverviewModule() {
  const queryClient = useQueryClient();

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
  const deviceIdQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "device-id"],
    queryFn: () => api.getDeviceId(),
    staleTime: Infinity,
  });
  const notificationStateQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "notification-client-state"],
    queryFn: () => api.getNotificationClientState(),
    staleTime: 30_000,
  });
  const mysteryUnlockGrantsQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "mystery-unlock-grants"],
    queryFn: () => api.getMysteryUnlockGrants(),
    staleTime: 30_000,
  });

  const refreshUsageMutation = useMutation({
    mutationFn: () => api.refreshUsageSnapshot(),
    onSuccess: (payload) => {
      OverviewCache.writeAuthoritativePayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: Date.now(),
        receivedAt: Date.now(),
      });
      void OverviewCache.invalidateContractQueries(queryClient);
      void queryClient.invalidateQueries({ queryKey: ["usage-analytics"] });
      void queryClient.invalidateQueries({ queryKey: ["analytics", "usage"] });
    },
  });
  const focusMainWindowMutation = useMutation({
    mutationFn: () => api.focusMainWindow(),
  });

  const refreshUsageAction = {
    id: "refresh-usage-snapshot",
    labelKey: "common.refresh",
    isPending: refreshUsageMutation.isPending,
    run: () => refreshUsageMutation.mutateAsync(),
  };
  const focusMainWindowAction = {
    id: "focus-main-window",
    labelKey: "overview.focusMainWindow",
    isPending: focusMainWindowMutation.isPending,
    run: () => focusMainWindowMutation.mutateAsync(),
  };

  return {
    snapshotQuery,
    usageQuery,
    mcpQuery,
    skillsQuery,
    deviceIdQuery,
    notificationStateQuery,
    mysteryUnlockGrantsQuery,
    refreshUsageMutation,
    refreshUsageAction,
    focusMainWindowAction,
  };
}
