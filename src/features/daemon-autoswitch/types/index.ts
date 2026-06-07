import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  AutoSwitchConfigPayload,
  BootstrapStatePayload,
  CoreEnvelope,
  DaemonRunPayload,
  PendingAutoSwitchStatePayload,
} from "@/types";

export type DaemonAutoswitchModuleId = "daemon-autoswitch";
export type DaemonAutoswitchBootstrapEnvelope =
  CoreEnvelope<BootstrapStatePayload>;
export type DaemonAutoswitchPendingEnvelope =
  CoreEnvelope<PendingAutoSwitchStatePayload>;
export type DaemonAutoswitchRunEnvelope = CoreEnvelope<DaemonRunPayload>;
export type DaemonAutoswitchConfigEnvelope =
  CoreEnvelope<AutoSwitchConfigPayload>;
export type DaemonAutoswitchDismissEnvelope = CoreEnvelope<string | null>;
export type DaemonAutoswitchMutationEnvelope =
  | DaemonAutoswitchRunEnvelope
  | DaemonAutoswitchConfigEnvelope
  | DaemonAutoswitchDismissEnvelope;
export type DaemonAutoswitchMutationPayload =
  DaemonAutoswitchMutationEnvelope;
export type DaemonAutoswitchCachePayload =
  | DaemonAutoswitchBootstrapEnvelope
  | DaemonAutoswitchPendingEnvelope
  | DaemonAutoswitchMutationEnvelope;
export type DaemonAutoswitchPanelPayload =
  | BootstrapStatePayload
  | PendingAutoSwitchStatePayload
  | null;
export type DaemonAutoswitchCacheEnvelope<
  TPayload extends DaemonAutoswitchCachePayload = DaemonAutoswitchCachePayload,
> = ModuleCacheEnvelope<TPayload>;

export interface DaemonAutoSwitchConfigInput {
  threshold5hPercent?: number;
  thresholdWeeklyPercent?: number;
}

export interface DaemonAutoswitchQueryState {
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  refetch?: () => unknown;
}

export type DaemonAutoswitchMetricValue =
  | {
      kind: "badge";
      value: boolean;
      trueKey: string;
      falseKey: string;
    }
  | {
      kind: "text";
      icon: "activity";
      value: string;
    }
  | {
      kind: "time";
      icon: "clock";
      value: number;
    };

export interface DaemonAutoswitchMetricModel {
  id: string;
  labelKey: string;
  value: DaemonAutoswitchMetricValue;
}

export type DaemonAutoswitchPanelModel =
  | {
      id: "bootstrap";
      titleKey: "daemonAutoswitch.bootstrap";
      state: DaemonAutoswitchQueryState;
      payload: BootstrapStatePayload | null;
      icon: "toggle";
    }
  | {
      id: "pending";
      titleKey: "daemonAutoswitch.pending";
      state: DaemonAutoswitchQueryState;
      payload: PendingAutoSwitchStatePayload | null;
      icon?: undefined;
    };

export interface DaemonAutoswitchPageController {
  metrics: DaemonAutoswitchMetricModel[];
  panels: DaemonAutoswitchPanelModel[];
}
