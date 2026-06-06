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
