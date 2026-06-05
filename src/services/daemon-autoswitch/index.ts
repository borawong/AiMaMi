/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-contracts.jsonl
Frontend module: services/daemon-autoswitch
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { invokeIpc } from "@/contracts/ipc";
import type {
  AutoSwitchConfigPayload,
  BootstrapStatePayload,
  CoreEnvelope,
  DaemonRunPayload,
} from "@/types";

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
    invokeIpc<CoreEnvelope<unknown>>("load_pending_auto_switch"),

  dismissPendingAutoSwitch: () =>
    invokeIpc<CoreEnvelope<unknown>>("dismiss_pending_auto_switch"),

  confirmPendingAutoSwitch: () =>
    invokeIpc<CoreEnvelope<unknown>>("confirm_pending_auto_switch"),

  confirmPendingAutoSwitchAndRestartCodex: () =>
    invokeIpc<CoreEnvelope<unknown>>(
      "confirm_pending_auto_switch_and_restart_codex",
    ),

  runDaemonOnce: () =>
    invokeIpc<CoreEnvelope<DaemonRunPayload>>("run_daemon_once"),
};
