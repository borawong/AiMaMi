import {
  invokeIpc,
  type IpcEvidencePayload,
  type IpcJsonValue,
} from "@/contracts/ipc";
import type { CoreEnvelope, CoreSnapshotPayload } from "@/types";

export const systemService = {
  loadSnapshot: (localOnly = false) =>
    invokeIpc<CoreEnvelope<CoreSnapshotPayload>>("load_snapshot", { localOnly }),

  refreshUsageSnapshot: () =>
    invokeIpc<CoreEnvelope<CoreSnapshotPayload>>("refresh_usage_snapshot"),

  focusMainWindow: () => invokeIpc<void>("focus_main_window"),

  getDeviceId: () => invokeIpc<string>("get_device_id"),

  getNotificationClientState: () =>
    invokeIpc<IpcEvidencePayload>("get_notification_client_state"),

  getMysteryUnlockGrants: () =>
    invokeIpc<IpcEvidencePayload>("get_mystery_unlock_grants"),

  mergeMysteryUnlockGrants: (grants: IpcJsonValue) =>
    invokeIpc<IpcEvidencePayload>("merge_mystery_unlock_grants", { grants }),
};
