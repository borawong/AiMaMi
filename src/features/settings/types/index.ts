/**
 * 中文职责说明：settings 模块只声明边界类型，未证实业务字段不在这里编造。
 */
import type { ModuleCacheEnvelope } from "@/features/_shared/module-cache";

export type SettingsModuleId = "settings";
export type SettingsCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;
