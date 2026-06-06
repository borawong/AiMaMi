import { useEffect } from "react";
import {
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import type {
  ModuleCacheEnvelope,
  ModuleCacheOwner,
} from "@/features/_shared/cache";

interface RuntimeMutationPayloadCacheEntry<TPayload = unknown> {
  eventType: "module:mutation-payload";
  payload: TPayload;
  receivedAt: number;
  sequence: number;
}

interface ModuleStoreUpdaterBoundaryProps<TPayload = unknown> {
  cacheOwner: ModuleCacheOwner<TPayload>;
}

export function ModuleStoreUpdaterBoundary<TPayload = unknown>({
  cacheOwner,
}: ModuleStoreUpdaterBoundaryProps<TPayload>) {
  useModuleStoreUpdater(cacheOwner);
  return null;
}

export function useModuleStoreUpdater<TPayload = unknown>(
  cacheOwner: ModuleCacheOwner<TPayload>,
) {
  const queryClient = useQueryClient();
  const runtimeMutationKey = getRuntimeMutationPayloadQueryKey(cacheOwner);

  const stateQuery = useQuery<ModuleCacheEnvelope<TPayload> | null>({
    queryKey: cacheOwner.queryKeys.state,
    queryFn: async () =>
      queryClient.getQueryData<ModuleCacheEnvelope<TPayload>>(
        cacheOwner.queryKeys.state,
      ) ?? null,
    enabled: false,
    staleTime: Infinity,
  });

  const runtimeMutationQuery = useQuery<
    RuntimeMutationPayloadCacheEntry<TPayload> | null
  >({
    queryKey: runtimeMutationKey,
    queryFn: async () =>
      readRuntimeMutationPayloadCache(
        queryClient,
        runtimeMutationKey,
        cacheOwner,
      ),
    enabled: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    synchronizeModuleActiveCache(queryClient, cacheOwner);
  }, [cacheOwner, queryClient, stateQuery.data, runtimeMutationQuery.data]);
}

export function synchronizeModuleActiveCache<TPayload = unknown>(
  queryClient: QueryClient,
  cacheOwner: ModuleCacheOwner<TPayload>,
) {
  const runtimeMutation = readRuntimeMutationPayloadCache(
    queryClient,
    getRuntimeMutationPayloadQueryKey(cacheOwner),
    cacheOwner,
  );

  if (runtimeMutation) {
    cacheOwner.writeAuthoritativePayload(queryClient, {
      payload: runtimeMutation.payload,
      source: "mutation-payload",
      sequence: runtimeMutation.sequence,
      receivedAt: runtimeMutation.receivedAt,
      mutationFenceAt: runtimeMutation.receivedAt,
    });
  }

  const moduleState = queryClient.getQueryData<ModuleCacheEnvelope<TPayload>>(
    cacheOwner.queryKeys.state,
  );

  if (!isModuleCacheEnvelopeForOwner(moduleState, cacheOwner)) {
    return;
  }

  queryClient.setQueryData<ModuleCacheEnvelope<TPayload>>(
    cacheOwner.queryKeys.active,
    (current) => {
      if (shouldKeepActiveEnvelope(current, moduleState)) {
        return current;
      }

      return moduleState;
    },
  );
}

function getRuntimeMutationPayloadQueryKey<TPayload>(
  cacheOwner: ModuleCacheOwner<TPayload>,
): QueryKey {
  return [cacheOwner.moduleId, "mutation-payload"] as const;
}

function readRuntimeMutationPayloadCache<TPayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  cacheOwner: ModuleCacheOwner<TPayload>,
) {
  const value = queryClient.getQueryData<unknown>(queryKey);
  if (!isRuntimeMutationPayloadCacheEntry(value, cacheOwner)) {
    return null;
  }
  return value;
}

function shouldKeepActiveEnvelope<TCurrentPayload, TNextPayload>(
  current: ModuleCacheEnvelope<TCurrentPayload> | undefined,
  next: ModuleCacheEnvelope<TNextPayload>,
) {
  if (!current) {
    return false;
  }

  if (next.sequence < current.sequence) {
    return true;
  }

  if (
    current.mutationFenceAt &&
    next.source !== "mutation-payload" &&
    next.receivedAt < current.mutationFenceAt
  ) {
    return true;
  }

  if (next.source === "replay" && next.receivedAt <= current.receivedAt) {
    return true;
  }

  return (
    current.source === next.source &&
    current.sequence === next.sequence &&
    current.receivedAt === next.receivedAt &&
    Object.is(current.payload, next.payload)
  );
}

function isModuleCacheEnvelopeForOwner<TPayload>(
  value: unknown,
  cacheOwner: ModuleCacheOwner<TPayload>,
): value is ModuleCacheEnvelope<TPayload> {
  const record = asRecord(value);
  return (
    record?.moduleId === cacheOwner.moduleId &&
    typeof record.sequence === "number" &&
    typeof record.receivedAt === "number" &&
    typeof record.source === "string" &&
    Object.prototype.hasOwnProperty.call(record, "payload") &&
    isPayloadForOwner(record.payload, cacheOwner)
  );
}

function isRuntimeMutationPayloadCacheEntry<TPayload>(
  value: unknown,
  cacheOwner: ModuleCacheOwner<TPayload>,
): value is RuntimeMutationPayloadCacheEntry<TPayload> {
  const record = asRecord(value);
  return (
    record?.eventType === "module:mutation-payload" &&
    typeof record.sequence === "number" &&
    typeof record.receivedAt === "number" &&
    Object.prototype.hasOwnProperty.call(record, "payload") &&
    isPayloadForOwner(record.payload, cacheOwner)
  );
}

function isPayloadForOwner<TPayload>(
  value: unknown,
  cacheOwner: ModuleCacheOwner<TPayload>,
): value is TPayload {
  return cacheOwner.isPayload ? cacheOwner.isPayload(value) : true;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}
