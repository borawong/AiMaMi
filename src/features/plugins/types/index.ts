import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  RuntimeExtensionPayload,
  RuntimeExtensionSettings,
} from "@/services/runtime-extensions";

export type PluginsModuleId = "plugins";
export type PluginsIpcPayload = RuntimeExtensionPayload;
export type PluginSettingsDraft = RuntimeExtensionSettings;
export type PluginsCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;
