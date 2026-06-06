import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { Route } from "@/types/navigation";

export type ModuleCacheSource =
  | "full-refresh"
  | "active-only-refresh"
  | "runtime-event"
  | "mutation-payload"
  | "replay";

export interface ModuleCacheEnvelope<TPayload> {
  moduleId: Route;
  payload: TPayload;
  source: ModuleCacheSource;
  sequence: number;
  receivedAt: number;
  mutationFenceAt?: number;
}

export type ModuleCachePayloadGuard<TPayload> = (value: unknown) => value is TPayload;

export type ModuleCacheWriteEnvelope<TPayload> = Omit<
  ModuleCacheEnvelope<TPayload>,
  "moduleId"
>;

export interface ModuleCacheOwnerOptions<TPayload> {
  isPayload?: ModuleCachePayloadGuard<TPayload>;
}

export interface ModuleCacheOwner<TPayload = unknown> {
  moduleId: Route;
  queryKeys: {
    root: QueryKey;
    state: QueryKey;
    active: QueryKey;
    mutation: QueryKey;
  };
  isPayload?: ModuleCachePayloadGuard<TPayload>;
  writeAuthoritativePayload: <TNextPayload extends TPayload>(
    queryClient: QueryClient,
    envelope: ModuleCacheWriteEnvelope<TNextPayload>,
  ) => ModuleCacheEnvelope<TNextPayload>;
  invalidateContractQueries: (queryClient: QueryClient) => Promise<void>;
}

export function createModuleCacheOwner<TPayload = unknown>(
  moduleId: Route,
  options: ModuleCacheOwnerOptions<TPayload> = {},
): ModuleCacheOwner<TPayload> {
  const queryKeys = {
    root: [moduleId] as const,
    state: [moduleId, "state"] as const,
    active: [moduleId, "active"] as const,
    mutation: [moduleId, "mutation"] as const,
  };

  return {
    moduleId,
    queryKeys,
    isPayload: options.isPayload,
    writeAuthoritativePayload: <TNextPayload extends TPayload>(
      queryClient: QueryClient,
      envelope: ModuleCacheWriteEnvelope<TNextPayload>,
    ) => {
      const next: ModuleCacheEnvelope<TNextPayload> = {
        ...envelope,
        moduleId,
        mutationFenceAt:
          envelope.source === "mutation-payload" ? envelope.receivedAt : envelope.mutationFenceAt,
      };

      queryClient.setQueryData<ModuleCacheEnvelope<TPayload>>(queryKeys.state, (current) => {
        if (isStaleEnvelope(current, next)) {
          return current;
        }
        return {
          ...next,
          mutationFenceAt: next.mutationFenceAt ?? current?.mutationFenceAt,
        };
      });

      return next;
    },
    invalidateContractQueries: async (queryClient) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.root });
    },
  };
}

function isStaleEnvelope<TCurrentPayload, TNextPayload>(
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

  return next.source === "replay" && next.receivedAt <= current.receivedAt;
}
