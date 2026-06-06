import { createModuleCacheOwner } from "@/features/_shared/cache";

// voice 当前只保留模块缓存 owner，避免 runtime registry 和目录骨架断裂。
export const VoiceCache = createModuleCacheOwner("voice");
export const VoiceQueryKeys = VoiceCache.queryKeys;
