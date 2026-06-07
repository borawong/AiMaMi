import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type {
  CoreEnvelope,
  RelayRouterTogglePayload,
  RelayStatePayload,
} from "@/types";
import type {
  RelayCacheDataPayload,
  RelayCacheEnvelope,
  RelayCachePayload,
  RelayKnownQueryPayload,
} from "../types";

export const RelayCache = createModuleCacheOwner<RelayCachePayload>("relay");
export const RelayQueryKeys = RelayCache.queryKeys;
export const RELAY_STATE_QUERY_KEY = ["relay-state"] as const;
export const RELAY_ROUTER_TOGGLE_PROGRESS_QUERY_KEY = [
  ...RelayCache.queryKeys.root,
  "router-toggle-progress",
] as const;

let relayCacheSequence = 0;
let relayLatestAcceptedSequence = 0;

export function nextRelayCacheSequence() {
  relayCacheSequence += 1;
  return relayCacheSequence;
}

export const writeRelayAuthoritativePayload = <TPayload extends RelayCachePayload>(
  queryClient: QueryClient,
  envelope: Omit<RelayCacheEnvelope<TPayload>, "moduleId">,
) => RelayCache.writeAuthoritativePayload(queryClient, envelope);

export function writeRelayMutationPayload<TPayload extends RelayCachePayload>(
  queryClient: QueryClient,
  payload: TPayload,
  sequence: number,
  receivedAt = Date.now(),
) {
  return writeRelaySequencedPayload(
    queryClient,
    payload,
    "mutation-payload",
    sequence,
    receivedAt,
  );
}

export function writeRelayQueryPayload<TPayload extends RelayCachePayload>(
  queryClient: QueryClient,
  payload: TPayload,
  sequence: number,
  receivedAt = Date.now(),
  source: "full-refresh" = "full-refresh",
) {
  return writeRelaySequencedPayload(
    queryClient,
    payload,
    source,
    sequence,
    receivedAt,
  );
}

function writeRelaySequencedPayload<TPayload extends RelayCachePayload>(
  queryClient: QueryClient,
  payload: TPayload,
  source: "full-refresh" | "mutation-payload",
  sequence: number,
  receivedAt: number,
) {
  if (sequence < relayLatestAcceptedSequence) {
    return false;
  }

  relayLatestAcceptedSequence = sequence;
  writeRelayAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt,
  });
  return true;
}

export function writeQueryPayload<TPayload extends RelayKnownQueryPayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  sourcePayload: CoreEnvelope<RelayCacheDataPayload>,
  data: TPayload,
) {
  queryClient.setQueryData<CoreEnvelope<TPayload>>(queryKey, (current) => {
    const base = current ?? sourcePayload;
    return { ...base, data } as CoreEnvelope<TPayload>;
  });
}

export function writeRelayStateQueryPayload(
  queryClient: QueryClient,
  payload: CoreEnvelope<RelayStatePayload>,
) {
  queryClient.setQueryData<CoreEnvelope<RelayStatePayload>>(
    RELAY_STATE_QUERY_KEY,
    (current) => {
      const base = current ?? payload;
      return { ...base, data: payload.data };
    },
  );
}

export function writeRelayRouterToggleQueryPayload(
  queryClient: QueryClient,
  payload: CoreEnvelope<RelayRouterTogglePayload>,
) {
  writeQueryPayload(queryClient, RELAY_STATE_QUERY_KEY, payload, payload.data.state);
}

export async function cancelRelayMutationQueries(queryClient: QueryClient) {
  await queryClient.cancelQueries({ queryKey: RELAY_STATE_QUERY_KEY });
  await queryClient.cancelQueries({ queryKey: RelayCache.queryKeys.root });
}

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
