import { useQuery, useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { relayService } from "@/services/relay";
import {
  RELAY_ROUTER_TOGGLE_PROGRESS_QUERY_KEY,
  nextRelayCacheSequence,
  RelayCache,
  RELAY_STATE_QUERY_KEY,
  type RelayRouterToggleProgress,
  writeRelayQueryPayload,
} from "../cache";
import type { RelayCachePayload, RelayQueryController } from "../types";

export const relayProxyStatusQueryKey = [
  ...RelayCache.queryKeys.root,
  "proxy-status",
] as const;
export const relayActiveStateQueryKey = [
  ...RelayCache.queryKeys.root,
  "active-state",
] as const;
export const relayAuditLogQueryKey = [
  ...RelayCache.queryKeys.root,
  "passthrough-audit-log",
  50,
] as const;

export function useRelayCacheController() {
  return useModuleCacheController(RelayCache);
}

export async function runRelayQuery<TPayload extends RelayCachePayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  load: () => Promise<TPayload>,
) {
  const sequence = nextRelayCacheSequence();
  const payload = await load();
  if (!writeRelayQueryPayload(queryClient, payload, sequence, Date.now(), "full-refresh")) {
    return queryClient.getQueryData<TPayload>(queryKey) ?? payload;
  }
  return payload;
}

export function useRelayQueries(): RelayQueryController {
  const queryClient = useQueryClient();
  const stateQuery = useQuery({
    queryKey: RELAY_STATE_QUERY_KEY,
    queryFn: () =>
      runRelayQuery(queryClient, RELAY_STATE_QUERY_KEY, () => relayService.loadState()),
    staleTime: 30_000,
  });
  const activeQuery = useQuery({
    queryKey: relayActiveStateQueryKey,
    queryFn: () =>
      runRelayQuery(queryClient, relayActiveStateQueryKey, () =>
        relayService.getActive(),
      ),
    staleTime: 30_000,
  });
  const proxyQuery = useQuery({
    queryKey: relayProxyStatusQueryKey,
    queryFn: () =>
      runRelayQuery(queryClient, relayProxyStatusQueryKey, () =>
        relayService.getProxyStatus(),
      ),
    staleTime: 30_000,
  });
  const auditLogQuery = useQuery({
    queryKey: relayAuditLogQueryKey,
    queryFn: () =>
      runRelayQuery(queryClient, relayAuditLogQueryKey, () =>
        relayService.getPassthroughAuditLog(50),
      ),
    staleTime: 30_000,
  });
  const routerToggleProgressQuery = useQuery({
    queryKey: RELAY_ROUTER_TOGGLE_PROGRESS_QUERY_KEY,
    queryFn: () =>
      queryClient.getQueryData<RelayRouterToggleProgress>(
        RELAY_ROUTER_TOGGLE_PROGRESS_QUERY_KEY,
      ) ?? null,
    staleTime: Infinity,
  });

  return {
    stateQuery,
    activeQuery,
    proxyQuery,
    auditLogQuery,
    routerToggleProgressQuery,
  } satisfies RelayQueryController;
}
