import type { ModuleCacheEnvelope } from "@/features/_shared/cache";

export type TrayShellModuleId = "tray-shell";
export type TrayShellCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;

export interface TrayShellActionModel {
  id: string;
  labelKey: string;
  run: () => Promise<unknown> | unknown;
  isPending: boolean;
}

export interface TrayShellMetricModel {
  id: string;
  labelKey: string;
  kind: "client" | "ready";
  value: string | boolean;
  loading?: boolean;
}

export interface TrayShellRuntimeRowModel {
  id: string;
  labelKey: string;
  valueKey?: string;
  value?: string;
}

export interface TrayShellRuntimePanelModel {
  titleKey: string;
  refreshing: boolean;
  rows: TrayShellRuntimeRowModel[];
}

export interface TrayShellPageController {
  focusAction: TrayShellActionModel;
  metrics: TrayShellMetricModel[];
  runtimePanel: TrayShellRuntimePanelModel;
}
