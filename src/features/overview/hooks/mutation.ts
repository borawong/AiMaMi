import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accountsService } from "@/services/accounts";
import { systemService } from "@/services/system";
import type { MysteryRouteGrant } from "@/types";
import {
  OVERVIEW_MYSTERY_GRANTS_QUERY_KEY,
  OVERVIEW_SNAPSHOT_QUERY_KEY,
  invalidateOverviewMysteryGrantsQueries,
  invalidateOverviewUsageMutationQueries,
  prepareOverviewMutation,
  readOverviewMutationSequence,
  writeOverviewMutationPayload,
  writeOverviewMysteryGrantsPayload,
} from "../cache";
import type { OverviewMutationController } from "../types";

export function useOverviewPageMutations(): OverviewMutationController {
  const queryClient = useQueryClient();

  const refreshUsageMutation = useMutation({
    mutationFn: () => accountsService.refreshUsageSnapshot(),
    onMutate: () =>
      prepareOverviewMutation(queryClient, [OVERVIEW_SNAPSHOT_QUERY_KEY]),
    onSuccess: async (payload, _variables, context) => {
      await writeOverviewMutationPayload(
        queryClient,
        OVERVIEW_SNAPSHOT_QUERY_KEY,
        payload,
        readOverviewMutationSequence(context, OVERVIEW_SNAPSHOT_QUERY_KEY),
      );
      await invalidateOverviewUsageMutationQueries(queryClient);
    },
  });

  const focusMainWindowMutation = useMutation({
    mutationFn: () => systemService.focusMainWindow(),
  });

  const remoteDeviceSecretMutation = useMutation({
    mutationFn: () => systemService.getOrCreateRemoteDeviceSecret(),
  });

  const importRemoteSecretMutation = useMutation({
    mutationFn: (secret: string) =>
      systemService.importRemoteDeviceSecretIfEmpty(secret.trim()),
    onMutate: () =>
      prepareOverviewMutation(queryClient, [OVERVIEW_MYSTERY_GRANTS_QUERY_KEY]),
    onSuccess: async () => {
      await invalidateOverviewMysteryGrantsQueries(queryClient);
    },
  });

  const mergeMysteryGrantsMutation = useMutation({
    mutationFn: (grants: MysteryRouteGrant[]) =>
      systemService.mergeMysteryUnlockGrants(grants),
    onMutate: () =>
      prepareOverviewMutation(queryClient, [OVERVIEW_MYSTERY_GRANTS_QUERY_KEY]),
    onSuccess: async (payload, _variables, context) => {
      await writeOverviewMysteryGrantsPayload(
        queryClient,
        payload,
        readOverviewMutationSequence(context, OVERVIEW_MYSTERY_GRANTS_QUERY_KEY),
      );
    },
  });

  return {
    refreshUsageMutation,
    focusMainWindowMutation,
    remoteDeviceSecretMutation,
    importRemoteSecretMutation,
    mergeMysteryGrantsMutation,
  };
}
