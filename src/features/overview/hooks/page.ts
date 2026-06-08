import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const queries = useOverviewPageQueries();
  const mutations = useOverviewPageMutations();

  const refreshUsageAction = {
    id: "refresh-usage-snapshot",
    labelKey: "common.refresh",
    isPending: mutations.refreshUsageMutation.isPending,
    run: () => mutations.refreshUsageMutation.mutateAsync(),
  };

  return {
    ...queries,
    ...mutations,
    refreshUsageAction,
  };
}

export function useOverviewPageController(): OverviewPageController {
  const { i18n } = useTranslation();
  const [initialLanguage] = useState(() => i18n.language);
  const localeLanguage = i18n.language || initialLanguage;
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
  void notificationState;
  void mysteryUnlockGrants;
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
            labelKey: "overview.healthAuth",
            trueKey: "overview.healthOk",
            falseKey: "overview.healthMissing",
          },
          {
            id: "registry",
            value: health.registryExists,
            labelKey: "overview.healthRegistry",
            trueKey: "overview.healthOk",
            falseKey: "overview.healthMissing",
          },
        ],
      },
    },
  ];

  const dataPanels: OverviewDataPanelModel[] = [
    {
      id: "snapshot",
      titleKey: "overview.healthDetail",
      state: module.snapshotQuery,
      kind: "rows",
      rows: [
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
      titleKey: "overview.activityTrend",
      state: module.usageQuery,
      kind: "records",
      items: readArray<DailyActivity>(usage, ["dailyActivity"]),
      emptyKey: "analytics.emptySeries",
    },
    {
      id: "mcp",
      titleKey: "overview.statMcp",
      state: module.mcpQuery,
      kind: "records",
      items: mcpItems,
      emptyKey: "mcp.empty",
    },
    {
      id: "skills",
      titleKey: "overview.statSkills",
      state: module.skillsQuery,
      kind: "skills",
      items: readOverviewSkillRecords(skillItems, localeLanguage),
      emptyKey: "skills.empty",
    },
  ];

  return {
    actions: [module.refreshUsageAction],
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
