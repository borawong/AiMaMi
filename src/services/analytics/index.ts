/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-contracts.jsonl
Frontend module: services/analytics
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { invokeIpc } from "@/contracts/ipc";
import type {
  AnalyticsRange,
  ChangeAnalyticsPayload,
  CoreEnvelope,
  QuotaHistoryPayload,
  TokenAnalyticsPayload,
  ToolAnalyticsPayload,
  UsageAnalyticsPayload,
} from "@/types";

export const analyticsService = {
  loadUsageAnalytics: () =>
    invokeIpc<CoreEnvelope<UsageAnalyticsPayload>>("load_usage_analytics"),

  loadQuotaHistory: (accountKey: string) =>
    invokeIpc<CoreEnvelope<QuotaHistoryPayload>>("load_quota_history", {
      accountKey,
    }),

  loadSessionAnalytics: (range: AnalyticsRange = "week") =>
    invokeIpc<CoreEnvelope<unknown>>("load_session_analytics", { range }),

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
