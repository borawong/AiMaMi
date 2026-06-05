/**
 * 中文职责说明：analytics 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const AnalyticsCache = createModuleCacheOwner("analytics");
export const AnalyticsQueryKeys = AnalyticsCache.queryKeys;
export const writeAnalyticsAuthoritativePayload = AnalyticsCache.writeAuthoritativePayload;
export const invalidateAnalyticsContractQueries = AnalyticsCache.invalidateContractQueries;
