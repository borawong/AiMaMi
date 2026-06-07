import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { daemonAutoswitchService } from "@/services/daemon-autoswitch";
import {
  DAEMON_AUTOSWITCH_BOOTSTRAP_QUERY_KEY,
  DAEMON_AUTOSWITCH_PENDING_QUERY_KEY,
  invalidateDaemonAutoswitchContractQueries,
  writeDaemonAutoswitchMutationPayload,
} from "../cache";
import type { DaemonAutoswitchPageMutations } from "../types";

function cancelDaemonAutoswitchQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.cancelQueries({
      queryKey: DAEMON_AUTOSWITCH_BOOTSTRAP_QUERY_KEY,
    }),
    queryClient.cancelQueries({
      queryKey: DAEMON_AUTOSWITCH_PENDING_QUERY_KEY,
    }),
  ]);
}

async function reloadDaemonAutoswitchAfterMutation(
  queryClient: QueryClient,
) {
  await invalidateDaemonAutoswitchContractQueries(queryClient);
}

export function useDaemonAutoswitchPageMutations(): DaemonAutoswitchPageMutations {
  const queryClient = useQueryClient();

  const runOnceMutation = useMutation({
    mutationFn: () => daemonAutoswitchService.runDaemonOnce(),
    onMutate: () => cancelDaemonAutoswitchQueries(queryClient),
    onSuccess: (payload) =>
      writeDaemonAutoswitchMutationPayload(queryClient, payload),
  });

  const setAutoSwitchMutation = useMutation({
    mutationFn: (enabled: boolean) => daemonAutoswitchService.setAutoSwitch(enabled),
    onMutate: () => cancelDaemonAutoswitchQueries(queryClient),
    onSuccess: (payload) =>
      writeDaemonAutoswitchMutationPayload(queryClient, payload),
  });

  const dismissPendingMutation = useMutation({
    mutationFn: () => daemonAutoswitchService.dismissPendingAutoSwitch(),
    onMutate: () => cancelDaemonAutoswitchQueries(queryClient),
    onSuccess: (payload) =>
      writeDaemonAutoswitchMutationPayload(queryClient, payload),
  });

  const confirmPendingAndRestartMutation = useMutation({
    mutationFn: () =>
      daemonAutoswitchService.confirmPendingAutoSwitchAndRestartCodex(),
    onMutate: () => cancelDaemonAutoswitchQueries(queryClient),
    onSuccess: () => reloadDaemonAutoswitchAfterMutation(queryClient),
  });

  return {
    runOnceMutation,
    setAutoSwitchMutation,
    dismissPendingMutation,
    confirmPendingAndRestartMutation,
  };
}
