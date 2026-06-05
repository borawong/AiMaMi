/**
 * 中文职责说明：voice 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const VoiceCache = createModuleCacheOwner("voice");
export const VoiceQueryKeys = VoiceCache.queryKeys;
export const writeVoiceAuthoritativePayload = VoiceCache.writeAuthoritativePayload;
export const invalidateVoiceContractQueries = VoiceCache.invalidateContractQueries;
