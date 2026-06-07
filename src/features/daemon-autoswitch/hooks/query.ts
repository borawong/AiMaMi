import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { daemonAutoswitchService } from "@/services/daemon-autoswitch";
import {
  DAEMON_AUTOSWITCH_BOOTSTRAP_QUERY_KEY,
  DAEMON_AUTOSWITCH_PENDING_QUERY_KEY,
  DaemonAutoswitchCache,
  runDaemonAutoswitchQuery,
} from "../cache";
import type { DaemonAutoswitchPageQueries } from "../types";

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

export function useDaemonAutoswitchPageQueries(): DaemonAutoswitchPageQueries {
  const bootstrapQuery = useDaemonAutoswitchBootstrapQuery();
  const pendingQuery = useDaemonAutoswitchPendingQuery();

  return {
    bootstrapQuery,
    pendingQuery,
  };
}
