import type { ModuleCacheEnvelope } from "@/features/_shared/cache";

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

export interface MaintenanceActionResult {
  type: "success" | "error";
  message: string;
}
