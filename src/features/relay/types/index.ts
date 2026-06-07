import type { Dispatch, SetStateAction } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  RelayExportDialogInput,
  RelayImportDialogInput,
  RelayNetworkConfig,
  RelayProviderDraft as RelayProviderDraftInput,
} from "@/services/relay";
import type { RelayRouterToggleProgress } from "../cache";
import type {
  CoreEnvelope,
  RelayActivePayload,
  RelayDiagnosticPayload,
  RelayExportPayload,
  RelayImportPayload,
  RelayPassthroughAuditEntry,
  RelayProviderPayload,
  RelayProxyPayload,
  RelayRouterIssueFixPayload,
  RelayRouterTogglePayload,
  RelayStatePayload,
  RelayTestPayload,
} from "@/types";

export type RelayModuleId = "relay";
export type RelayQueryDataPayload =
  | RelayStatePayload
  | RelayActivePayload
  | RelayProxyPayload
  | RelayPassthroughAuditEntry[];
export type RelayMutationDataPayload =
  | RelayProviderPayload
  | RelayStatePayload
  | RelayTestPayload
  | string[]
  | RelayRouterTogglePayload
  | boolean
  | RelayExportPayload
  | RelayImportPayload
  | RelayDiagnosticPayload
  | RelayRouterIssueFixPayload;
export type RelayCacheDataPayload =
  | RelayQueryDataPayload
  | RelayMutationDataPayload;
export type RelayCachePayload = CoreEnvelope<RelayCacheDataPayload>;
export type RelayKnownQueryPayload =
  | RelayStatePayload
  | RelayActivePayload
  | RelayProxyPayload;
export type RelayCacheEnvelope<
  TPayload extends RelayCachePayload = RelayCachePayload,
> =
  ModuleCacheEnvelope<TPayload>;

export type WireApi = "openai-responses" | "anthropic" | "openai-chat";
export type RelayNetworkMode = "system" | "direct";

export type RelayProviderForm = {
  id?: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  apiKeyStored: boolean;
  model: string;
  wireApi: WireApi;
  extraHeaders: string;
  network: RelayNetworkMode;
};

export type RelayProviderRow = RelayProviderForm & {
  rowId: string;
  ide: string;
  active: boolean;
  latencyMs: number;
  lastError: string;
};

export type RelayProviderPreset = {
  slug: string;
  name: string;
  initial: string;
  color: string;
  baseUrl: string;
  defaultModel: string;
  wireApi: WireApi;
  ides: string[];
};

export type RelayProviderDraft = RelayProviderDraftInput;

export type RelayProviderIdeInput = {
  providerId: string;
  ide: string;
};

export type RelayNetworkInput = {
  providerId: string;
  network: RelayNetworkConfig;
};

export type RelayRouterInput = {
  enabled: boolean;
  relaunch: boolean;
};

export type RelayExportInput = {
  filePath: string;
  includeApiKeys: boolean;
};

export type RelayAsyncAction<TInput, TResult> = {
  run: (input: TInput) => Promise<TResult>;
  isPending: boolean;
};

export type RelayVoidAction<TResult = void> = {
  run: () => Promise<TResult>;
  isPending: boolean;
};

export type RelayQueryController = {
  stateQuery: UseQueryResult<CoreEnvelope<RelayStatePayload>, Error>;
  activeQuery: UseQueryResult<CoreEnvelope<RelayActivePayload>, Error>;
  proxyQuery: UseQueryResult<CoreEnvelope<RelayProxyPayload>, Error>;
  auditLogQuery: UseQueryResult<
    CoreEnvelope<RelayPassthroughAuditEntry[]>,
    Error
  >;
  routerToggleProgressQuery: UseQueryResult<RelayRouterToggleProgress | null, Error>;
};

export type RelayMutationController = {
  providerActions: {
    upsertProvider: RelayAsyncAction<
      RelayProviderDraft,
      CoreEnvelope<RelayProviderPayload>
    >;
    deleteProvider: RelayAsyncAction<string, CoreEnvelope<RelayStatePayload>>;
    activateProvider: RelayAsyncAction<
      RelayProviderIdeInput,
      CoreEnvelope<RelayStatePayload>
    >;
    deactivateProvider: RelayAsyncAction<
      RelayProviderIdeInput,
      CoreEnvelope<RelayStatePayload>
    >;
    setNetwork: RelayAsyncAction<
      RelayNetworkInput,
      CoreEnvelope<RelayProviderPayload>
    >;
    testProvider: RelayAsyncAction<string, CoreEnvelope<RelayTestPayload>>;
    testDraft: RelayAsyncAction<RelayProviderDraft, CoreEnvelope<RelayTestPayload>>;
    fetchModelsDraft: RelayAsyncAction<RelayProviderDraft, CoreEnvelope<string[]>>;
  };
  routerActions: {
    setCodexRouterEnabled: RelayAsyncAction<
      RelayRouterInput,
      CoreEnvelope<RelayRouterTogglePayload>
    >;
    restartCodexApp: RelayVoidAction;
    setBlockOfficialPassthrough: RelayAsyncAction<boolean, CoreEnvelope<boolean>>;
    diagnoseCodexRouter: RelayVoidAction<CoreEnvelope<RelayDiagnosticPayload>>;
    fixCodexRouterIssue: RelayAsyncAction<
      string,
      CoreEnvelope<RelayRouterIssueFixPayload>
    >;
  };
  ioActions: {
    exportConfig: RelayAsyncAction<RelayExportInput, CoreEnvelope<RelayExportPayload>>;
    exportConfigWithDialog: RelayAsyncAction<
      RelayExportDialogInput,
      CoreEnvelope<RelayExportPayload>
    >;
    importConfig: RelayAsyncAction<string, CoreEnvelope<RelayImportPayload>>;
    importConfigWithDialog: RelayAsyncAction<
      RelayImportDialogInput,
      CoreEnvelope<RelayImportPayload>
    >;
  };
  diagnosticsAction: {
    id: "diagnostics";
    labelKey: "relay.runDiagnostics";
    run: () => Promise<CoreEnvelope<RelayDiagnosticPayload>>;
    isPending: boolean;
  };
};

export type RelayModuleController = RelayQueryController &
  RelayMutationController & {
    routerToggleProgress: RelayRouterToggleProgress | null;
    isAnyMutationPending: boolean;
  };

export type RelayPageControllerActions = {
  setForm: Dispatch<SetStateAction<RelayProviderForm>>;
  openNewProvider: () => void;
  openEditor: (provider: RelayProviderRow) => void;
  openPresetDialog: () => void;
  setProviderDialogOpen: (open: boolean) => void;
  setPresetDialogOpen: Dispatch<SetStateAction<boolean>>;
  applyPreset: (preset: RelayProviderPreset) => void;
  fetchModels: () => Promise<void>;
  testDraft: () => Promise<void>;
  saveProvider: (enableAfterSave: boolean) => Promise<void>;
  toggleProvider: (provider: RelayProviderRow) => Promise<void>;
  testProvider: (provider: RelayProviderRow) => Promise<void>;
  requestNetworkEdit: (provider: RelayProviderRow) => void;
  closeNetworkDialog: (open: boolean) => void;
  setNetworkDraft: Dispatch<SetStateAction<RelayNetworkMode>>;
  saveNetwork: () => Promise<void>;
  requestDeleteProvider: (providerId: string | null) => void;
  closeDeleteDialog: (open: boolean) => void;
  deleteProvider: () => Promise<void>;
  setRouterEnabled: (enabled: boolean) => Promise<CoreEnvelope<RelayRouterTogglePayload>>;
  restartCodexApp: () => Promise<void>;
  toggleBlockPassthrough: () => Promise<CoreEnvelope<boolean>>;
  diagnoseRouter: () => Promise<CoreEnvelope<RelayDiagnosticPayload>>;
  runDiagnostics: () => Promise<CoreEnvelope<RelayDiagnosticPayload>>;
  openIoExportConfirm: () => void;
  setIoExportConfirmOpen: (open: boolean) => void;
  setIoIncludeApiKeys: Dispatch<SetStateAction<boolean>>;
  importConfig: () => Promise<void>;
  exportConfig: () => Promise<void>;
  notifyLocked: () => void;
};

export interface RelayPageController {
  module: RelayModuleController;
  state: unknown;
  active: unknown;
  proxy: unknown;
  audit: unknown;
  providers: unknown[];
  auditItems: unknown[];
  currentIde: string;
  activeProviderId: string;
  providerRows: RelayProviderRow[];
  currentProviderRows: RelayProviderRow[];
  selectedProvider: RelayProviderRow | null;
  networkProvider: RelayProviderRow | null;
  deleteProvider: RelayProviderRow | null;
  routerEnabled: boolean;
  blocked: boolean;
  proxyRunning: boolean;
  proxyBaseUrl: string;
  form: RelayProviderForm;
  providerDialogOpen: boolean;
  presetDialogOpen: boolean;
  networkDraft: RelayNetworkMode;
  modelOptions: string[];
  fetchingModels: boolean;
  testingDraft: boolean;
  testingProviderId: string | null;
  deleting: boolean;
  ioConfirmOpen: boolean;
  ioIncludeApiKeys: boolean;
  ioExporting: boolean;
  ioImporting: boolean;
  ioMenuPending: boolean;
  presetOptions: RelayProviderPreset[];
  extraHeadersInvalid: boolean;
  formValid: boolean;
  locked: boolean;
  busy: boolean;
  showRouterProgress: boolean;
  stateErrorDescription: string;
  actions: RelayPageControllerActions;
}

export interface RelayPagePanelsProps {
  controller: RelayPageController;
}

export interface RelayPageDialogsProps {
  controller: RelayPageController;
}
