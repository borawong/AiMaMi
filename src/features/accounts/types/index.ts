import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  AccountExportPayload,
  AccountImportPayload,
  AccountImportPreviewPayload,
  AccountMonitorPayload,
  AccountSessionImportPayload,
  AccountSummaryPayload,
  CoreEnvelope,
  CoreSnapshotPayload,
  LogoutPayload,
  RemovePayload,
  SwitchPayload,
} from "@/types";

export type AccountsModuleId = "accounts";
export type AccountsMutationPayload =
  | AccountMonitorPayload
  | SwitchPayload
  | RemovePayload
  | LogoutPayload
  | AccountImportPayload
  | AccountSessionImportPayload
  | AccountExportPayload
  | AccountImportPreviewPayload;
export type AccountsMutationEnvelope = CoreEnvelope<AccountsMutationPayload>;
export type AccountsSnapshotEnvelope = CoreEnvelope<CoreSnapshotPayload>;
export type AccountsCachePayload =
  | AccountsSnapshotEnvelope
  | AccountsMutationEnvelope
  | null;
export type AccountsCacheEnvelope<TPayload = AccountsCachePayload> =
  ModuleCacheEnvelope<TPayload>;
export type AccountRecord = AccountSummaryPayload | Record<string, unknown>;
export type AccountQuotaWindowSlot = "primaryWindow" | "secondaryWindow";

export const ACCOUNT_PLAN_FILTERS = [
  "all",
  "free",
  "plus",
  "pro5x",
  "pro20x",
  "team",
  "business",
  "enterprise",
  "edu",
] as const;

export type AccountPlanFilter = (typeof ACCOUNT_PLAN_FILTERS)[number];

export interface AccountKeysInput {
  accountKeys: string[];
}

export interface AccountSwitchInput {
  accountKey: string;
}

export interface AccountImportSessionInput {
  sessionJson: string;
  overwriteExisting: boolean;
}

export interface AccountExportFileInput {
  targetPath: string;
  accountKeys?: string[] | null;
}

export interface AccountPreviewImportInput {
  filePath: string;
}

export interface AccountImportFileInput {
  filePath: string;
  overwriteExisting: boolean;
  selectedKeys?: string[] | null;
}

export interface AccountOpenPathInput {
  path: string;
}
