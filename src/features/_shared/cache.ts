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

export interface ModuleCacheOwner {
  moduleId: Route;
  queryKeys: {
    root: QueryKey;
    state: QueryKey;
    active: QueryKey;
    mutation: QueryKey;
  };
  writeAuthoritativePayload: <TPayload>(
    queryClient: QueryClient,
    envelope: Omit<ModuleCacheEnvelope<TPayload>, "moduleId">,
  ) => ModuleCacheEnvelope<TPayload>;
  invalidateContractQueries: (queryClient: QueryClient) => Promise<void>;
}

export function createModuleCacheOwner(moduleId: Route): ModuleCacheOwner {
  const queryKeys = {
    root: [moduleId] as const,
    state: [moduleId, "state"] as const,
    active: [moduleId, "active"] as const,
    mutation: [moduleId, "mutation"] as const,
  };

  return {
    moduleId,
    queryKeys,
    writeAuthoritativePayload: (queryClient, envelope) => {
      const next = {
        ...envelope,
        moduleId,
        mutationFenceAt:
          envelope.source === "mutation-payload" ? envelope.receivedAt : envelope.mutationFenceAt,
      };

      queryClient.setQueryData<ModuleCacheEnvelope<unknown>>(queryKeys.state, (current) => {
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

function isStaleEnvelope(
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

  return next.source === "replay" && next.receivedAt <= current.receivedAt;
}
