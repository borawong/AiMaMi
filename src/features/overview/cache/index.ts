import { createModuleCacheOwner } from "@/features/_shared/cache";

export const OverviewCache = createModuleCacheOwner("overview");
export const OverviewQueryKeys = OverviewCache.queryKeys;
export const writeOverviewAuthoritativePayload = OverviewCache.writeAuthoritativePayload;
export const invalidateOverviewContractQueries = OverviewCache.invalidateContractQueries;
