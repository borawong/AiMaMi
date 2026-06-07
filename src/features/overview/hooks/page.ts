import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/toast";
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
import type {
  OverviewDataPanelModel,
  OverviewMetricModel,
  OverviewModuleController,
  OverviewPageController,
} from "../types";
import { useOverviewPageMutations } from "./mutation";
import { useOverviewPageQueries } from "./query";

export function useOverviewModule(): OverviewModuleController {
  const { t } = useTranslation();
  const queries = useOverviewPageQueries();
  const mutations = useOverviewPageMutations();
  const [remoteDeviceSecret, setRemoteDeviceSecret] = useState<string | null>(null);
  const [importRemoteSecretOpen, setImportRemoteSecretOpen] = useState(false);
  const [importRemoteSecretDraft, setImportRemoteSecretDraft] = useState("");

  const submitImportRemoteSecret = () => {
    const secret = importRemoteSecretDraft.trim();
    if (!secret) return;

    void mutations.importRemoteSecretMutation
      .mutateAsync(secret)
      .then(() => {
        setImportRemoteSecretOpen(false);
        setImportRemoteSecretDraft("");
        toast({
          title: t("overview.remoteSecretImportedTitle"),
          description: t("overview.remoteSecretImportedDesc"),
        });
      })
      .catch((error) => {
        toastOverviewError(t, error);
      });
  };

  const refreshUsageAction = {
    id: "refresh-usage-snapshot",
    labelKey: "common.refresh",
    isPending: mutations.refreshUsageMutation.isPending,
    run: () => mutations.refreshUsageMutation.mutateAsync(),
  };
  const focusMainWindowAction = {
    id: "focus-main-window",
    labelKey: "overview.focusMainWindow",
    isPending: mutations.focusMainWindowMutation.isPending,
    run: () => mutations.focusMainWindowMutation.mutateAsync(),
  };

  return {
    ...queries,
    ...mutations,
    remoteDeviceSecret,
    setRemoteDeviceSecret,
    importRemoteSecretDialog: {
      draft: importRemoteSecretDraft,
      isOpen: importRemoteSecretOpen,
      isPending: mutations.importRemoteSecretMutation.isPending,
      onDraftChange: setImportRemoteSecretDraft,
      onOpenChange: (open: boolean) => {
        setImportRemoteSecretOpen(open);
        if (!open) setImportRemoteSecretDraft("");
      },
      onSubmit: submitImportRemoteSecret,
    },
    refreshUsageAction,
    focusMainWindowAction,
  };
}

export function useOverviewPageController(): OverviewPageController {
  const { t } = useTranslation();
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
  const activeAccount = readOverviewActiveAccount(
    snapshot,
    module.snapshotQuery.isLoading,
  );
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
          run: () => generateRemoteDeviceSecret(module, t),
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
          run: () => mergeMysteryGrants(module, mysteryGrantItems, t),
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

type OverviewTranslate = (key: string, options?: Record<string, unknown>) => string;

async function generateRemoteDeviceSecret(
  module: OverviewModuleController,
  t: OverviewTranslate,
) {
  try {
    const secret = await module.remoteDeviceSecretMutation.mutateAsync();
    module.setRemoteDeviceSecret(secret);
    toast({
      title: t("overview.remoteSecretGeneratedTitle"),
      description: t("overview.remoteSecretGeneratedDesc"),
    });
  } catch (error) {
    toastOverviewError(t, error);
  }
}

async function mergeMysteryGrants(
  module: OverviewModuleController,
  mysteryGrantItems: MysteryRouteGrant[],
  t: OverviewTranslate,
) {
  try {
    await module.mergeMysteryGrantsMutation.mutateAsync(mysteryGrantItems);
    toast({
      title: t("overview.mysteryGrantsMergedTitle"),
      description: t("overview.mysteryGrantsMergedDesc"),
    });
  } catch (error) {
    toastOverviewError(t, error);
  }
}

function toastOverviewError(t: OverviewTranslate, error: unknown) {
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
