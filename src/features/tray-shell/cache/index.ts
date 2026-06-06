/**
 * 中文职责说明：tray-shell 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const TrayShellCache = createModuleCacheOwner("tray-shell");
export const TrayShellQueryKeys = TrayShellCache.queryKeys;
export const writeTrayShellAuthoritativePayload = TrayShellCache.writeAuthoritativePayload;
export const invalidateTrayShellContractQueries = TrayShellCache.invalidateContractQueries;
