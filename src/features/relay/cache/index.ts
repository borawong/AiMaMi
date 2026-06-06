/**
 * 中文职责说明：relay 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const RelayCache = createModuleCacheOwner("relay");
export const RelayQueryKeys = RelayCache.queryKeys;
export const RELAY_STATE_QUERY_KEY = ["relay-state"] as const;
export const writeRelayAuthoritativePayload = RelayCache.writeAuthoritativePayload;

export async function invalidateRelayContractQueries(queryClient: QueryClient) {
  await Promise.all([
    RelayCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: RELAY_STATE_QUERY_KEY }),
  ]);
}
