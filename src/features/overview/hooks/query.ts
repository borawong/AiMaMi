import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { accountsService } from "@/services/accounts";
import { analyticsService } from "@/services/analytics";
import { mcpService } from "@/services/mcp";
import { skillsService } from "@/services/skills";
import { systemService } from "@/services/system";
import {
  OVERVIEW_DEVICE_ID_QUERY_KEY,
  OVERVIEW_MCP_QUERY_KEY,
  OVERVIEW_MYSTERY_GRANTS_QUERY_KEY,
  OVERVIEW_NOTIFICATION_STATE_QUERY_KEY,
  OVERVIEW_SKILLS_QUERY_KEY,
  OVERVIEW_SNAPSHOT_QUERY_KEY,
  OVERVIEW_USAGE_QUERY_KEY,
  OverviewCache,
  runOverviewQuery,
} from "../cache";
import type { OverviewQueryController } from "../types";

export function useOverviewCacheController() {
  return useModuleCacheController(OverviewCache);
}

export function useOverviewPageQueries(): OverviewQueryController {
  const queryClient = useQueryClient();

  const snapshotQuery = useQuery({
    queryKey: OVERVIEW_SNAPSHOT_QUERY_KEY,
    queryFn: () =>
      runOverviewQuery(queryClient, OVERVIEW_SNAPSHOT_QUERY_KEY, () =>
        accountsService.loadSnapshot(true),
      ),
    staleTime: 30_000,
  });
  const usageQuery = useQuery({
    queryKey: OVERVIEW_USAGE_QUERY_KEY,
    queryFn: () =>
      runOverviewQuery(queryClient, OVERVIEW_USAGE_QUERY_KEY, () =>
        analyticsService.loadUsageAnalytics(),
      ),
    staleTime: 30_000,
  });
  const mcpQuery = useQuery({
    queryKey: OVERVIEW_MCP_QUERY_KEY,
    queryFn: () =>
      runOverviewQuery(queryClient, OVERVIEW_MCP_QUERY_KEY, () =>
        mcpService.loadServers(),
      ),
    staleTime: 30_000,
  });
  const skillsQuery = useQuery({
    queryKey: OVERVIEW_SKILLS_QUERY_KEY,
    queryFn: () =>
      runOverviewQuery(queryClient, OVERVIEW_SKILLS_QUERY_KEY, () =>
        skillsService.loadInstalled(),
      ),
    staleTime: 30_000,
  });
  const deviceIdQuery = useQuery({
    queryKey: OVERVIEW_DEVICE_ID_QUERY_KEY,
    queryFn: () => systemService.getDeviceId(),
    staleTime: Infinity,
  });
  const notificationStateQuery = useQuery({
    queryKey: OVERVIEW_NOTIFICATION_STATE_QUERY_KEY,
    queryFn: () =>
      runOverviewQuery(
        queryClient,
        OVERVIEW_NOTIFICATION_STATE_QUERY_KEY,
        () => systemService.getNotificationClientState(),
      ),
    staleTime: 30_000,
  });
  const mysteryUnlockGrantsQuery = useQuery({
    queryKey: OVERVIEW_MYSTERY_GRANTS_QUERY_KEY,
    queryFn: () =>
      runOverviewQuery(queryClient, OVERVIEW_MYSTERY_GRANTS_QUERY_KEY, () =>
        systemService.getMysteryUnlockGrants(),
      ),
    staleTime: 30_000,
  });

  return {
    snapshotQuery,
    usageQuery,
    mcpQuery,
    skillsQuery,
    deviceIdQuery,
    notificationStateQuery,
    mysteryUnlockGrantsQuery,
  };
}
