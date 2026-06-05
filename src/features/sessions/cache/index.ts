/**
 * 中文职责说明：sessions 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const SessionsCache = createModuleCacheOwner("sessions");
export const SessionsQueryKeys = SessionsCache.queryKeys;
export const writeSessionsAuthoritativePayload = SessionsCache.writeAuthoritativePayload;
export const invalidateSessionsContractQueries = SessionsCache.invalidateContractQueries;
