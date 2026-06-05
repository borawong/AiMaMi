/**
 * 中文职责说明：maintenance 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const MaintenanceCache = createModuleCacheOwner("maintenance");
export const MaintenanceQueryKeys = MaintenanceCache.queryKeys;
export const writeMaintenanceAuthoritativePayload = MaintenanceCache.writeAuthoritativePayload;
export const invalidateMaintenanceContractQueries = MaintenanceCache.invalidateContractQueries;
