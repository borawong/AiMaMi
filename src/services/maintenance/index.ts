import { invokeIpc, type IpcEvidencePayload } from "@/contracts/ipc";
import { systemService } from "@/services/system";
import type {
  CoreEnvelope,
} from "@/types";

async function readEnvelopeData<T>(promise: Promise<CoreEnvelope<T>>): Promise<T> {
  return (await promise).data;
}

export const maintenanceService = {
  clean: systemService.clean,

  rebuildRegistry: systemService.rebuildRegistry,

  diagnose: systemService.diagnose,

  restartCodex: systemService.restartCodex,

  forceKillCodex: systemService.forceKillCodex,

  resetCodexConfig: systemService.resetCodexConfig,

  getImageCompat: systemService.getImageCompat,

  setImageCompat: systemService.setImageCompat,

  runCodexRouterDiagnostics: () =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<IpcEvidencePayload>>("run_codex_router_diagnostics"),
    ),

  fixCodexRouterIssue: (itemId: string) =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<IpcEvidencePayload>>("fix_codex_router_issue", {
        itemId,
      }),
    ),

  openPath: systemService.openPath,

  getSystemInfo: systemService.getSystemInfo,
};
