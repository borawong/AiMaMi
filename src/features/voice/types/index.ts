import type { ModuleCacheEnvelope } from "@/features/_shared/cache";

export type VoiceModuleId = "voice";
export type VoiceCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;
