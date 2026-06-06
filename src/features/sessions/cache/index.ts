import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type { ModuleCacheEnvelope, ModuleCacheSource } from "@/features/_shared/cache";
import type { SessionsCachePayload } from "../types";

export const SessionsCache = createModuleCacheOwner<SessionsCachePayload>("sessions");
export const SessionsQueryKeys = SessionsCache.queryKeys;
export const writeSessionsAuthoritativePayload = SessionsCache.writeAuthoritativePayload;
export const invalidateSessionsContractQueries = SessionsCache.invalidateContractQueries;

export const SessionsDumpedQueryKeys = {
  sessions: ["sessions"] as const,
  usageAnalytics: ["usage-analytics"] as const,
  sessionAnalytics: (range: "today" | "week" | "month") =>
    ["session-analytics", range] as const,
};

export const SessionsAuthoritativeQueryKeys = {
  sessions: ["sessions", "authoritative"] as const,
};

export interface SessionsCacheWrite<TPayload> {
  payload: TPayload;
  source: ModuleCacheSource;
  sequence: number;
  receivedAt: number;
}

export function writeSessionsListPayload<TPayload extends SessionsCachePayload>(
  queryClient: QueryClient,
  write: SessionsCacheWrite<TPayload>,
) {
  return writeAuthoritativeEnvelope(queryClient, SessionsAuthoritativeQueryKeys.sessions, write);
}

export function writeSessionsMutationPayload<TPayload extends SessionsCachePayload>(
  queryClient: QueryClient,
  write: SessionsCacheWrite<TPayload>,
) {
  const envelope = SessionsCache.writeAuthoritativePayload(queryClient, write);
  queryClient.setQueryData(SessionsCache.queryKeys.mutation, envelope);
  fenceAuthoritativeEnvelope(queryClient, SessionsAuthoritativeQueryKeys.sessions, envelope);
  return envelope;
}

export async function invalidateSessionsDumpedQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: SessionsDumpedQueryKeys.sessions }),
    queryClient.refetchQueries({
      queryKey: SessionsDumpedQueryKeys.usageAnalytics,
      type: "active",
    }),
  ]);
}

function writeAuthoritativeEnvelope<TPayload extends SessionsCachePayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  write: SessionsCacheWrite<TPayload>,
) {
  const next: ModuleCacheEnvelope<TPayload> = {
    moduleId: "sessions",
    ...write,
    mutationFenceAt: write.source === "mutation-payload" ? write.receivedAt : undefined,
  };

  queryClient.setQueryData<ModuleCacheEnvelope<SessionsCachePayload>>(queryKey, (current) => {
    if (isStaleEnvelope(current, next)) return current;
    return {
      ...next,
      mutationFenceAt: next.mutationFenceAt ?? current?.mutationFenceAt,
    };
  });

  return next;
}

function fenceAuthoritativeEnvelope(
  queryClient: QueryClient,
  queryKey: QueryKey,
  mutationEnvelope: ModuleCacheEnvelope<SessionsCachePayload>,
) {
  queryClient.setQueryData<ModuleCacheEnvelope<SessionsCachePayload>>(queryKey, (current) => {
    if (!current) {
      return {
        ...mutationEnvelope,
        payload: null,
      };
    }
    return {
      ...current,
      sequence: Math.max(current.sequence, mutationEnvelope.sequence),
      mutationFenceAt: mutationEnvelope.receivedAt,
    };
  });
}

function isStaleEnvelope(
  current: ModuleCacheEnvelope<SessionsCachePayload> | undefined,
  next: ModuleCacheEnvelope<SessionsCachePayload>,
) {
  if (!current) return false;
  if (next.sequence < current.sequence) return true;
  if (
    current.mutationFenceAt &&
    next.source !== "mutation-payload" &&
    next.receivedAt < current.mutationFenceAt
  ) {
    return true;
  }
  return next.source === "replay" && next.receivedAt <= current.receivedAt;
}
