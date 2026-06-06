import { invokeIpc } from "@/contracts/ipc";
import type {
  AnalyticsRange,
  CoreEnvelope,
  SessionAnalyticsPayload,
  SessionsDeletePayload,
  SessionsListPayload,
} from "@/types";

export const sessionsService = {
  loadSessions: () => invokeIpc<CoreEnvelope<SessionsListPayload>>("load_sessions"),

  loadSessionAnalytics: (range: AnalyticsRange = "week") =>
    invokeIpc<CoreEnvelope<SessionAnalyticsPayload>>("load_session_analytics", { range }),

  deleteSessions: (ids: string[]) =>
    invokeIpc<CoreEnvelope<SessionsDeletePayload>>("delete_sessions", { ids }),
};
