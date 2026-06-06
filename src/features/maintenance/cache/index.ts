/**
 * 中文职责说明：maintenance 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import {
  createModuleCacheOwner,
  type ModuleCacheSource,
} from "@/features/_shared/cache";

export const MaintenanceCache = createModuleCacheOwner("maintenance");
export const MaintenanceQueryKeys = MaintenanceCache.queryKeys;
export const MAINTENANCE_IMAGE_COMPAT_QUERY_KEY = ["imageCompat"] as const;
export const MAINTENANCE_SYSTEM_INFO_QUERY_KEY = [
  ...MaintenanceCache.queryKeys.root,
  "system-info",
] as const;
export const writeMaintenanceAuthoritativePayload = MaintenanceCache.writeAuthoritativePayload;

let maintenanceModuleSequence = 0;
const maintenanceQuerySequences = new Map<string, number>();
const maintenanceMutationFences = new Map<string, number>();

function nextMaintenanceModuleSequence() {
  maintenanceModuleSequence += 1;
  return maintenanceModuleSequence;
}

function serializeMaintenanceQueryKey(queryKey: QueryKey) {
  return JSON.stringify(queryKey);
}

function nextMaintenanceQuerySequence(queryKey: QueryKey) {
  const serialized = serializeMaintenanceQueryKey(queryKey);
  const next = (maintenanceQuerySequences.get(serialized) ?? 0) + 1;
  maintenanceQuerySequences.set(serialized, next);
  return next;
}

function canAcceptMaintenancePayload(
  queryKey: QueryKey,
  source: ModuleCacheSource,
  sequence: number,
) {
  const serialized = serializeMaintenanceQueryKey(queryKey);
  const latestStarted = maintenanceQuerySequences.get(serialized) ?? 0;
  const mutationFence = maintenanceMutationFences.get(serialized) ?? 0;

  if (source === "mutation-payload") {
    return sequence >= mutationFence;
  }

  return sequence >= latestStarted && sequence >= mutationFence;
}

export function beginMaintenanceMutation(queryKey: QueryKey) {
  const sequence = nextMaintenanceQuerySequence(queryKey);
  const serialized = serializeMaintenanceQueryKey(queryKey);
  maintenanceMutationFences.set(
    serialized,
    Math.max(maintenanceMutationFences.get(serialized) ?? 0, sequence),
  );
  return sequence;
}

export function writeMaintenanceQueryPayload<TPayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  payload: TPayload,
  options: {
    source: ModuleCacheSource;
    sequence?: number;
  },
) {
  const sequence =
    options.sequence ??
    (options.source === "mutation-payload"
      ? beginMaintenanceMutation(queryKey)
      : nextMaintenanceQuerySequence(queryKey));

  if (!canAcceptMaintenancePayload(queryKey, options.source, sequence)) {
    return false;
  }

  queryClient.setQueryData<TPayload>(queryKey, payload);
  MaintenanceCache.writeAuthoritativePayload(queryClient, {
    payload: {
      queryKey,
      value: payload,
    },
    source: options.source,
    sequence: nextMaintenanceModuleSequence(),
    receivedAt: Date.now(),
  });
  return true;
}

export async function runMaintenanceQuery<TPayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  load: () => Promise<TPayload>,
  source: ModuleCacheSource = "full-refresh",
) {
  const sequence = nextMaintenanceQuerySequence(queryKey);
  const payload = await load();
  const accepted = writeMaintenanceQueryPayload(queryClient, queryKey, payload, {
    source,
    sequence,
  });

  if (!accepted) {
    return queryClient.getQueryData<TPayload>(queryKey) ?? payload;
  }

  return payload;
}

export async function writeMaintenanceMutationPayload<TPayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  payload: TPayload,
  sequence?: number,
) {
  const accepted = writeMaintenanceQueryPayload(queryClient, queryKey, payload, {
    source: "mutation-payload",
    sequence,
  });

  if (accepted) {
    await invalidateMaintenanceContractQueries(queryClient);
  }

  return accepted;
}

export async function writeMaintenanceActionPayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
) {
  MaintenanceCache.writeAuthoritativePayload(queryClient, {
    payload,
    source: "mutation-payload",
    sequence: nextMaintenanceModuleSequence(),
    receivedAt: Date.now(),
  });
  await invalidateMaintenanceContractQueries(queryClient);
}

export async function invalidateMaintenanceContractQueries(queryClient: QueryClient) {
  await Promise.all([
    MaintenanceCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({
      queryKey: MAINTENANCE_IMAGE_COMPAT_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: MAINTENANCE_SYSTEM_INFO_QUERY_KEY,
    }),
  ]);
}
