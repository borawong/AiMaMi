/**
 * 中文职责说明：voice 模块只声明边界类型，未证实业务字段不在这里编造。
 */
import type { ModuleCacheEnvelope } from "@/features/_shared/cache";

export type VoiceModuleId = "voice";
export type VoiceCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;
