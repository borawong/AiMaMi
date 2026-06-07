import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  CoreEnvelope,
  RelayActivePayload,
  RelayDiagnosticPayload,
  RelayExportPayload,
  RelayImportPayload,
  RelayPassthroughAuditEntry,
  RelayProviderPayload,
  RelayProxyPayload,
  RelayRouterIssueFixPayload,
  RelayRouterTogglePayload,
  RelayStatePayload,
  RelayTestPayload,
} from "@/types";

export type RelayModuleId = "relay";
export type RelayQueryDataPayload =
  | RelayStatePayload
  | RelayActivePayload
  | RelayProxyPayload
  | RelayPassthroughAuditEntry[];
export type RelayMutationDataPayload =
  | RelayProviderPayload
  | RelayStatePayload
  | RelayTestPayload
  | string[]
  | RelayRouterTogglePayload
  | boolean
  | RelayExportPayload
  | RelayImportPayload
  | RelayDiagnosticPayload
  | RelayRouterIssueFixPayload;
export type RelayCacheDataPayload =
  | RelayQueryDataPayload
  | RelayMutationDataPayload;
export type RelayCachePayload = CoreEnvelope<RelayCacheDataPayload>;
export type RelayKnownQueryPayload =
  | RelayStatePayload
  | RelayActivePayload
  | RelayProxyPayload;
export type RelayCacheEnvelope<
  TPayload extends RelayCachePayload = RelayCachePayload,
> =
  ModuleCacheEnvelope<TPayload>;

export type WireApi = "openai-responses" | "anthropic" | "openai-chat";
export type RelayNetworkMode = "system" | "direct";

export type RelayProviderForm = {
  id?: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  apiKeyStored: boolean;
  model: string;
  wireApi: WireApi;
  extraHeaders: string;
  network: RelayNetworkMode;
};

export type RelayProviderRow = RelayProviderForm & {
  rowId: string;
  ide: string;
  active: boolean;
  latencyMs: number;
  lastError: string;
};

export type RelayProviderPreset = {
  slug: string;
  name: string;
  initial: string;
  color: string;
  baseUrl: string;
  defaultModel: string;
  wireApi: WireApi;
  ides: string[];
};
