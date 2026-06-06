import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  RuntimeExtensionConfigPayload,
  RuntimeExtensionListPayload,
  RuntimeExtensionPluginPayload,
  RuntimeExtensionSettingsValue,
  RuntimeExtensionTogglePayload,
} from "@/types";
import type {
  RuntimeExtensionSettings,
} from "@/services/runtime-extensions";
import type {
  PluginsConfigEnvelope as ServicePluginsConfigEnvelope,
  PluginsListEnvelope as ServicePluginsListEnvelope,
  PluginsMutationEnvelope as ServicePluginsMutationEnvelope,
  PluginsToggleEnvelope as ServicePluginsToggleEnvelope,
} from "@/services/plugins";

export type PluginsModuleId = "plugins";
export type PluginsIpcPayload =
  | RuntimeExtensionListPayload
  | RuntimeExtensionTogglePayload
  | RuntimeExtensionConfigPayload;
export type PluginsCachePayload =
  | PluginsListEnvelope
  | PluginsToggleEnvelope
  | PluginsConfigEnvelope;
export type PluginsPluginRecord = RuntimeExtensionPluginPayload;
export type PluginsSettingsValue = RuntimeExtensionSettingsValue;
export type PluginSettingsDraft = RuntimeExtensionSettings;
export type PluginsListEnvelope = ServicePluginsListEnvelope;
export type PluginsToggleEnvelope = ServicePluginsToggleEnvelope;
export type PluginsConfigEnvelope = ServicePluginsConfigEnvelope;
export type PluginsMutationEnvelope = ServicePluginsMutationEnvelope;
export type PluginsCacheEnvelope<TPayload = PluginsCachePayload> =
  ModuleCacheEnvelope<TPayload>;
