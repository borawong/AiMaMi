import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { systemService } from "@/services/system";
import { TrayShellCache } from "../cache";
import type { NotificationClientStatePayload } from "@/types";
import type {
  TrayShellActionModel,
  TrayShellMetricModel,
  TrayShellPageController,
  TrayShellRuntimeRowModel,
} from "../types";
import {
  selectTrayShellClient,
  selectTrayShellReady,
} from "../utils";

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
    onSuccess: () => {
      void TrayShellCache.invalidateContractQueries(queryClient);
    },
  });

  const focusAction: TrayShellActionModel = {
    id: "focus-main-window",
    labelKey: "trayShell.focusMainWindow",
    run: () => focusMutation.mutateAsync(),
    isPending: focusMutation.isPending,
  };

  return {
    notificationQuery,
    focusAction,
  };
}

export function useTrayShellPageController(): TrayShellPageController {
  const module = useTrayShellModule();
  const notification: NotificationClientStatePayload | null =
    module.notificationQuery.data?.data ?? null;
  const connected = selectTrayShellReady(notification);
  const client = selectTrayShellClient(notification);

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
