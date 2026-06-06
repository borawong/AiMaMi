import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useModuleCacheController } from "@/features/_shared/controller";
import { daemonAutoswitchService } from "@/services/daemon-autoswitch";
import {
  DAEMON_AUTOSWITCH_BOOTSTRAP_QUERY_KEY,
  DAEMON_AUTOSWITCH_PENDING_QUERY_KEY,
  DaemonAutoswitchCache,
  invalidateDaemonAutoswitchContractQueries,
} from "../cache";

let daemonAutoswitchCacheSequence = 0;
let daemonAutoswitchLatestAcceptedSequence = 0;

function nextDaemonAutoswitchCacheSequence() {
  daemonAutoswitchCacheSequence += 1;
  return daemonAutoswitchCacheSequence;
}

function writeDaemonAutoswitchCachePayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
  source: "full-refresh" | "mutation-payload",
  sequence: number,
) {
  if (sequence < daemonAutoswitchLatestAcceptedSequence) {
    return false;
  }

  daemonAutoswitchLatestAcceptedSequence = sequence;
  DaemonAutoswitchCache.writeAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt: Date.now(),
  });
  return true;
}

async function runDaemonAutoswitchQuery<TPayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  load: () => Promise<TPayload>,
) {
  const sequence = nextDaemonAutoswitchCacheSequence();
  const payload = await load();
  const accepted = writeDaemonAutoswitchCachePayload(
    queryClient,
    payload,
    "full-refresh",
    sequence,
  );
  if (!accepted) {
    return queryClient.getQueryData<TPayload>(queryKey) ?? payload;
  }
  return payload;
}

async function writeDaemonAutoswitchMutationPayload(
  queryClient: QueryClient,
  payload: unknown,
) {
  const accepted = writeDaemonAutoswitchCachePayload(
    queryClient,
    payload,
    "mutation-payload",
    nextDaemonAutoswitchCacheSequence(),
  );
  if (!accepted) return;

  await invalidateDaemonAutoswitchContractQueries(queryClient);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["accounts"] }),
    queryClient.invalidateQueries({ queryKey: ["runtime-state", "display"] }),
    queryClient.invalidateQueries({ queryKey: ["quota-history"] }),
  ]);
}

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

function loadDaemonAutoswitchBootstrap(queryClient: QueryClient) {
  return runDaemonAutoswitchQuery(
    queryClient,
    DAEMON_AUTOSWITCH_BOOTSTRAP_QUERY_KEY,
    () => daemonAutoswitchService.loadBootstrapState(),
  );
}

function loadDaemonAutoswitchPending(queryClient: QueryClient) {
  return runDaemonAutoswitchQuery(
    queryClient,
    DAEMON_AUTOSWITCH_PENDING_QUERY_KEY,
    () => daemonAutoswitchService.loadPendingAutoSwitch(),
  );
}

export function useDaemonAutoswitchCacheController() {
  return useModuleCacheController(DaemonAutoswitchCache);
}

export function useDaemonAutoswitchBootstrapQuery() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: DAEMON_AUTOSWITCH_BOOTSTRAP_QUERY_KEY,
    queryFn: () => loadDaemonAutoswitchBootstrap(queryClient),
    staleTime: 30_000,
  });
}

export function useDaemonAutoswitchPendingQuery() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: DAEMON_AUTOSWITCH_PENDING_QUERY_KEY,
    queryFn: () => loadDaemonAutoswitchPending(queryClient),
    staleTime: 30_000,
  });
}

export function useDaemonAutoswitchPendingPrompt() {
  const queryClient = useQueryClient();
  const pendingQuery = useDaemonAutoswitchPendingQuery();
  const writePendingMutationPayload = useCallback(
    async (payload: unknown) => {
      queryClient.setQueryData(DAEMON_AUTOSWITCH_PENDING_QUERY_KEY, payload);
      await writeDaemonAutoswitchMutationPayload(queryClient, payload);
    },
    [queryClient],
  );

  useEffect(() => {
    return daemonAutoswitchService.subscribePendingAutoSwitch(() => {
      void queryClient.invalidateQueries({
        queryKey: DAEMON_AUTOSWITCH_PENDING_QUERY_KEY,
        type: "active",
      });
    });
  }, [queryClient]);

  const dismissPendingMutation = useMutation({
    mutationFn: () => daemonAutoswitchService.dismissPendingAutoSwitch(),
    onMutate: () => cancelDaemonAutoswitchQueries(queryClient),
    onSuccess: writePendingMutationPayload,
  });

  const confirmPendingAndRestartMutation = useMutation({
    mutationFn: () =>
      daemonAutoswitchService.confirmPendingAutoSwitchAndRestartCodex(),
    onMutate: () => cancelDaemonAutoswitchQueries(queryClient),
    onSuccess: writePendingMutationPayload,
  });

  return {
    pendingQuery,
    dismissPendingAction: {
      id: "dismiss-pending",
      labelKey: "daemonAutoswitch.dismissPending",
      run: () => dismissPendingMutation.mutateAsync(),
      isPending: dismissPendingMutation.isPending,
    },
    confirmPendingAndRestartAction: {
      id: "confirm-pending-restart",
      labelKey: "daemonAutoswitch.confirmPendingRestart",
      run: () => confirmPendingAndRestartMutation.mutateAsync(),
      isPending: confirmPendingAndRestartMutation.isPending,
    },
  };
}

export function useDaemonAutoswitchModule() {
  const queryClient = useQueryClient();
  const writeDaemonPayload = (payload: unknown) =>
    writeDaemonAutoswitchMutationPayload(queryClient, payload);

  const bootstrapQuery = useDaemonAutoswitchBootstrapQuery();
  const pendingQuery = useDaemonAutoswitchPendingQuery();

  const runOnceMutation = useMutation({
    mutationFn: () => daemonAutoswitchService.runDaemonOnce(),
    onMutate: () => cancelDaemonAutoswitchQueries(queryClient),
    onSuccess: writeDaemonPayload,
  });

  const setAutoSwitchMutation = useMutation({
    mutationFn: (enabled: boolean) => daemonAutoswitchService.setAutoSwitch(enabled),
    onMutate: () => cancelDaemonAutoswitchQueries(queryClient),
    onSuccess: writeDaemonPayload,
  });

  return {
    bootstrapQuery,
    pendingQuery,
    runOnceAction: {
      id: "run-once",
      labelKey: "daemonAutoswitch.runOnce",
      run: () => runOnceMutation.mutateAsync(),
      isPending: runOnceMutation.isPending,
    },
    setAutoSwitchAction: {
      run: (enabled: boolean) => setAutoSwitchMutation.mutateAsync(enabled),
      isPending: setAutoSwitchMutation.isPending,
    },
  };
}
