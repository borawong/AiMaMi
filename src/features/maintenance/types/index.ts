/**
 * 中文职责说明：maintenance 模块只声明边界类型，未证实业务字段不在这里编造。
 */
import type { ModuleCacheEnvelope } from "@/features/_shared/module-cache";

export type MaintenanceModuleId = "maintenance";
export type MaintenanceCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;

export interface MaintenanceFixIssueInput {
  itemId: string;
}

export interface MaintenanceImageCompatInput {
  enabled: boolean;
}

export interface MaintenanceRouterDiagnosticItem {
  id: string;
  label: string;
  status: string;
  fixable: boolean;
  detail?: string;
}

export interface MaintenanceRouterDiagnosticsPayload {
  hasIssues: boolean;
  items: MaintenanceRouterDiagnosticItem[];
}

export interface MaintenanceRouterFixPayload {
  details: string[];
}
