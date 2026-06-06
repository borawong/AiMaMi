import {
  invokeIpc,
  type IpcArgValue,
} from "@/contracts/ipc";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { systemService } from "@/services/system";
import type {
  CoreEnvelope,
  RelayActivePayload,
  RelayDiagnosticPayload,
  RelayExportPayload,
  RelayImportPayload,
  RelayPassthroughAuditEntry,
  RelayExtraHeaders,
  RelayProviderPayload,
  RelayProxyPayload,
  RelayRouterIssueFixPayload,
  RelayRouterTogglePayload,
  RelayStatePayload,
  RelayTestPayload,
} from "@/types";

export type RelayNetworkConfig = "system" | "direct";
export interface RelayProviderDraftInput {
  id?: string;
  providerId?: string;
  ide?: string;
  name?: string;
  baseUrl?: string;
  url?: string;
  endpoint?: string;
  apiKey?: string;
  apiKeyStored?: boolean;
  model?: string;
  defaultModel?: string;
  wireApi?: string;
  extraHeaders?: RelayExtraHeaders;
  network?: RelayNetworkConfig;
}
export type RelayProviderDraft = RelayProviderDraftInput;
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
export type RelayRouterToggleProgressHandler = (payload: unknown) => void;

const CODEX_ROUTER_TOGGLE_PROGRESS_EVENT = "codex-router-toggle-progress";
type RelayProviderDraftArgs = Record<string, IpcArgValue>;

function subscribeRouterToggleProgress(
  handler: RelayRouterToggleProgressHandler,
  onError?: (error: unknown) => void,
) {
  let disposed = false;
  let unlisten: UnlistenFn | null = null;

  void listen<unknown>(CODEX_ROUTER_TOGGLE_PROGRESS_EVENT, (event) => {
    handler(event.payload);
  })
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

export const relayService = {
  subscribeRouterToggleProgress,

  loadState: () => invokeIpc<CoreEnvelope<RelayStatePayload>>("load_relay_state"),
  upsert: (input: RelayProviderDraft) =>
    invokeIpc<CoreEnvelope<RelayProviderPayload>>("upsert_relay_provider", {
      input: toRelayProviderDraftArgs(input),
    }),
  delete: (providerId: string) =>
    invokeIpc<CoreEnvelope<RelayStatePayload>>("delete_relay_provider", {
      providerId,
    }),
  activate: (providerId: string, ide: string) =>
    invokeIpc<CoreEnvelope<RelayStatePayload>>("activate_relay_provider", {
      providerId,
      ide,
    }),
  deactivate: (providerId: string, ide: string) =>
    invokeIpc<CoreEnvelope<RelayStatePayload>>("deactivate_relay_provider", {
      providerId,
      ide,
    }),
  setNetwork: (providerId: string, network: RelayNetworkConfig) =>
    invokeIpc<CoreEnvelope<RelayProviderPayload>>("set_relay_provider_network", {
      providerId,
      network,
    }),
  test: (providerId: string) =>
    invokeIpc<CoreEnvelope<RelayTestPayload>>("test_relay_provider", {
      providerId,
    }),
  testDraft: (input: RelayProviderDraft) =>
    invokeIpc<CoreEnvelope<RelayTestPayload>>("test_relay_draft", {
      input: toRelayProviderDraftArgs(input),
    }),
  fetchModelsDraft: (input: RelayProviderDraft) =>
    invokeIpc<CoreEnvelope<string[]>>("fetch_relay_models_draft", {
      input: toRelayProviderDraftArgs(input),
    }),
  getActive: () =>
    invokeIpc<CoreEnvelope<RelayActivePayload>>("get_relay_active"),
  getProxyStatus: () =>
    invokeIpc<CoreEnvelope<RelayProxyPayload>>("get_relay_proxy_status"),
  setCodexRouterEnabled: (enabled: boolean, relaunch = true) =>
    invokeIpc<CoreEnvelope<RelayRouterTogglePayload>>("set_codex_router_enabled", {
      enabled,
      relaunch,
    }),
  restartCodexApp: () => systemService.restartCodex(),
  setBlockOfficialPassthrough: (blocked: boolean) =>
    invokeIpc<CoreEnvelope<boolean>>("set_block_official_passthrough", {
      blocked,
    }),
  getPassthroughAuditLog: (limit = 50) =>
    invokeIpc<CoreEnvelope<RelayPassthroughAuditEntry[]>>(
      "get_passthrough_audit_log",
      {
        limit,
      },
    ),
  exportConfig: (filePath: string, includeApiKeys: boolean) =>
    invokeIpc<CoreEnvelope<RelayExportPayload>>("export_relay_config", {
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
    invokeIpc<CoreEnvelope<RelayImportPayload>>("import_relay_config", {
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
    invokeIpc<CoreEnvelope<RelayDiagnosticPayload>>(
      "run_codex_router_diagnostics",
    ),
  diagnoseCodexRouter: () =>
    invokeIpc<CoreEnvelope<RelayDiagnosticPayload>>("diagnose_codex_router"),
  fixCodexRouterIssue: (itemId: string) =>
    invokeIpc<CoreEnvelope<RelayRouterIssueFixPayload>>("fix_codex_router_issue", {
      itemId,
    }),
};

function toRelayProviderDraftArgs(input: RelayProviderDraft): RelayProviderDraftArgs {
  return {
    id: input.id,
    providerId: input.providerId,
    ide: input.ide,
    name: input.name,
    baseUrl: input.baseUrl,
    url: input.url,
    endpoint: input.endpoint,
    apiKey: input.apiKey,
    apiKeyStored: input.apiKeyStored,
    model: input.model,
    defaultModel: input.defaultModel,
    wireApi: input.wireApi,
    extraHeaders: toRelayExtraHeadersArg(input.extraHeaders),
    network: input.network,
  };
}

function toRelayExtraHeadersArg(value: RelayExtraHeaders | undefined): IpcArgValue {
  if (value === undefined || value === null || typeof value === "string") {
    return value;
  }
  return { ...value };
}
