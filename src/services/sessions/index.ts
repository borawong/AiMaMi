import { invokeIpc, type IpcEvidencePayload } from "@/contracts/ipc";
import type { AnalyticsRange, CoreEnvelope } from "@/types";

export interface ImportChatGptSessionAccountInput {
  sessionJson: string;
  overwriteExisting: boolean;
}

export const sessionsService = {
  loadSessions: () => invokeIpc<CoreEnvelope<IpcEvidencePayload>>("load_sessions"),

  loadSessionAnalytics: (range: AnalyticsRange = "week") =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("load_session_analytics", { range }),

  deleteSessions: (ids: string[]) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("delete_sessions", { ids }),

  importChatGptSessionAccount: (input: ImportChatGptSessionAccountInput) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("import_chatgpt_session_account", {
      sessionJson: input.sessionJson,
      overwriteExisting: input.overwriteExisting,
    }),
};
