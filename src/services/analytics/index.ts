import { invokeIpc } from "@/contracts/ipc";
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

export const analyticsService = {
  loadUsageAnalytics: () =>
    invokeIpc<CoreEnvelope<UsageAnalyticsPayload>>("load_usage_analytics"),

  loadQuotaHistory: (accountKey?: string | null) =>
    invokeIpc<CoreEnvelope<QuotaHistoryPayload>>("load_quota_history", {
      accountKey: accountKey?.trim() || undefined,
    }),

  loadSessionAnalytics: (range: AnalyticsRange = "week") =>
    invokeIpc<CoreEnvelope<SessionAnalyticsPayload>>("load_session_analytics", { range }),

  loadTokenAnalytics: (range: AnalyticsRange = "week") =>
    invokeIpc<CoreEnvelope<TokenAnalyticsPayload>>("load_token_analytics", {
      range,
    }),

  loadToolAnalytics: (range: AnalyticsRange = "week") =>
    invokeIpc<CoreEnvelope<ToolAnalyticsPayload>>("load_tool_analytics", {
      range,
    }),

  loadChangeAnalytics: (range: AnalyticsRange = "week") =>
    invokeIpc<CoreEnvelope<ChangeAnalyticsPayload>>("load_change_analytics", {
      range,
    }),
};
