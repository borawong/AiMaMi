/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-contracts.jsonl
Frontend module: services/system
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { invokeIpc } from "@/contracts/ipc";
import type { CoreEnvelope, CoreSnapshotPayload } from "@/types";

export const systemService = {
  loadSnapshot: (localOnly = false) =>
    invokeIpc<CoreEnvelope<CoreSnapshotPayload>>("load_snapshot", { localOnly }),

  refreshUsageSnapshot: () =>
    invokeIpc<CoreEnvelope<CoreSnapshotPayload>>("refresh_usage_snapshot"),

  focusMainWindow: () => invokeIpc<void>("focus_main_window"),

  getDeviceId: () => invokeIpc<string>("get_device_id"),

  getNotificationClientState: () =>
    invokeIpc<unknown>("get_notification_client_state"),

  getMysteryUnlockGrants: () =>
    invokeIpc<unknown>("get_mystery_unlock_grants"),

  mergeMysteryUnlockGrants: (grants: unknown) =>
    invokeIpc<unknown>("merge_mystery_unlock_grants", { grants }),
};
