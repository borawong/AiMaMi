/**
 * 中文职责说明：maintenance 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const MaintenanceCache = createModuleCacheOwner("maintenance");
export const MaintenanceQueryKeys = MaintenanceCache.queryKeys;
export const MAINTENANCE_IMAGE_COMPAT_QUERY_KEY = ["imageCompat"] as const;
export const writeMaintenanceAuthoritativePayload = MaintenanceCache.writeAuthoritativePayload;

export async function invalidateMaintenanceContractQueries(queryClient: QueryClient) {
  await Promise.all([
    MaintenanceCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({
      queryKey: MAINTENANCE_IMAGE_COMPAT_QUERY_KEY,
    }),
  ]);
}
