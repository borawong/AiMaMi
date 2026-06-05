/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-contracts.jsonl
Frontend module: services/sessions
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { invokeIpc } from "@/contracts/ipc";
import type { CoreEnvelope } from "@/types";

export const sessionsService = {
  loadSessions: () => invokeIpc<CoreEnvelope<unknown>>("load_sessions"),

  deleteSessions: (ids: string[]) =>
    invokeIpc<CoreEnvelope<unknown>>("delete_sessions", { ids }),
};
