/**
 * 中文职责说明：plugins 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const PluginsCache = createModuleCacheOwner("plugins");
export const PluginsQueryKeys = PluginsCache.queryKeys;
export const writePluginsAuthoritativePayload = PluginsCache.writeAuthoritativePayload;
export const invalidatePluginsContractQueries = PluginsCache.invalidateContractQueries;
