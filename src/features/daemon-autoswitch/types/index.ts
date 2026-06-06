/**
 * 中文职责说明：daemon-autoswitch 模块只声明边界类型，未证实业务字段不在这里编造。
 */
import type { ModuleCacheEnvelope } from "@/features/_shared/cache";

export type DaemonAutoswitchModuleId = "daemon-autoswitch";
export type DaemonAutoswitchCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;

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

export interface DaemonAutoswitchPanelModel {
  id: string;
  titleKey: string;
  state: DaemonAutoswitchQueryState;
  payload: unknown;
  icon?: "toggle";
}

export interface DaemonAutoswitchPageController {
  metrics: DaemonAutoswitchMetricModel[];
  panels: DaemonAutoswitchPanelModel[];
}
