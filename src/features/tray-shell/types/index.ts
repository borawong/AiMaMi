import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  CoreEnvelope,
  NotificationClientStatePayload,
} from "@/types";

export type TrayShellModuleId = "tray-shell";
export type TrayShellNotificationEnvelope =
  CoreEnvelope<NotificationClientStatePayload>;
export type TrayShellCachePayload = TrayShellNotificationEnvelope;
export type TrayShellCacheEnvelope<
  TPayload extends TrayShellCachePayload = TrayShellCachePayload,
> = ModuleCacheEnvelope<TPayload>;

export interface TrayShellActionModel {
  id: "focus-main-window";
  labelKey: "trayShell.focusMainWindow";
  displayKey: "tray.openMain";
  run: () => Promise<void> | void;
  isPending: boolean;
}

export type TrayShellMetricModel =
  | {
      id: "client";
      labelKey: "trayShell.client";
      kind: "client";
      value: string;
      loading?: boolean;
    }
  | {
      id: "ready";
      labelKey: "trayShell.ready";
      kind: "ready";
      value: boolean;
    };

export type TrayShellRuntimeRowModel =
  | {
      id: "client";
      labelKey: "trayShell.client";
      value: string;
      valueKey?: undefined;
    }
  | {
      id: "ready";
      labelKey: "trayShell.ready";
      value?: undefined;
      valueKey: "common.success" | "common.error";
    };

export interface TrayShellRuntimePanelModel {
  titleKey: "trayShell.notificationClient";
  refreshing: boolean;
  rows: TrayShellRuntimeRowModel[];
}

export interface TrayShellPageController {
  focusAction: TrayShellActionModel;
  metrics: TrayShellMetricModel[];
  runtimePanel: TrayShellRuntimePanelModel;
}

export interface TrayShellViewProps {
  controller: TrayShellPageController;
}

export interface TrayShellHeaderProps {
  focusAction: TrayShellActionModel;
}

export interface TrayShellMetricsProps {
  metrics: TrayShellMetricModel[];
}

export interface TrayShellMetricProps {
  metric: TrayShellMetricModel;
}

export interface TrayShellRuntimePanelProps {
  panel: TrayShellRuntimePanelModel;
}

export interface TrayShellRuntimeRowProps {
  row: TrayShellRuntimeRowModel;
}
