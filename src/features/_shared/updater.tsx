/**
 * 中文职责说明：模块 StoreUpdater 的共享同步边界，只把已有 TanStack cache/runtime envelope 收敛到 active cache。
 */
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

interface RuntimeMutationPayloadCacheEntry {
  eventType: "module:mutation-payload";
  payload: unknown;
  receivedAt: number;
  sequence: number;
}

interface ModuleStoreUpdaterBoundaryProps {
  cacheOwner: ModuleCacheOwner;
}

export function ModuleStoreUpdaterBoundary({
  cacheOwner,
}: ModuleStoreUpdaterBoundaryProps) {
  useModuleStoreUpdater(cacheOwner);
  return null;
}

export function useModuleStoreUpdater(cacheOwner: ModuleCacheOwner) {
  const queryClient = useQueryClient();
  const runtimeMutationKey = getRuntimeMutationPayloadQueryKey(cacheOwner);

  const stateQuery = useQuery<ModuleCacheEnvelope<unknown> | null>({
    queryKey: cacheOwner.queryKeys.state,
    queryFn: async () =>
      queryClient.getQueryData<ModuleCacheEnvelope<unknown>>(
        cacheOwner.queryKeys.state,
      ) ?? null,
    enabled: false,
    staleTime: Infinity,
  });

  const runtimeMutationQuery = useQuery<RuntimeMutationPayloadCacheEntry | null>(
    {
      queryKey: runtimeMutationKey,
      queryFn: async () =>
        readRuntimeMutationPayloadCache(queryClient, runtimeMutationKey),
      enabled: false,
      staleTime: Infinity,
    },
  );

  useEffect(() => {
    synchronizeModuleActiveCache(queryClient, cacheOwner);
  }, [cacheOwner, queryClient, stateQuery.data, runtimeMutationQuery.data]);
}

export function synchronizeModuleActiveCache(
  queryClient: QueryClient,
  cacheOwner: ModuleCacheOwner,
) {
  const runtimeMutation = readRuntimeMutationPayloadCache(
    queryClient,
    getRuntimeMutationPayloadQueryKey(cacheOwner),
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

  const moduleState = queryClient.getQueryData<ModuleCacheEnvelope<unknown>>(
    cacheOwner.queryKeys.state,
  );

  if (!isModuleCacheEnvelopeForOwner(moduleState, cacheOwner)) {
    return;
  }

  queryClient.setQueryData<ModuleCacheEnvelope<unknown>>(
    cacheOwner.queryKeys.active,
    (current) => {
      if (shouldKeepActiveEnvelope(current, moduleState)) {
        return current;
      }

      return moduleState;
    },
  );
}

function getRuntimeMutationPayloadQueryKey(
  cacheOwner: ModuleCacheOwner,
): QueryKey {
  return [cacheOwner.moduleId, "mutation-payload"] as const;
}

function readRuntimeMutationPayloadCache(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  const value = queryClient.getQueryData<unknown>(queryKey);
  if (!isRuntimeMutationPayloadCacheEntry(value)) {
    return null;
  }
  return value;
}

function shouldKeepActiveEnvelope(
  current: ModuleCacheEnvelope<unknown> | undefined,
  next: ModuleCacheEnvelope<unknown>,
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
    current.payload === next.payload
  );
}

function isModuleCacheEnvelopeForOwner(
  value: unknown,
  cacheOwner: ModuleCacheOwner,
): value is ModuleCacheEnvelope<unknown> {
  const record = asRecord(value);
  return (
    record?.moduleId === cacheOwner.moduleId &&
    typeof record.sequence === "number" &&
    typeof record.receivedAt === "number" &&
    typeof record.source === "string" &&
    Object.prototype.hasOwnProperty.call(record, "payload")
  );
}

function isRuntimeMutationPayloadCacheEntry(
  value: unknown,
): value is RuntimeMutationPayloadCacheEntry {
  const record = asRecord(value);
  return (
    record?.eventType === "module:mutation-payload" &&
    typeof record.sequence === "number" &&
    typeof record.receivedAt === "number" &&
    Object.prototype.hasOwnProperty.call(record, "payload")
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}
