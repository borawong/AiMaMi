import { createModuleCacheOwner } from "@/features/_shared/cache";

export const TrayShellCache = createModuleCacheOwner("tray-shell");
export const TrayShellQueryKeys = TrayShellCache.queryKeys;
export const writeTrayShellAuthoritativePayload = TrayShellCache.writeAuthoritativePayload;
export const invalidateTrayShellContractQueries = TrayShellCache.invalidateContractQueries;
