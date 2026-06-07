import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type {
  DaemonAutoswitchCacheEnvelope,
  DaemonAutoswitchCachePayload,
  DaemonAutoswitchMutationEnvelope,
} from "../types";

export const DaemonAutoswitchCache =
  createModuleCacheOwner<DaemonAutoswitchCachePayload>("daemon-autoswitch");
export const DaemonAutoswitchQueryKeys = DaemonAutoswitchCache.queryKeys;
export const DAEMON_AUTOSWITCH_BOOTSTRAP_QUERY_KEY = [
  ...DaemonAutoswitchCache.queryKeys.root,
  "bootstrap",
] as const;
export const DAEMON_AUTOSWITCH_PENDING_QUERY_KEY = [
  ...DaemonAutoswitchCache.queryKeys.root,
  "pending",
] as const;
export const writeDaemonAutoswitchAuthoritativePayload = <
  TPayload extends DaemonAutoswitchCachePayload,
>(
  queryClient: QueryClient,
  envelope: Omit<DaemonAutoswitchCacheEnvelope<TPayload>, "moduleId">,
) => DaemonAutoswitchCache.writeAuthoritativePayload(queryClient, envelope);

let daemonAutoswitchCacheSequence = 0;
let daemonAutoswitchLatestAcceptedSequence = 0;

export function nextDaemonAutoswitchCacheSequence() {
  daemonAutoswitchCacheSequence += 1;
  return daemonAutoswitchCacheSequence;
}

export function writeDaemonAutoswitchCachePayload<
  TPayload extends DaemonAutoswitchCachePayload,
>(
  queryClient: QueryClient,
  payload: TPayload,
  source: "full-refresh" | "mutation-payload",
  sequence: number,
) {
  if (sequence < daemonAutoswitchLatestAcceptedSequence) {
    return false;
  }

  daemonAutoswitchLatestAcceptedSequence = sequence;
  writeDaemonAutoswitchAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt: Date.now(),
  });
  return true;
}

export async function runDaemonAutoswitchQuery<
  TPayload extends DaemonAutoswitchCachePayload,
>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  load: () => Promise<TPayload>,
) {
  const sequence = nextDaemonAutoswitchCacheSequence();
  const payload = await load();
  const accepted = writeDaemonAutoswitchCachePayload(
    queryClient,
    payload,
    "full-refresh",
    sequence,
  );
  if (!accepted) {
    return queryClient.getQueryData<TPayload>(queryKey) ?? payload;
  }
  return payload;
}

export async function writeDaemonAutoswitchMutationPayload(
  queryClient: QueryClient,
  payload: DaemonAutoswitchMutationEnvelope,
) {
  const accepted = writeDaemonAutoswitchCachePayload(
    queryClient,
    payload,
    "mutation-payload",
    nextDaemonAutoswitchCacheSequence(),
  );
  if (!accepted) return;

  await invalidateDaemonAutoswitchContractQueries(queryClient);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["accounts"] }),
    queryClient.invalidateQueries({ queryKey: ["runtime-state", "display"] }),
    queryClient.invalidateQueries({ queryKey: ["quota-history"] }),
  ]);
}

export async function invalidateDaemonAutoswitchContractQueries(
  queryClient: QueryClient,
) {
  await Promise.all([
    DaemonAutoswitchCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({
      queryKey: DAEMON_AUTOSWITCH_BOOTSTRAP_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: DAEMON_AUTOSWITCH_PENDING_QUERY_KEY,
    }),
  ]);
}
