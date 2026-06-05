/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-contracts.jsonl
Frontend module: services/maintenance
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { invokeIpc } from "@/contracts/ipc";
import type {
  CleanPayload,
  CoreEnvelope,
  DiagnosePayload,
  RebuildRegistryPayload,
} from "@/types";

export const maintenanceService = {
  clean: () => invokeIpc<CoreEnvelope<CleanPayload>>("clean"),

  rebuildRegistry: () =>
    invokeIpc<CoreEnvelope<RebuildRegistryPayload>>("rebuild_registry"),

  diagnose: () => invokeIpc<CoreEnvelope<DiagnosePayload>>("diagnose"),

  restartCodex: () => invokeIpc<void>("restart_codex"),

  forceKillCodex: () => invokeIpc<void>("force_kill_codex"),

  resetCodexConfig: () => invokeIpc<void>("reset_codex_config"),

  openPath: (path: string) => invokeIpc<void>("open_path", { path }),

  getSystemInfo: () =>
    invokeIpc<{ os: string; osVersion: string; arch: string; hostname: string }>(
      "get_system_info",
    ),
};
