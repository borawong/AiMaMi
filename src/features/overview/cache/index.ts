/**
 * 中文职责说明：overview 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/cache";

export const OverviewCache = createModuleCacheOwner("overview");
export const OverviewQueryKeys = OverviewCache.queryKeys;
export const writeOverviewAuthoritativePayload = OverviewCache.writeAuthoritativePayload;
export const invalidateOverviewContractQueries = OverviewCache.invalidateContractQueries;
