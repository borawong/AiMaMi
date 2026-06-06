import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type { ModuleCacheEnvelope, ModuleCacheSource } from "@/features/_shared/cache";

export const AccountsCache = createModuleCacheOwner("accounts");
export const AccountsQueryKeys = AccountsCache.queryKeys;
export const writeAccountsAuthoritativePayload = AccountsCache.writeAuthoritativePayload;
export const invalidateAccountsContractQueries = AccountsCache.invalidateContractQueries;

export const AccountsDumpedQueryKeys = {
  snapshot: ["accounts"] as const,
  runtimeDisplay: ["runtime-state", "display"] as const,
  quotaHistory: ["quota-history"] as const,
};

export const AccountsAuthoritativeQueryKeys = {
  snapshot: ["accounts", "snapshot", "authoritative"] as const,
};

export interface AccountsCacheWrite<TPayload> {
  payload: TPayload;
  source: ModuleCacheSource;
  sequence: number;
  receivedAt: number;
}

export function writeAccountsSnapshotPayload<TPayload>(
  queryClient: QueryClient,
  write: AccountsCacheWrite<TPayload>,
) {
  return writeAuthoritativeEnvelope(queryClient, AccountsAuthoritativeQueryKeys.snapshot, write);
}

export function writeAccountsMutationPayload<TPayload>(
  queryClient: QueryClient,
  write: AccountsCacheWrite<TPayload>,
) {
  const envelope = AccountsCache.writeAuthoritativePayload(queryClient, write);
  queryClient.setQueryData(AccountsCache.queryKeys.mutation, envelope);
  fenceAuthoritativeEnvelope(queryClient, AccountsAuthoritativeQueryKeys.snapshot, envelope);
  return envelope;
}

export async function invalidateAccountsDumpedQueries(queryClient: QueryClient) {
  await Promise.all([
    AccountsCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: AccountsDumpedQueryKeys.runtimeDisplay }),
    queryClient.invalidateQueries({ queryKey: AccountsDumpedQueryKeys.quotaHistory }),
  ]);
}

function writeAuthoritativeEnvelope<TPayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  write: AccountsCacheWrite<TPayload>,
) {
  const next: ModuleCacheEnvelope<TPayload> = {
    moduleId: "accounts",
    ...write,
    mutationFenceAt: write.source === "mutation-payload" ? write.receivedAt : undefined,
  };

  queryClient.setQueryData<ModuleCacheEnvelope<unknown>>(queryKey, (current) => {
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
  mutationEnvelope: ModuleCacheEnvelope<unknown>,
) {
  queryClient.setQueryData<ModuleCacheEnvelope<unknown>>(queryKey, (current) => {
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
  current: ModuleCacheEnvelope<unknown> | undefined,
  next: ModuleCacheEnvelope<unknown>,
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
