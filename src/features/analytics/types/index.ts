import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  AnalyticsRange,
  ChangeAnalyticsPayload,
  CoreEnvelope,
  QuotaHistoryPayload,
  SessionAnalyticsPayload,
  TokenAnalyticsPayload,
  ToolAnalyticsPayload,
  UsageAnalyticsPayload,
} from "@/types";

export type AnalyticsModuleId = "analytics";
export type AnalyticsUsageEnvelope = CoreEnvelope<UsageAnalyticsPayload>;
export type AnalyticsSessionEnvelope = CoreEnvelope<SessionAnalyticsPayload>;
export type AnalyticsTokenEnvelope = CoreEnvelope<TokenAnalyticsPayload>;
export type AnalyticsToolEnvelope = CoreEnvelope<ToolAnalyticsPayload>;
export type AnalyticsChangeEnvelope = CoreEnvelope<ChangeAnalyticsPayload>;
export type AnalyticsQuotaEnvelope = CoreEnvelope<QuotaHistoryPayload>;
export type AnalyticsCachePayload =
  | AnalyticsUsageEnvelope
  | AnalyticsSessionEnvelope
  | AnalyticsTokenEnvelope
  | AnalyticsToolEnvelope
  | AnalyticsChangeEnvelope
  | AnalyticsQuotaEnvelope
  | null;
export type AnalyticsCacheEnvelope<TPayload = AnalyticsCachePayload> =
  ModuleCacheEnvelope<TPayload>;

export type AnalyticsPanelId =
  | "activity"
  | "sessions"
  | "token"
  | "tools"
  | "changes"
  | "quota";

export type AnalyticsActivityRange = "week" | "month" | "year";

export interface AnalyticsOption<TValue extends string> {
  value: TValue;
  labelKey: string;
}

export interface AnalyticsDataPoint {
  label: string;
  value: number;
}

export interface AnalyticsStatItem {
  id: string;
  label: string;
  value: string;
}

export interface AnalyticsDonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface AnalyticsHeatmapDay {
  date: string;
  level: number;
  count: number;
  activeMinutes: number;
  tokens: number;
}

export interface AnalyticsPanelState {
  loading: boolean;
  errorMessage: string | null;
}

export interface AnalyticsActivityPanelModel extends AnalyticsPanelState {
  days: AnalyticsHeatmapDay[];
  stats: AnalyticsStatItem[];
}

export interface AnalyticsSessionPoint extends AnalyticsDataPoint {
  date: string;
  count: number;
}

export interface AnalyticsSessionsPanelModel extends AnalyticsPanelState {
  data: AnalyticsDataPoint[];
  tooltipPoints: AnalyticsSessionPoint[];
  stats: AnalyticsStatItem[];
}

export interface AnalyticsTokenPoint extends AnalyticsDataPoint {
  date: string;
  totalTokens: number;
  cumulative: number;
  totalTokensLabel: string;
  cumulativeLabel: string;
}

export interface AnalyticsTokenPanelModel extends AnalyticsPanelState {
  data: AnalyticsDataPoint[];
  cumulative: number[];
  tooltipPoints: AnalyticsTokenPoint[];
  segments: AnalyticsDonutSegment[];
  totalTokensLabel: string;
  stats: AnalyticsStatItem[];
}

export interface AnalyticsToolPoint extends AnalyticsDataPoint {
  name: string;
  count: number;
  percentage: number;
}

export interface AnalyticsToolsPanelModel extends AnalyticsPanelState {
  data: AnalyticsDataPoint[];
  tooltipPoints: AnalyticsToolPoint[];
  segments: AnalyticsDonutSegment[];
  totalCalls: number;
  stats: AnalyticsStatItem[];
}

export interface AnalyticsChangePoint {
  label: string;
  date: string;
  a: number;
  b: number;
  line: number;
  writeOps: number;
  readOps: number;
  commands: number;
}

export interface AnalyticsChangesPanelModel extends AnalyticsPanelState {
  data: AnalyticsChangePoint[];
  tooltipPoints: AnalyticsChangePoint[];
  stats: AnalyticsStatItem[];
}

export interface AnalyticsQuotaPoint {
  timestamp: number;
  label: string;
  formattedTimestamp: string;
  primaryRemaining: number;
  secondaryRemaining: number;
  primaryRemainingLabel: string;
  secondaryRemainingLabel: string;
}

export interface AnalyticsQuotaPanelModel extends AnalyticsPanelState {
  accountKey: string;
  emptyKey: string;
  labels: string[];
  primaryRemaining: number[];
  secondaryRemaining: number[];
  tooltipPoints: AnalyticsQuotaPoint[];
  stats: AnalyticsStatItem[];
}

export interface AnalyticsPageController {
  activePanel: AnalyticsPanelId;
  range: AnalyticsRange;
  activityRange: AnalyticsActivityRange;
  quotaAccountKey: string;
  panelOptions: readonly AnalyticsOption<AnalyticsPanelId>[];
  rangeOptions: readonly AnalyticsOption<AnalyticsRange>[];
  activityRangeOptions: readonly AnalyticsOption<AnalyticsActivityRange>[];
  setActivePanel: (value: AnalyticsPanelId) => void;
  setRange: (value: AnalyticsRange) => void;
  setActivityRange: (value: AnalyticsActivityRange) => void;
  setQuotaAccountKey: (value: string) => void;
  activity: AnalyticsActivityPanelModel;
  sessions: AnalyticsSessionsPanelModel;
  token: AnalyticsTokenPanelModel;
  tools: AnalyticsToolsPanelModel;
  changes: AnalyticsChangesPanelModel;
  quota: AnalyticsQuotaPanelModel;
}
