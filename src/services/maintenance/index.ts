import { invokeIpc, type IpcEvidencePayload } from "@/contracts/ipc";
import type {
  CleanPayload,
  CoreEnvelope,
  DiagnosePayload,
  RebuildRegistryPayload,
  SystemInfoPayload,
} from "@/types";

async function ignoreEnvelope(promise: Promise<CoreEnvelope<unknown>>): Promise<void> {
  await promise;
}

async function readEnvelopeData<T>(promise: Promise<CoreEnvelope<T>>): Promise<T> {
  return (await promise).data;
}

export const maintenanceService = {
  clean: () => invokeIpc<CoreEnvelope<CleanPayload>>("clean"),

  rebuildRegistry: () =>
    invokeIpc<CoreEnvelope<RebuildRegistryPayload>>("rebuild_registry"),

  diagnose: () => invokeIpc<CoreEnvelope<DiagnosePayload>>("diagnose"),

  restartCodex: () =>
    ignoreEnvelope(invokeIpc<CoreEnvelope<unknown>>("restart_codex")),

  forceKillCodex: () =>
    ignoreEnvelope(invokeIpc<CoreEnvelope<unknown>>("force_kill_codex")),

  resetCodexConfig: () =>
    ignoreEnvelope(invokeIpc<CoreEnvelope<unknown>>("reset_codex_config")),

  getImageCompat: () =>
    readEnvelopeData(invokeIpc<CoreEnvelope<boolean>>("get_image_compat")),

  setImageCompat: (enabled: boolean) =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<boolean>>("set_image_compat", { enabled }),
    ),

  runCodexRouterDiagnostics: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("run_codex_router_diagnostics"),

  fixCodexRouterIssue: (itemId: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("fix_codex_router_issue", {
      itemId,
    }),

  openPath: (path: string) =>
    ignoreEnvelope(invokeIpc<CoreEnvelope<unknown>>("open_path", { path })),

  getSystemInfo: () =>
    readEnvelopeData(invokeIpc<CoreEnvelope<SystemInfoPayload>>("get_system_info")),
};
