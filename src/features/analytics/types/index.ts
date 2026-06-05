/**
 * 中文职责说明：analytics 模块只声明边界类型，未证实业务字段不在这里编造。
 */
import type { ModuleCacheEnvelope } from "@/features/_shared/module-cache";

export type AnalyticsModuleId = "analytics";
export type AnalyticsCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;
