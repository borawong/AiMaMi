/**
 * 中文职责说明：plugins 模块只声明边界类型，未证实业务字段不在这里编造。
 */
import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  RuntimeExtensionPayload,
  RuntimeExtensionSettings,
} from "@/services/runtime-extensions";

export type PluginsModuleId = "plugins";
export type PluginsIpcPayload = RuntimeExtensionPayload;
export type PluginSettingsDraft = RuntimeExtensionSettings;
export type PluginsCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;
