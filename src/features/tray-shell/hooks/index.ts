import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { systemService } from "@/services/system";
import { TrayShellCache } from "../cache";
import type {
  TrayShellMetricModel,
  TrayShellPageController,
  TrayShellRuntimeRowModel,
} from "../types";
import { envelopeData, readBoolean, readString } from "../utils";

export function useTrayShellCacheController() {
  return useModuleCacheController(TrayShellCache);
}

export function useTrayShellModule() {
  const queryClient = useQueryClient();

  const notificationQuery = useQuery({
    queryKey: [...TrayShellCache.queryKeys.root, "notification-client"],
    queryFn: () => systemService.getNotificationClientState(),
    staleTime: 30_000,
  });

  const focusMutation = useMutation({
    mutationFn: () => systemService.focusMainWindow(),
    onSuccess: (payload) => {
      TrayShellCache.writeAuthoritativePayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: Date.now(),
        receivedAt: Date.now(),
      });
      void TrayShellCache.invalidateContractQueries(queryClient);
    },
  });

  return {
    notificationQuery,
    focusAction: {
      id: "focus-main-window",
      labelKey: "trayShell.focusMainWindow",
      run: () => focusMutation.mutateAsync(),
      isPending: focusMutation.isPending,
    },
  };
}

export function useTrayShellPageController(): TrayShellPageController {
  const module = useTrayShellModule();
  const notification = envelopeData(module.notificationQuery.data);
  const connected = readBoolean(notification, ["connected", "enabled", "ready"]);
  const client = readString(notification, ["client", "name", "id"], "-");

  const metrics: TrayShellMetricModel[] = [
    {
      id: "client",
      labelKey: "trayShell.client",
      kind: "client",
      value: client,
      loading: module.notificationQuery.isLoading,
    },
    {
      id: "ready",
      labelKey: "trayShell.ready",
      kind: "ready",
      value: connected,
    },
  ];

  const rows: TrayShellRuntimeRowModel[] = [
    {
      id: "client",
      labelKey: "trayShell.client",
      value: client,
    },
    {
      id: "ready",
      labelKey: "trayShell.ready",
      valueKey: connected ? "common.success" : "common.error",
    },
  ];

  return {
    focusAction: module.focusAction,
    metrics,
    runtimePanel: {
      titleKey: "trayShell.notificationClient",
      refreshing: module.notificationQuery.isFetching,
      rows,
    },
  };
}
