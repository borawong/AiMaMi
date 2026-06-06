import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { systemService } from "@/services/system";
import type { PendingAutoSwitchStatePayload } from "@/types";

export type PendingAutoSwitchEventPayload = PendingAutoSwitchStatePayload;
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
  setAutoSwitch: systemService.setAutoSwitch,

  configureAutoSwitch: systemService.configureAutoSwitch,

  loadBootstrapState: systemService.loadBootstrapState,

  loadPendingAutoSwitch: systemService.loadPendingAutoSwitch,

  dismissPendingAutoSwitch: systemService.dismissPendingAutoSwitch,

  confirmPendingAutoSwitch: systemService.confirmPendingAutoSwitch,

  confirmPendingAutoSwitchAndRestartCodex:
    systemService.confirmPendingAutoSwitchAndRestartCodex,

  subscribePendingAutoSwitch,

  runDaemonOnce: systemService.runDaemonOnce,
};
