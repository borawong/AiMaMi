import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useModuleCacheController } from "@/features/_shared/controller";
import { toast } from "@/hooks/toast";
import { accountsService } from "@/services/accounts";
import { analyticsService } from "@/services/analytics";
import { mcpService } from "@/services/mcp";
import { skillsService } from "@/services/skills";
import { systemService } from "@/services/system";
import {
  OVERVIEW_MYSTERY_GRANTS_QUERY_KEY,
  OverviewCache,
  writeOverviewAuthoritativePayload,
  writeOverviewMysteryGrantsPayload,
} from "../cache";
import type {
  OverviewDataPanelModel,
  OverviewMetricModel,
  OverviewPageController,
} from "../types";
import type {
  CoreSnapshotPayload,
  DailyActivity,
  InstalledSkillSummary,
  McpServerListPayload,
  McpServerSummary,
  MysteryRouteGrant,
  NotificationClientStatePayload,
  SkillListPayload,
  UsageAnalyticsPayload,
} from "@/types";
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
  const { t } = useTranslation();
  const [remoteDeviceSecret, setRemoteDeviceSecret] = useState<string | null>(null);
  const [importRemoteSecretOpen, setImportRemoteSecretOpen] = useState(false);
  const [importRemoteSecretDraft, setImportRemoteSecretDraft] = useState("");

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
    queryKey: OVERVIEW_MYSTERY_GRANTS_QUERY_KEY,
    queryFn: () => systemService.getMysteryUnlockGrants(),
    staleTime: 30_000,
  });

  const refreshUsageMutation = useMutation({
    mutationFn: () => accountsService.refreshUsageSnapshot(),
    onSuccess: (payload) => {
      writeOverviewAuthoritativePayload(queryClient, {
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
  const remoteDeviceSecretMutation = useMutation({
    mutationFn: () => systemService.getOrCreateRemoteDeviceSecret(),
    onSuccess: (secret) => {
      setRemoteDeviceSecret(secret);
      toast({
        title: t("overview.remoteSecretGeneratedTitle"),
        description: t("overview.remoteSecretGeneratedDesc"),
      });
    },
    onError: (error) => {
      toastOverviewError(t, error);
    },
  });
  const importRemoteSecretMutation = useMutation({
    mutationFn: (secret: string) =>
      systemService.importRemoteDeviceSecretIfEmpty(secret.trim()),
    onSuccess: () => {
      setImportRemoteSecretOpen(false);
      setImportRemoteSecretDraft("");
      void queryClient.invalidateQueries({
        queryKey: OVERVIEW_MYSTERY_GRANTS_QUERY_KEY,
      });
      toast({
        title: t("overview.remoteSecretImportedTitle"),
        description: t("overview.remoteSecretImportedDesc"),
      });
    },
    onError: (error) => {
      toastOverviewError(t, error);
    },
  });
  const mergeMysteryGrantsMutation = useMutation({
    mutationFn: () =>
      systemService.mergeMysteryUnlockGrants(
        envelopeData<MysteryRouteGrant[]>(mysteryUnlockGrantsQuery.data) ?? [],
      ),
    onSuccess: (payload) => {
      writeOverviewMysteryGrantsPayload(queryClient, payload);
      void queryClient.invalidateQueries({
        queryKey: OVERVIEW_MYSTERY_GRANTS_QUERY_KEY,
      });
      toast({
        title: t("overview.mysteryGrantsMergedTitle"),
        description: t("overview.mysteryGrantsMergedDesc"),
      });
    },
    onError: (error) => {
      toastOverviewError(t, error);
    },
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
    remoteDeviceSecretMutation,
    importRemoteSecretMutation,
    mergeMysteryGrantsMutation,
    remoteDeviceSecret,
    importRemoteSecretDialog: {
      draft: importRemoteSecretDraft,
      isOpen: importRemoteSecretOpen,
      isPending: importRemoteSecretMutation.isPending,
      onDraftChange: setImportRemoteSecretDraft,
      onOpenChange: (open: boolean) => {
        setImportRemoteSecretOpen(open);
        if (!open) setImportRemoteSecretDraft("");
      },
      onSubmit: () => {
        const secret = importRemoteSecretDraft.trim();
        if (secret) void importRemoteSecretMutation.mutateAsync(secret);
      },
    },
    refreshUsageAction,
    focusMainWindowAction,
  };
}

export function useOverviewPageController(): OverviewPageController {
  const module = useOverviewModule();
  const snapshot = envelopeData<CoreSnapshotPayload>(
    module.snapshotQuery.data,
  );
  const usage = envelopeData<UsageAnalyticsPayload>(module.usageQuery.data);
  const mcp = envelopeData<McpServerListPayload>(module.mcpQuery.data);
  const skills = envelopeData<SkillListPayload>(module.skillsQuery.data);
  const notificationState = envelopeData<NotificationClientStatePayload>(
    module.notificationStateQuery.data,
  );
  const mysteryUnlockGrants = envelopeData<MysteryRouteGrant[]>(
    module.mysteryUnlockGrantsQuery.data,
  );
  const mysteryGrantItems = mysteryUnlockGrants ?? [];
  const mcpItems = readArray<McpServerSummary>(mcp, ["items", "servers"]);
  const skillItems = readArray<InstalledSkillSummary>(skills, [
    "items",
    "skills",
  ]);
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
      items: readArray<DailyActivity>(usage, ["dailyActivity"]),
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
      remoteDeviceSecret: module.remoteDeviceSecret,
      remoteSecretLabelKey: "overview.remoteSecretValue",
      boundaryActions: [
        {
          id: "remote-secret",
          labelKey: "overview.remoteSecretAction",
          icon: "key",
          isPending: module.remoteDeviceSecretMutation.isPending,
          run: () => module.remoteDeviceSecretMutation.mutateAsync(),
        },
        {
          id: "import-remote-secret",
          labelKey: "overview.importRemoteSecretAction",
          icon: "bell",
          isPending: module.importRemoteSecretMutation.isPending,
          run: () => module.importRemoteSecretDialog.onOpenChange(true),
        },
        {
          id: "merge-mystery-grants",
          labelKey: "overview.mergeMysteryGrantsAction",
          descriptionKey:
            mysteryGrantItems.length === 0
              ? "overview.mergeMysteryGrantsEmpty"
              : undefined,
          disabled: mysteryGrantItems.length === 0,
          icon: "merge",
          isPending: module.mergeMysteryGrantsMutation.isPending,
          run: () => module.mergeMysteryGrantsMutation.mutateAsync(),
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
    dialogs: {
      importRemoteSecret: module.importRemoteSecretDialog,
    },
    accountBoundaryAction: {
      id: activeAccount.hasAccount ? "switch-account" : "add-account",
      labelKey: activeAccount.hasAccount
        ? "overview.switchAccount"
        : "overview.addAccountBtn",
      icon: "user",
    },
  };
}

function toastOverviewError(
  t: (key: string, options?: Record<string, unknown>) => string,
  error: unknown,
) {
  toast({
    title: t("overview.mysteryActionFailed"),
    description:
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : t("common.toastErrorGenericDesc"),
    variant: "destructive",
  });
}
