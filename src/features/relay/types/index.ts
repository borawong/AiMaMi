import type { ModuleCacheEnvelope } from "@/features/_shared/cache";

export type RelayModuleId = "relay";
export type RelayCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;

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
