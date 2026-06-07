import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  AccountExportDialogInput as AccountExportDialogServiceInput,
  AccountExportDialogResult as AccountExportDialogServiceResult,
  AccountPreviewImportDialogInput as AccountPreviewImportDialogServiceInput,
  AccountPreviewImportDialogResult as AccountPreviewImportDialogServiceResult,
} from "@/services/accounts";
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

export type AccountExportDialogInput = AccountExportDialogServiceInput;
export type AccountExportDialogResult = AccountExportDialogServiceResult;

export interface AccountPreviewImportInput {
  filePath: string;
}

export type AccountPreviewImportDialogInput =
  AccountPreviewImportDialogServiceInput;
export type AccountPreviewImportDialogResult =
  AccountPreviewImportDialogServiceResult;

export interface AccountImportFileInput {
  filePath: string;
  overwriteExisting: boolean;
  selectedKeys?: string[] | null;
}

export interface AccountOpenPathInput {
  path: string;
}

export interface AccountsSnapshotQueryController {
  data: AccountsSnapshotEnvelope | undefined;
  error: unknown;
  isError: boolean;
  isFetching: boolean;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
}

export interface AccountsPageQueries {
  snapshotEnvelope: AccountsCacheEnvelope | null | undefined;
  snapshotQuery: AccountsSnapshotQueryController;
  refreshSnapshot: () => Promise<void>;
}

export interface AccountsAction<TResult = void> {
  run: () => Promise<TResult>;
  isPending: boolean;
}

export interface AccountsNamedAction<TResult = void>
  extends AccountsAction<TResult> {
  id: string;
  labelKey: string;
}

export interface AccountsInputAction<TInput, TResult = void> {
  run: (input: TInput) => Promise<TResult>;
  isPending: boolean;
}

export interface AccountsPageMutations {
  refreshUsageSnapshotAction: AccountsNamedAction<void>;
  attachMonitorAction: AccountsNamedAction<AccountsMutationEnvelope>;
  switchAccount: AccountsInputAction<AccountSwitchInput, AccountsMutationEnvelope>;
  switchAccountAndRestart: AccountsInputAction<
    AccountSwitchInput,
    AccountsMutationEnvelope
  >;
  removeAccounts: AccountsInputAction<AccountKeysInput, AccountsMutationEnvelope>;
  logout: AccountsAction<AccountsMutationEnvelope>;
  importChatGptSessionAccount: AccountsInputAction<
    AccountImportSessionInput,
    AccountsMutationEnvelope
  >;
  exportAccountsToFile: AccountsInputAction<
    AccountExportFileInput,
    AccountsMutationEnvelope
  >;
  exportAccountsToFileWithDialog: AccountsInputAction<
    AccountExportDialogInput,
    AccountExportDialogResult
  >;
  previewAccountImport: AccountsInputAction<
    AccountPreviewImportInput,
    AccountsMutationEnvelope
  >;
  previewAccountImportWithDialog: AccountsInputAction<
    AccountPreviewImportDialogInput,
    AccountPreviewImportDialogResult
  >;
  importAccountsFromFile: AccountsInputAction<
    AccountImportFileInput,
    AccountsMutationEnvelope
  >;
}

export interface AccountsPathActions {
  openPath: AccountsInputAction<AccountOpenPathInput, void>;
}

export interface AccountsModuleController
  extends AccountsPageMutations,
    AccountsPathActions {
  snapshotEnvelope: AccountsCacheEnvelope | null | undefined;
  snapshotQuery: AccountsSnapshotQueryController;
}

export interface AccountsPageController {
  module: AccountsModuleController;
  query: string;
  setQuery: (query: string) => void;
  planFilter: AccountPlanFilter;
  setPlanFilter: (planFilter: AccountPlanFilter) => void;
  planFilters: readonly AccountPlanFilter[];
  accounts: AccountRecord[];
  filteredAccounts: AccountRecord[];
  selectedKey: string | null;
  effectiveSelectedKey: string;
  selectedAccount: AccountRecord | null;
  activeAccount: AccountRecord | null;
  apiReachability: string;
  loading: boolean;
  error: unknown;
  isFetching: boolean;
  isRefreshing: boolean;
  selectAccount: (accountKey: string) => void;
  refresh: () => Promise<void>;
}
