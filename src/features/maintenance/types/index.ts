import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  CleanPayload,
  DiagnosePayload,
  RebuildRegistryPayload,
  RelayDiagnosticIssuePayload,
  RelayDiagnosticPayload,
  RelayRouterIssueFixPayload,
  SystemInfoPayload,
} from "@/types";

export type MaintenanceModuleId = "maintenance";
export type MaintenanceImageCompatQueryKey = readonly ["imageCompat"];
export type MaintenanceSystemInfoQueryKey = readonly [
  "maintenance",
  "system-info",
];
export type MaintenanceWritableQueryKey =
  | MaintenanceImageCompatQueryKey
  | MaintenanceSystemInfoQueryKey;
export type MaintenanceQueryPayloadForKey<
  TKey extends MaintenanceWritableQueryKey,
> = TKey extends MaintenanceSystemInfoQueryKey ? SystemInfoPayload : boolean;
export type MaintenanceSystemInfoPayload = SystemInfoPayload;
export type MaintenanceQueryCachePayload =
  | {
      queryKey: MaintenanceImageCompatQueryKey;
      value: boolean;
    }
  | {
      queryKey: MaintenanceSystemInfoQueryKey;
      value: SystemInfoPayload;
    };
export type MaintenanceRouterDiagnosticItem = RelayDiagnosticIssuePayload;
export type MaintenanceRouterDiagnosticsPayload = RelayDiagnosticPayload;
export type MaintenanceRouterFixPayload = RelayRouterIssueFixPayload;
export type MaintenanceActionPayload =
  | DiagnosePayload
  | CleanPayload
  | RebuildRegistryPayload
  | MaintenanceRouterDiagnosticsPayload
  | MaintenanceRouterFixPayload;
export type MaintenanceCachePayload =
  | MaintenanceQueryCachePayload
  | MaintenanceActionPayload;
export type MaintenanceCacheEnvelope<
  TPayload extends MaintenanceCachePayload = MaintenanceCachePayload,
> = ModuleCacheEnvelope<TPayload>;

export interface MaintenanceFixIssueInput {
  itemId: string;
}

export interface MaintenanceImageCompatInput {
  enabled: boolean;
}

export interface MaintenanceActionResult {
  type: "success" | "error";
  message: string;
}
