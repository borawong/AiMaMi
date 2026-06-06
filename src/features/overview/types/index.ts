/**
 * 中文职责说明：overview 模块只声明边界类型，未证实业务字段不在这里编造。
 */
import type { ModuleCacheEnvelope } from "@/features/_shared/module-cache";

export type OverviewModuleId = "overview";
export type OverviewCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;
