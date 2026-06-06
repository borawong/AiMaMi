import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { accountsService } from "@/services/accounts";
import { analyticsService } from "@/services/analytics";
import { mcpService } from "@/services/mcp";
import { skillsService } from "@/services/skills";
import { systemService } from "@/services/system";
import { OverviewCache } from "../cache";

export function useOverviewCacheController() {
  return useModuleCacheController(OverviewCache);
}

export function useOverviewModule() {
  const queryClient = useQueryClient();

  const snapshotQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "snapshot"],
    queryFn: () => accountsService.loadSnapshot(true),
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
  const deviceIdQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "device-id"],
    queryFn: () => systemService.getDeviceId(),
    staleTime: Infinity,
  });
  const notificationStateQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "notification-client-state"],
    queryFn: () => systemService.getNotificationClientState(),
    staleTime: 30_000,
  });
  const mysteryUnlockGrantsQuery = useQuery({
    queryKey: [...OverviewCache.queryKeys.root, "mystery-unlock-grants"],
    queryFn: () => systemService.getMysteryUnlockGrants(),
    staleTime: 30_000,
  });

  const refreshUsageMutation = useMutation({
    mutationFn: () => accountsService.refreshUsageSnapshot(),
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
    mutationFn: () => systemService.focusMainWindow(),
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
