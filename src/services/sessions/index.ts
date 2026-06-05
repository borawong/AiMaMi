import { invokeIpc, type IpcEvidencePayload } from "@/contracts/ipc";
import type { CoreEnvelope } from "@/types";

export const sessionsService = {
  loadSessions: () => invokeIpc<CoreEnvelope<IpcEvidencePayload>>("load_sessions"),

  deleteSessions: (ids: string[]) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("delete_sessions", { ids }),
};
