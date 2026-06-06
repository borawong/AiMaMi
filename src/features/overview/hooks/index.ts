import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { accountsService } from "@/services/accounts";
import { analyticsService } from "@/services/analytics";
import { mcpService } from "@/services/mcp";
import { skillsService } from "@/services/skills";
import { systemService } from "@/services/system";
import { OverviewCache } from "../cache";
import type {
  OverviewDataPanelModel,
  OverviewMetricModel,
  OverviewPageController,
} from "../types";
import {
  envelopeData,
  readArray,
  readNumber,
  readOverviewActiveAccount,
  readOverviewHealth,
  readOverviewSkillRecords,
  readString,
} from "../utils";

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

export function useOverviewPageController(): OverviewPageController {
  const module = useOverviewModule();
  const snapshot = envelopeData(module.snapshotQuery.data);
  const usage = envelopeData(module.usageQuery.data);
  const mcp = envelopeData(module.mcpQuery.data);
  const skills = envelopeData(module.skillsQuery.data);
  const notificationState = envelopeData(module.notificationStateQuery.data);
  const mysteryUnlockGrants = envelopeData(module.mysteryUnlockGrantsQuery.data);
  const mcpItems = readArray(mcp, ["items", "servers"]);
  const skillItems = readArray(skills, ["items", "skills"]);
  const health = readOverviewHealth(snapshot, module.snapshotQuery.isLoading);
  const activeAccount = readOverviewActiveAccount(snapshot, module.snapshotQuery.isLoading);
  const todaySessions = readNumber(usage, ["today.sessionCount"]);
  const activeMinutes = readNumber(usage, ["today.activeMinutesEstimate"]);
  const deviceId =
    typeof module.deviceIdQuery.data === "string" ? module.deviceIdQuery.data : "";

  const metrics: OverviewMetricModel[] = [
    {
      id: "today-sessions",
      labelKey: "overview.todaySessions",
      value: {
        type: "number",
        icon: "activity",
        value: todaySessions,
      },
      hintKey: "overview.todayActive",
      hintParams: { minutes: activeMinutes },
    },
    {
      id: "mcp",
      labelKey: "overview.statMcp",
      value: {
        type: "number",
        icon: "server",
        value: mcpItems.length || readNumber(mcp, ["total"]),
      },
    },
    {
      id: "skills",
      labelKey: "overview.statSkills",
      value: {
        type: "number",
        icon: "sparkles",
        value: skillItems.length || readNumber(skills, ["total"]),
      },
    },
    {
      id: "health",
      labelKey: "overview.healthTitle",
      value: {
        type: "badges",
        badges: [
          {
            id: "auth",
            value: health.authExists,
            trueKey: "overview.healthAuthOk",
            falseKey: "overview.healthAuthMissing",
          },
          {
            id: "registry",
            value: health.registryExists,
            trueKey: "overview.healthRegistryOk",
            falseKey: "overview.healthRegistryMissing",
          },
        ],
      },
    },
  ];

  const dataPanels: OverviewDataPanelModel[] = [
    {
      id: "snapshot",
      titleKey: "overview.snapshot",
      state: module.snapshotQuery,
      kind: "rows",
      rows: [
        {
          id: "device-id",
          labelKey: "overview.deviceId",
          value: deviceId || "-",
        },
        {
          id: "codex-home",
          labelKey: "overview.healthCodexHome",
          value: health.codexHome || "-",
        },
        {
          id: "usage-source",
          labelKey: "overview.usageSource",
          value: readString(snapshot, ["status.usageSource", "usageSource"], "-"),
        },
      ],
    },
    {
      id: "usage",
      titleKey: "overview.usage",
      state: module.usageQuery,
      kind: "records",
      items: readArray(usage, ["dailyActivity"]),
      emptyKey: "analytics.emptySeries",
    },
    {
      id: "mcp",
      titleKey: "overview.mcp",
      state: module.mcpQuery,
      kind: "records",
      items: mcpItems,
      emptyKey: "mcp.empty",
    },
    {
      id: "skills",
      titleKey: "overview.skills",
      state: module.skillsQuery,
      kind: "skills",
      items: readOverviewSkillRecords(skillItems),
      emptyKey: "skills.empty",
    },
    {
      id: "notification-state",
      titleKey: "overview.notificationState",
      state: module.notificationStateQuery,
      kind: "payload",
      payload: notificationState,
    },
    {
      id: "mystery-grants",
      titleKey: "overview.mysteryGrants",
      state: module.mysteryUnlockGrantsQuery,
      kind: "mystery",
      payload: mysteryUnlockGrants,
      boundaryActions: [
        {
          id: "remote-secret",
          labelKey: "overview.remoteSecretBoundary",
          icon: "key",
        },
        {
          id: "import-remote-secret",
          labelKey: "overview.importRemoteSecretBoundary",
          icon: "bell",
        },
        {
          id: "merge-mystery-grants",
          labelKey: "overview.mergeMysteryGrantsBoundary",
          icon: "merge",
        },
      ],
    },
  ];

  return {
    actions: [module.refreshUsageAction, module.focusMainWindowAction],
    activeAccount,
    health,
    metrics,
    dataPanels,
    accountBoundaryAction: {
      id: activeAccount.hasAccount ? "switch-account" : "add-account",
      labelKey: activeAccount.hasAccount
        ? "overview.switchAccount"
        : "overview.addAccountBtn",
      icon: "user",
    },
  };
}
