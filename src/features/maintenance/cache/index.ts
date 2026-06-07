import type { QueryClient, QueryKey } from "@tanstack/react-query";
import {
  createModuleCacheOwner,
  type ModuleCacheSource,
} from "@/features/_shared/cache";
import type {
  MaintenanceActionPayload,
  MaintenanceCacheEnvelope,
  MaintenanceCachePayload,
  MaintenanceImageCompatQueryKey,
  MaintenanceQueryPayloadForKey,
  MaintenanceSystemInfoQueryKey,
  MaintenanceWritableQueryKey,
} from "../types";

export const MaintenanceCache =
  createModuleCacheOwner<MaintenanceCachePayload>("maintenance");
export const MaintenanceQueryKeys = MaintenanceCache.queryKeys;
export const MAINTENANCE_IMAGE_COMPAT_QUERY_KEY: MaintenanceImageCompatQueryKey = [
  "imageCompat",
] as const;
export const MAINTENANCE_SYSTEM_INFO_QUERY_KEY: MaintenanceSystemInfoQueryKey = [
  "maintenance",
  "system-info",
] as const;
export const writeMaintenanceAuthoritativePayload = <
  TPayload extends MaintenanceCachePayload,
>(
  queryClient: QueryClient,
  envelope: Omit<MaintenanceCacheEnvelope<TPayload>, "moduleId">,
) => MaintenanceCache.writeAuthoritativePayload(queryClient, envelope);

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

export function beginMaintenanceMutation(queryKey: MaintenanceWritableQueryKey) {
  const sequence = nextMaintenanceQuerySequence(queryKey);
  const serialized = serializeMaintenanceQueryKey(queryKey);
  maintenanceMutationFences.set(
    serialized,
    Math.max(maintenanceMutationFences.get(serialized) ?? 0, sequence),
  );
  return sequence;
}

export async function prepareMaintenanceMutation(
  queryClient: QueryClient,
  queryKey: MaintenanceWritableQueryKey,
) {
  const sequence = beginMaintenanceMutation(queryKey);
  await queryClient.cancelQueries({ queryKey });
  return { sequence };
}

export function writeMaintenanceQueryPayload<TKey extends MaintenanceWritableQueryKey>(
  queryClient: QueryClient,
  queryKey: TKey,
  payload: MaintenanceQueryPayloadForKey<TKey>,
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

  queryClient.setQueryData<MaintenanceQueryPayloadForKey<TKey>>(queryKey, payload);
  writeMaintenanceAuthoritativePayload(queryClient, {
    payload: toMaintenanceCachePayload(queryKey, payload),
    source: options.source,
    sequence: nextMaintenanceModuleSequence(),
    receivedAt: Date.now(),
  });
  return true;
}

export async function runMaintenanceQuery<TKey extends MaintenanceWritableQueryKey>(
  queryClient: QueryClient,
  queryKey: TKey,
  load: () => Promise<MaintenanceQueryPayloadForKey<TKey>>,
  source: ModuleCacheSource = "full-refresh",
) {
  const sequence = nextMaintenanceQuerySequence(queryKey);
  const payload = await load();
  const accepted = writeMaintenanceQueryPayload(queryClient, queryKey, payload, {
    source,
    sequence,
  });

  if (!accepted) {
    return queryClient.getQueryData<MaintenanceQueryPayloadForKey<TKey>>(queryKey) ?? payload;
  }

  return payload;
}

export async function writeMaintenanceMutationPayload<TKey extends MaintenanceWritableQueryKey>(
  queryClient: QueryClient,
  queryKey: TKey,
  payload: MaintenanceQueryPayloadForKey<TKey>,
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

export async function writeMaintenanceActionPayload<TPayload extends MaintenanceActionPayload>(
  queryClient: QueryClient,
  payload: TPayload,
) {
  writeMaintenanceAuthoritativePayload(queryClient, {
    payload,
    source: "mutation-payload",
    sequence: nextMaintenanceModuleSequence(),
    receivedAt: Date.now(),
  });
  await invalidateMaintenanceContractQueries(queryClient);
}

function toMaintenanceCachePayload<TKey extends MaintenanceWritableQueryKey>(
  queryKey: TKey,
  value: MaintenanceQueryPayloadForKey<TKey>,
): MaintenanceCachePayload {
  if (queryKey === MAINTENANCE_SYSTEM_INFO_QUERY_KEY) {
    return {
      queryKey: MAINTENANCE_SYSTEM_INFO_QUERY_KEY,
      value: value as MaintenanceQueryPayloadForKey<MaintenanceSystemInfoQueryKey>,
    };
  }

  return {
    queryKey: MAINTENANCE_IMAGE_COMPAT_QUERY_KEY,
    value: value as MaintenanceQueryPayloadForKey<MaintenanceImageCompatQueryKey>,
  };
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
