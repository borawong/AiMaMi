import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";

export const RelayCache = createModuleCacheOwner("relay");
export const RelayQueryKeys = RelayCache.queryKeys;
export const RELAY_STATE_QUERY_KEY = ["relay-state"] as const;
export const RELAY_ROUTER_TOGGLE_PROGRESS_QUERY_KEY = [
  ...RelayCache.queryKeys.root,
  "router-toggle-progress",
] as const;
export const writeRelayAuthoritativePayload = RelayCache.writeAuthoritativePayload;

export interface RelayRouterToggleProgress {
  label: string;
  step: number;
  total: number;
  current: number | null;
  totalItems: number | null;
  receivedAt: number;
}

export function writeRelayRouterToggleProgress(
  queryClient: QueryClient,
  progress: RelayRouterToggleProgress,
) {
  queryClient.setQueryData(RELAY_ROUTER_TOGGLE_PROGRESS_QUERY_KEY, progress);
}

export async function invalidateRelayContractQueries(queryClient: QueryClient) {
  await Promise.all([
    RelayCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: RELAY_STATE_QUERY_KEY }),
  ]);
}
