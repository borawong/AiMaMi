import type { ModuleCacheEnvelope } from "@/features/_shared/module-cache";

/**
 * 中文职责说明：overview 模块只声明边界类型，未证实业务字段不在这里编造成跨模块事实。
 */
export type OverviewModuleId = "overview";
export type OverviewCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;

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
  icon: "key" | "bell" | "merge" | "user";
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
      id: "usage" | "mcp";
      titleKey: string;
      state: OverviewQueryState;
      kind: "records";
      items: unknown[];
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
      payload: unknown;
    }
  | {
      id: "mystery-grants";
      titleKey: string;
      state: OverviewQueryState;
      kind: "mystery";
      payload: unknown;
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
