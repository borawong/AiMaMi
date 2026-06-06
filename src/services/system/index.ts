import {
  invokeIpc,
  type IpcEvidencePayload,
  type IpcJsonValue,
} from "@/contracts/ipc";
import type { CoreEnvelope, CoreSnapshotPayload } from "@/types";

async function ignoreEnvelope(promise: Promise<CoreEnvelope<unknown>>): Promise<void> {
  await promise;
}

async function readEnvelopeData<T>(promise: Promise<CoreEnvelope<T>>): Promise<T> {
  return (await promise).data;
}

export const systemService = {
  loadSnapshot: (localOnly = false) =>
    invokeIpc<CoreEnvelope<CoreSnapshotPayload>>("load_snapshot", { localOnly }),

  refreshUsageSnapshot: () =>
    invokeIpc<CoreEnvelope<CoreSnapshotPayload>>("refresh_usage_snapshot"),

  focusMainWindow: () =>
    ignoreEnvelope(invokeIpc<CoreEnvelope<unknown>>("focus_main_window")),

  getDeviceId: () =>
    readEnvelopeData(invokeIpc<CoreEnvelope<string>>("get_device_id")),

  getNotificationClientState: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("get_notification_client_state"),

  getMysteryUnlockGrants: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("get_mystery_unlock_grants"),

  mergeMysteryUnlockGrants: (grants: IpcJsonValue) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("merge_mystery_unlock_grants", {
      grants,
    }),

  getOrCreateRemoteDeviceSecret: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>(
      "get_or_create_remote_device_secret",
    ),

  importRemoteDeviceSecretIfEmpty: (secret: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>(
      "import_remote_device_secret_if_empty",
      { secret },
    ),
};
