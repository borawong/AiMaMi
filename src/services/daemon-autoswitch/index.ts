import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invokeIpc, type IpcEvidencePayload } from "@/contracts/ipc";
import type {
  AutoSwitchConfigPayload,
  BootstrapStatePayload,
  CoreEnvelope,
  DaemonRunPayload,
} from "@/types";

export type PendingAutoSwitchEventPayload = IpcEvidencePayload;
export type PendingAutoSwitchEventHandler = (
  payload: PendingAutoSwitchEventPayload,
) => void;

const AUTO_SWITCH_PENDING_EVENT = "auto-switch-pending";

function subscribePendingAutoSwitch(
  handler: PendingAutoSwitchEventHandler,
  onError?: (error: unknown) => void,
) {
  let disposed = false;
  let unlisten: UnlistenFn | null = null;

  void listen<PendingAutoSwitchEventPayload>(
    AUTO_SWITCH_PENDING_EVENT,
    (event) => {
      handler(event.payload);
    },
  )
    .then((nextUnlisten) => {
      if (disposed) {
        nextUnlisten();
        return;
      }

      unlisten = nextUnlisten;
    })
    .catch((error: unknown) => {
      if (!disposed) {
        onError?.(error);
      }
    });

  return () => {
    disposed = true;
    unlisten?.();
    unlisten = null;
  };
}

export const daemonAutoswitchService = {
  setAutoSwitch: (enabled: boolean) =>
    invokeIpc<CoreEnvelope<AutoSwitchConfigPayload>>("set_auto_switch", {
      enabled,
    }),

  configureAutoSwitch: (
    threshold5hPercent?: number,
    thresholdWeeklyPercent?: number,
  ) =>
    invokeIpc<CoreEnvelope<AutoSwitchConfigPayload>>("configure_auto_switch", {
      threshold5hPercent,
      thresholdWeeklyPercent,
    }),

  loadBootstrapState: () =>
    invokeIpc<CoreEnvelope<BootstrapStatePayload>>("load_bootstrap_state"),

  loadPendingAutoSwitch: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("load_pending_auto_switch"),

  dismissPendingAutoSwitch: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("dismiss_pending_auto_switch"),

  confirmPendingAutoSwitch: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("confirm_pending_auto_switch"),

  confirmPendingAutoSwitchAndRestartCodex: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>(
      "confirm_pending_auto_switch_and_restart_codex",
    ),

  subscribePendingAutoSwitch,

  runDaemonOnce: () =>
    invokeIpc<CoreEnvelope<DaemonRunPayload>>("run_daemon_once"),
};
