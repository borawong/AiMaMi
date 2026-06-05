/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-contracts.jsonl
Frontend module: services/relay
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { invokeIpc } from "@/contracts/ipc";
import type { CoreEnvelope } from "@/types";

export const relayService = {
  loadState: () => invokeIpc<CoreEnvelope<unknown>>("load_relay_state"),
  upsert: (input: unknown) =>
    invokeIpc<CoreEnvelope<unknown>>("upsert_relay_provider", { input }),
  delete: (providerId: string) =>
    invokeIpc<CoreEnvelope<unknown>>("delete_relay_provider", { providerId }),
  activate: (providerId: string, ide: string) =>
    invokeIpc<CoreEnvelope<unknown>>("activate_relay_provider", {
      providerId,
      ide,
    }),
  deactivate: (providerId: string, ide: string) =>
    invokeIpc<CoreEnvelope<unknown>>("deactivate_relay_provider", {
      providerId,
      ide,
    }),
  setNetwork: (providerId: string, network: unknown) =>
    invokeIpc<CoreEnvelope<unknown>>("set_relay_provider_network", {
      providerId,
      network,
    }),
  test: (providerId: string) =>
    invokeIpc<CoreEnvelope<unknown>>("test_relay_provider", { providerId }),
  testDraft: (input: unknown) =>
    invokeIpc<CoreEnvelope<unknown>>("test_relay_draft", { input }),
  fetchModelsDraft: (input: unknown) =>
    invokeIpc<CoreEnvelope<unknown>>("fetch_relay_models_draft", { input }),
  getActive: () => invokeIpc<CoreEnvelope<unknown>>("get_relay_active"),
  getProxyStatus: () =>
    invokeIpc<CoreEnvelope<unknown>>("get_relay_proxy_status"),
  setCodexRouterEnabled: (enabled: boolean, relaunch: boolean) =>
    invokeIpc<CoreEnvelope<unknown>>("set_codex_router_enabled", {
      enabled,
      relaunch,
    }),
  setBlockOfficialPassthrough: (blocked: boolean) =>
    invokeIpc<CoreEnvelope<unknown>>("set_block_official_passthrough", {
      blocked,
    }),
  getPassthroughAuditLog: (limit: number) =>
    invokeIpc<CoreEnvelope<unknown>>("get_passthrough_audit_log", { limit }),
  exportConfig: (filePath: string, includeApiKeys: boolean) =>
    invokeIpc<CoreEnvelope<unknown>>("export_relay_config", {
      filePath,
      includeApiKeys,
    }),
  importConfig: (filePath: string) =>
    invokeIpc<CoreEnvelope<unknown>>("import_relay_config", { filePath }),
  runCodexRouterDiagnostics: () =>
    invokeIpc<CoreEnvelope<unknown>>("run_codex_router_diagnostics"),
  diagnoseCodexRouter: () =>
    invokeIpc<CoreEnvelope<unknown>>("diagnose_codex_router"),
  fixCodexRouterIssue: (itemId: string) =>
    invokeIpc<CoreEnvelope<unknown>>("fix_codex_router_issue", { itemId }),
};
