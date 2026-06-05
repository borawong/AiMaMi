/**
 * 中文职责说明：relay 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const RelayCache = createModuleCacheOwner("relay");
export const RelayQueryKeys = RelayCache.queryKeys;
export const writeRelayAuthoritativePayload = RelayCache.writeAuthoritativePayload;
export const invalidateRelayContractQueries = RelayCache.invalidateContractQueries;
