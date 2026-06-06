import {
  invokeIpc,
  type IpcEvidencePayload,
  type IpcJsonObject,
  type IpcJsonValue,
} from "@/contracts/ipc";
import type { CoreEnvelope } from "@/types";

export type RelayProviderDraft = IpcJsonObject;
export type RelayNetworkConfig = IpcJsonValue;
export type RelayExportDialogInput = {
  title: string;
  defaultPath: string;
  filterName: string;
  includeApiKeys: boolean;
};
export type RelayImportDialogInput = {
  title: string;
  filterName: string;
};

export const relayService = {
  loadState: () => invokeIpc<CoreEnvelope<IpcEvidencePayload>>("load_relay_state"),
  upsert: (input: RelayProviderDraft) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("upsert_relay_provider", { input }),
  delete: (providerId: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("delete_relay_provider", {
      providerId,
    }),
  activate: (providerId: string, ide: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("activate_relay_provider", {
      providerId,
      ide,
    }),
  deactivate: (providerId: string, ide: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("deactivate_relay_provider", {
      providerId,
      ide,
    }),
  setNetwork: (providerId: string, network: RelayNetworkConfig) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("set_relay_provider_network", {
      providerId,
      network,
    }),
  test: (providerId: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("test_relay_provider", {
      providerId,
    }),
  testDraft: (input: RelayProviderDraft) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("test_relay_draft", { input }),
  fetchModelsDraft: (input: RelayProviderDraft) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("fetch_relay_models_draft", {
      input,
    }),
  getActive: () => invokeIpc<CoreEnvelope<IpcEvidencePayload>>("get_relay_active"),
  getProxyStatus: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("get_relay_proxy_status"),
  setCodexRouterEnabled: (enabled: boolean, relaunch = true) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("set_codex_router_enabled", {
      enabled,
      relaunch,
    }),
  restartCodexApp: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("restart_codex"),
  setBlockOfficialPassthrough: (blocked: boolean) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("set_block_official_passthrough", {
      blocked,
    }),
  getPassthroughAuditLog: (limit = 50) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("get_passthrough_audit_log", {
      limit,
    }),
  exportConfig: (filePath: string, includeApiKeys: boolean) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("export_relay_config", {
      filePath,
      includeApiKeys,
    }),
  exportConfigWithDialog: async (input: RelayExportDialogInput) => {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const filePath = await save({
      title: input.title,
      defaultPath: input.defaultPath,
      filters: [{ name: input.filterName, extensions: ["json"] }],
    });
    if (!filePath) throw new Error("CANCELLED");
    return relayService.exportConfig(filePath, input.includeApiKeys);
  },
  importConfig: (filePath: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("import_relay_config", {
      filePath,
    }),
  importConfigWithDialog: async (input: RelayImportDialogInput) => {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const filePath = await open({
      title: input.title,
      multiple: false,
      directory: false,
      filters: [{ name: input.filterName, extensions: ["json"] }],
    });
    if (!filePath || typeof filePath !== "string") throw new Error("CANCELLED");
    return relayService.importConfig(filePath);
  },
  runCodexRouterDiagnostics: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("run_codex_router_diagnostics"),
  diagnoseCodexRouter: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("diagnose_codex_router"),
  fixCodexRouterIssue: (itemId: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("fix_codex_router_issue", {
      itemId,
    }),
};
