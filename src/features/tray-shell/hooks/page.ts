import type { NotificationClientStatePayload } from "@/types";
import type {
  TrayShellMetricModel,
  TrayShellPageController,
  TrayShellRuntimeRowModel,
} from "../types";
import {
  selectTrayShellClient,
  selectTrayShellReady,
} from "../utils";
import { useTrayShellFocusMainWindowAction } from "./mutation";
import { useTrayShellNotificationQuery } from "./query";

export function useTrayShellModule() {
  const notificationQuery = useTrayShellNotificationQuery();
  const focusAction = useTrayShellFocusMainWindowAction();

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
