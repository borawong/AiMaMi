import type {
  UseMutationResult,
  UseQueryResult,
} from "@tanstack/react-query";
import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  CoreEnvelope,
  CoreSnapshotPayload,
  DailyActivity,
  McpServerListPayload,
  McpServerSummary,
  MysteryRouteGrant,
  NotificationClientStatePayload,
  SkillListPayload,
  UsageAnalyticsPayload,
} from "@/types";

export type OverviewModuleId = "overview";
export type OverviewSnapshotEnvelope = CoreEnvelope<CoreSnapshotPayload>;
export type OverviewUsageEnvelope = CoreEnvelope<UsageAnalyticsPayload>;
export type OverviewMcpEnvelope = CoreEnvelope<McpServerListPayload>;
export type OverviewSkillsEnvelope = CoreEnvelope<SkillListPayload>;
export type OverviewNotificationEnvelope =
  CoreEnvelope<NotificationClientStatePayload>;
export type OverviewMysteryGrantsEnvelope = CoreEnvelope<MysteryRouteGrant[]>;
export type OverviewCachePayload =
  | OverviewSnapshotEnvelope
  | OverviewUsageEnvelope
  | OverviewMcpEnvelope
  | OverviewSkillsEnvelope
  | OverviewNotificationEnvelope
  | OverviewMysteryGrantsEnvelope;
export type OverviewCacheEnvelope<
  TPayload extends OverviewCachePayload = OverviewCachePayload,
> = ModuleCacheEnvelope<TPayload>;
export type OverviewSnapshotQuery = UseQueryResult<OverviewSnapshotEnvelope, Error>;
export type OverviewUsageQuery = UseQueryResult<OverviewUsageEnvelope, Error>;
export type OverviewMcpQuery = UseQueryResult<OverviewMcpEnvelope, Error>;
export type OverviewSkillsQuery = UseQueryResult<OverviewSkillsEnvelope, Error>;
export type OverviewDeviceIdQuery = UseQueryResult<string, Error>;
export type OverviewNotificationQuery =
  UseQueryResult<OverviewNotificationEnvelope, Error>;
export type OverviewMysteryGrantsQuery =
  UseQueryResult<OverviewMysteryGrantsEnvelope, Error>;
export type OverviewRecordPayload = DailyActivity | McpServerSummary;
export type OverviewPayloadSummaryValue =
  | OverviewRecordPayload
  | OverviewSkillRecord
  | NotificationClientStatePayload
  | MysteryRouteGrant[]
  | null;

export interface OverviewAction {
  id: string;
  labelKey: string;
  isPending: boolean;
  run: () => Promise<unknown> | unknown;
}

export interface OverviewQueryState {
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  refetch?: () => Promise<unknown> | unknown;
}

export interface OverviewQuotaWindow {
  remainingPercent: number | null;
  resetsAt: number | null;
  resetLabel: string;
}

export interface OverviewActiveAccountModel {
  hasAccount: boolean;
  accountLabel: string;
  accountKeyLabel: string;
  plan: string;
  apiReachable: boolean;
  loading: boolean;
  primaryWindow: OverviewQuotaWindow | null;
  secondaryWindow: OverviewQuotaWindow | null;
}

export interface OverviewHealthItem {
  id: "codex-home" | "auth" | "registry";
  labelKey: string;
  ok: boolean;
}

export interface OverviewHealthModel {
  codexHome: string;
  authExists: boolean;
  registryExists: boolean;
  healthy: boolean;
  loading: boolean;
  items: OverviewHealthItem[];
}

export interface OverviewBoolBadgeModel {
  id: string;
  value: boolean;
  labelKey: string;
  trueKey: string;
  falseKey: string;
}

export type OverviewMetricIcon = "activity" | "server" | "sparkles";

export type OverviewMetricValue =
  | {
      type: "number";
      icon: OverviewMetricIcon;
      value: number;
    }
  | {
      type: "badges";
      badges: OverviewBoolBadgeModel[];
    };

export interface OverviewMetricModel {
  id: string;
  labelKey: string;
  value: OverviewMetricValue;
  hintKey?: string;
  hintParams?: Record<string, unknown>;
}

export interface OverviewInfoRow {
  id: string;
  labelKey: string;
  value: string;
}

export interface OverviewSkillRecord {
  id: string;
  title: string;
  updatedAtLabel: string;
}

export interface OverviewBoundaryAction {
  id: string;
  labelKey: string;
  descriptionKey?: string;
  disabled?: boolean;
  icon: "key" | "bell" | "merge" | "user";
  isPending?: boolean;
  run?: () => Promise<unknown> | unknown;
}

export interface OverviewImportRemoteSecretDialog {
  draft: string;
  isOpen: boolean;
  isPending: boolean;
  onDraftChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

export interface OverviewDialogController {
  importRemoteSecret: OverviewImportRemoteSecretDialog;
}

export interface OverviewQueryController {
  snapshotQuery: OverviewSnapshotQuery;
  usageQuery: OverviewUsageQuery;
  mcpQuery: OverviewMcpQuery;
  skillsQuery: OverviewSkillsQuery;
  deviceIdQuery: OverviewDeviceIdQuery;
  notificationStateQuery: OverviewNotificationQuery;
  mysteryUnlockGrantsQuery: OverviewMysteryGrantsQuery;
}

export interface OverviewMutationController {
  refreshUsageMutation: UseMutationResult<
    OverviewSnapshotEnvelope,
    Error,
    void,
    unknown
  >;
  focusMainWindowMutation: UseMutationResult<void, Error, void, unknown>;
  remoteDeviceSecretMutation: UseMutationResult<string, Error, void, unknown>;
  importRemoteSecretMutation: UseMutationResult<void, Error, string, unknown>;
  mergeMysteryGrantsMutation: UseMutationResult<
    OverviewMysteryGrantsEnvelope,
    Error,
    MysteryRouteGrant[],
    unknown
  >;
}

export interface OverviewModuleController
  extends OverviewQueryController,
    OverviewMutationController {
  refreshUsageAction: OverviewAction;
}

export type OverviewDataPanelModel =
  | {
      id: "snapshot";
      titleKey: string;
      state: OverviewQueryState;
      kind: "rows";
      rows: OverviewInfoRow[];
    }
  | {
      id: "usage";
      titleKey: string;
      state: OverviewQueryState;
      kind: "records";
      items: DailyActivity[];
      emptyKey: string;
    }
  | {
      id: "mcp";
      titleKey: string;
      state: OverviewQueryState;
      kind: "records";
      items: McpServerSummary[];
      emptyKey: string;
    }
  | {
      id: "skills";
      titleKey: string;
      state: OverviewQueryState;
      kind: "skills";
      items: OverviewSkillRecord[];
      emptyKey: string;
    }
  | {
      id: "notification-state";
      titleKey: string;
      state: OverviewQueryState;
      kind: "payload";
      payload: NotificationClientStatePayload | null;
    }
  | {
      id: "mystery-grants";
      titleKey: string;
      state: OverviewQueryState;
      kind: "mystery";
      payload: MysteryRouteGrant[] | null;
      remoteDeviceSecret: string | null;
      remoteSecretLabelKey: string;
      boundaryActions: OverviewBoundaryAction[];
    };

export interface OverviewPageController {
  actions: OverviewAction[];
  activeAccount: OverviewActiveAccountModel;
  health: OverviewHealthModel;
  metrics: OverviewMetricModel[];
  dataPanels: OverviewDataPanelModel[];
  accountBoundaryAction: OverviewBoundaryAction;
}
