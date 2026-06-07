import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { accountsService } from "@/services/accounts";
import {
  AccountsAuthoritativeQueryKeys,
  AccountsCache,
  AccountsDumpedQueryKeys,
  nextAccountsCacheSequence,
  writeAccountsSnapshotPayload,
} from "../cache";
import type {
  AccountsCacheEnvelope,
  AccountsPageQueries,
  AccountsSnapshotEnvelope,
} from "../types";

export function useAccountsCacheController() {
  return useModuleCacheController(AccountsCache);
}

export function useAccountsPageQueries(): AccountsPageQueries {
  const queryClient = useQueryClient();

  const snapshotEnvelopeQuery = useQuery<AccountsCacheEnvelope | null>({
    queryKey: AccountsAuthoritativeQueryKeys.snapshot,
    queryFn: async () =>
      queryClient.getQueryData<AccountsCacheEnvelope>(
        AccountsAuthoritativeQueryKeys.snapshot,
      ) ?? null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const snapshotQuery = useQuery<AccountsSnapshotEnvelope>({
    queryKey: AccountsDumpedQueryKeys.snapshot,
    queryFn: async () => {
      const sequence = nextAccountsCacheSequence();
      const payload = await accountsService.loadSnapshot(true);
      writeAccountsSnapshotPayload(queryClient, {
        payload,
        source: "full-refresh",
        sequence,
        receivedAt: Date.now(),
      });
      return payload;
    },
    staleTime: 30_000,
  });

  return {
    snapshotEnvelope: snapshotEnvelopeQuery.data,
    snapshotQuery,
    refreshSnapshot: async () => {
      await snapshotQuery.refetch();
    },
  };
}
