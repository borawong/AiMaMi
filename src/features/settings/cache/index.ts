/**
 * 中文职责说明：settings 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const SettingsCache = createModuleCacheOwner("settings");
export const SettingsQueryKeys = SettingsCache.queryKeys;
export const writeSettingsAuthoritativePayload = SettingsCache.writeAuthoritativePayload;
export const invalidateSettingsContractQueries = SettingsCache.invalidateContractQueries;
