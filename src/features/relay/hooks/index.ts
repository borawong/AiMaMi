import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useModuleCacheController } from "@/features/_shared/controller";
import { toast } from "@/hooks/toast";
import {
  relayService,
  type RelayExportDialogInput,
  type RelayNetworkConfig,
  type RelayImportDialogInput,
  type RelayProviderDraft,
} from "@/services/relay";
import {
  invalidateRelayContractQueries,
  RelayCache,
  RELAY_ROUTER_TOGGLE_PROGRESS_QUERY_KEY,
  RELAY_STATE_QUERY_KEY,
  type RelayRouterToggleProgress,
  writeRelayRouterToggleProgress,
} from "../cache";
import type {
  RelayNetworkMode,
  RelayProviderForm,
  RelayProviderPreset,
  RelayProviderRow,
} from "../types";
import {
  envelopeData,
  firstPath,
  normalizeNetwork,
  normalizeWireApi,
  readArray,
  readBoolean,
  readNumber,
  readString,
  validateExtraHeaders,
} from "../utils";

export function useRelayCacheController() {
  return useModuleCacheController(RelayCache);
}

type RelayMutationContext = {
  sequence: number;
  receivedAt: number;
};

type RelayProviderIdeInput = {
  providerId: string;
  ide: string;
};

type RelayNetworkInput = {
  providerId: string;
  network: RelayNetworkConfig;
};

type RelayRouterInput = {
  enabled: boolean;
  relaunch: boolean;
};

type RelayExportInput = {
  filePath: string;
  includeApiKeys: boolean;
};

const relayProxyStatusQueryKey = [...RelayCache.queryKeys.root, "proxy-status"] as const;
const relayAuditLogQueryKey = [
  ...RelayCache.queryKeys.root,
  "passthrough-audit-log",
  50,
] as const;

const RELAY_IDE = "codex";
const RELAY_BACKUP_FILTER_NAME = "Relay Backup";
const DEFAULT_PROVIDER_FORM: RelayProviderForm = {
  name: "",
  baseUrl: "",
  apiKey: "",
  apiKeyStored: false,
  model: "",
  wireApi: "openai-chat",
  extraHeaders: "",
  network: "system",
};

const RELAY_PROVIDER_PRESETS: RelayProviderPreset[] = [
  {
    slug: "packycode",
    name: "PackyCode",
    initial: "P",
    color: "#0e0e11",
    baseUrl: "https://api.packycode.com/v1",
    defaultModel: "gpt-5-codex",
    wireApi: "openai-chat",
    ides: ["codex"],
  },
  {
    slug: "dmxapi",
    name: "DMXAPI",
    initial: "D",
    color: "#1d4ed8",
    baseUrl: "https://www.dmxapi.cn/v1",
    defaultModel: "gpt-5-codex",
    wireApi: "openai-chat",
    ides: ["codex"],
  },
  {
    slug: "siliconflow",
    name: "SiliconFlow",
    initial: "S",
    color: "#7c3aed",
    baseUrl: "https://api.siliconflow.cn/v1",
    defaultModel: "deepseek-ai/DeepSeek-V3",
    wireApi: "openai-chat",
    ides: ["codex"],
  },
  {
    slug: "cubence",
    name: "Cubence",
    initial: "C",
    color: "#a16207",
    baseUrl: "https://cubence.com/v1",
    defaultModel: "gpt-5-codex",
    wireApi: "openai-responses",
    ides: ["codex"],
  },
  {
    slug: "lemondata",
    name: "LemonData",
    initial: "L",
    color: "#db2777",
    baseUrl: "https://lemondata.cc/v1",
    defaultModel: "gpt-4o",
    wireApi: "openai-chat",
    ides: ["codex"],
  },
  {
    slug: "rightcode",
    name: "RightCode",
    initial: "R",
    color: "#0891b2",
    baseUrl: "https://right.codes/v1",
    defaultModel: "gpt-5-codex",
    wireApi: "openai-chat",
    ides: ["codex"],
  },
  {
    slug: "aigocode",
    name: "AIGoCode",
    initial: "A",
    color: "#ea580c",
    baseUrl: "https://aigocode.com/v1",
    defaultModel: "gpt-4o",
    wireApi: "openai-chat",
    ides: ["codex"],
  },
  {
    slug: "openrouter",
    name: "OpenRouter",
    initial: "O",
    color: "#0f172a",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "anthropic/claude-3.5-sonnet",
    wireApi: "openai-chat",
    ides: ["codex"],
  },
  {
    slug: "newapi",
    name: "New API",
    initial: "N",
    color: "#334155",
    baseUrl: "https://your-newapi-host.com/v1",
    defaultModel: "gpt-4o",
    wireApi: "openai-chat",
    ides: ["codex"],
  },
  {
    slug: "deepseek",
    name: "DeepSeek",
    initial: "D",
    color: "#0369a1",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    wireApi: "openai-chat",
    ides: ["codex"],
  },
  {
    slug: "moonshot",
    name: "Moonshot Kimi",
    initial: "K",
    color: "#1f2937",
    baseUrl: "https://api.moonshot.cn/v1",
    defaultModel: "kimi-k2-0711-preview",
    wireApi: "openai-chat",
    ides: ["codex"],
  },
  {
    slug: "zhipu",
    name: "GLM",
    initial: "Z",
    color: "#2563eb",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-4.6",
    wireApi: "openai-chat",
    ides: ["codex"],
  },
  {
    slug: "dashscope",
    name: "DashScope",
    initial: "Q",
    color: "#7e22ce",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen3-coder-plus",
    wireApi: "openai-chat",
    ides: ["codex"],
  },
  {
    slug: "volcark",
    name: "Volcengine Ark",
    initial: "B",
    color: "#dc2626",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    defaultModel: "doubao-seed-1-6-thinking-250715",
    wireApi: "openai-chat",
    ides: ["codex"],
  },
  {
    slug: "custom",
    name: "Custom",
    initial: "+",
    color: "#475569",
    baseUrl: "",
    defaultModel: "",
    wireApi: "openai-chat",
    ides: ["codex"],
  },
];

let relayCacheSequence = 0;
let relayLatestAcceptedSequence = 0;

function nextRelayCacheSequence() {
  relayCacheSequence += 1;
  return relayCacheSequence;
}

function writeRelayCachePayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
  source: "full-refresh" | "mutation-payload",
  sequence: number,
  receivedAt = Date.now(),
) {
  if (sequence < relayLatestAcceptedSequence) {
    return false;
  }

  relayLatestAcceptedSequence = sequence;
  RelayCache.writeAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt,
  });
  return true;
}

async function runRelayQuery<TPayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  load: () => Promise<TPayload>,
) {
  const sequence = nextRelayCacheSequence();
  const payload = await load();
  if (!writeRelayCachePayload(queryClient, payload, "full-refresh", sequence)) {
    return queryClient.getQueryData<TPayload>(queryKey) ?? payload;
  }
  return payload;
}

function useRelayEvidenceMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, TVariables, RelayMutationContext>({
    mutationFn,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: RELAY_STATE_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: RelayCache.queryKeys.root });
      const receivedAt = Date.now();
      const sequence = nextRelayCacheSequence();
      return { sequence, receivedAt };
    },
    onSuccess: (payload, _variables, context) => {
      if (
        !context ||
        !writeRelayCachePayload(
          queryClient,
          payload,
          "mutation-payload",
          context.sequence,
          context.receivedAt,
        )
      ) {
        return;
      }

      writeKnownRelayQueryPayload(queryClient, payload);
      void invalidateRelayContractQueries(queryClient);
    },
  });
}

function writeKnownRelayQueryPayload(queryClient: QueryClient, payload: unknown) {
  const data = readEnvelopeData(payload);
  if (!isRecord(data)) return;

  if (hasRelayStateShape(data)) {
    writeQueryPayload(queryClient, RELAY_STATE_QUERY_KEY, payload, data);
  }

  if (hasRelayActiveShape(data)) {
    writeQueryPayload(queryClient, RelayCache.queryKeys.active, payload, data);
  }

  if (hasRelayProxyShape(data)) {
    writeQueryPayload(queryClient, relayProxyStatusQueryKey, payload, data);
  }
}

function writeQueryPayload(
  queryClient: QueryClient,
  queryKey: QueryKey,
  sourcePayload: unknown,
  data: unknown,
) {
  queryClient.setQueryData<unknown>(queryKey, (current: unknown) => {
    if (isEnvelopeRecord(current)) {
      return { ...current, data };
    }
    if (isEnvelopeRecord(sourcePayload)) {
      return { ...sourcePayload, data };
    }
    return data;
  });
}

function readEnvelopeData(value: unknown) {
  if (isRecord(value) && "data" in value) {
    return value.data ?? null;
  }
  return value ?? null;
}

function hasRelayStateShape(value: Record<string, unknown>) {
  return (
    "providers" in value ||
    "items" in value ||
    "relayProviders" in value ||
    "routerEnabled" in value ||
    "codexRouterEnabled" in value ||
    "blockOfficialPassthrough" in value ||
    "passthroughBlocked" in value
  );
}

function hasRelayActiveShape(value: Record<string, unknown>) {
  return (
    "providerId" in value ||
    "activeProviderId" in value ||
    "ide" in value ||
    "activeIde" in value
  );
}

function hasRelayProxyShape(value: Record<string, unknown>) {
  return "reachable" in value || "status" in value || "code" in value;
}

function isEnvelopeRecord(value: unknown): value is Record<string, unknown> & { data: unknown } {
  return isRecord(value) && "data" in value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseRelayRouterToggleProgress(
  payload: unknown,
): RelayRouterToggleProgress | null {
  if (!isRecord(payload)) return null;
  const step = readFiniteNumber(payload.step, 0);
  const total = Math.max(readFiniteNumber(payload.total, 1), 1);
  const label = typeof payload.label === "string" ? payload.label : "writing_config";

  return {
    label,
    step: Math.min(Math.max(step, 0), total),
    total,
    current: readOptionalFiniteNumber(payload.current),
    totalItems:
      readOptionalFiniteNumber(payload.total_items) ??
      readOptionalFiniteNumber(payload.totalItems),
    receivedAt: Date.now(),
  };
}

function readFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readOptionalFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function useRelayRouterToggleProgress(queryClient: QueryClient) {
  const [progress, setProgress] = useState<RelayRouterToggleProgress | null>(
    () =>
      queryClient.getQueryData<RelayRouterToggleProgress>(
        RELAY_ROUTER_TOGGLE_PROGRESS_QUERY_KEY,
      ) ?? null,
  );

  useEffect(() => {
    return relayService.subscribeRouterToggleProgress((payload) => {
      const nextProgress = parseRelayRouterToggleProgress(payload);
      if (!nextProgress) return;
      writeRelayRouterToggleProgress(queryClient, nextProgress);
      setProgress(nextProgress);
    });
  }, [queryClient]);

  return progress;
}

export function useRelayModule() {
  const queryClient = useQueryClient();
  const routerToggleProgress = useRelayRouterToggleProgress(queryClient);
  const stateQuery = useQuery({
    queryKey: RELAY_STATE_QUERY_KEY,
    queryFn: () =>
      runRelayQuery(queryClient, RELAY_STATE_QUERY_KEY, () => relayService.loadState()),
    staleTime: 30_000,
  });
  const activeQuery = useQuery({
    queryKey: RelayCache.queryKeys.active,
    queryFn: () =>
      runRelayQuery(queryClient, RelayCache.queryKeys.active, () =>
        relayService.getActive(),
      ),
    staleTime: 30_000,
  });
  const proxyQuery = useQuery({
    queryKey: relayProxyStatusQueryKey,
    queryFn: () =>
      runRelayQuery(queryClient, relayProxyStatusQueryKey, () =>
        relayService.getProxyStatus(),
      ),
    staleTime: 30_000,
  });
  const auditLogQuery = useQuery({
    queryKey: relayAuditLogQueryKey,
    queryFn: () =>
      runRelayQuery(queryClient, relayAuditLogQueryKey, () =>
        relayService.getPassthroughAuditLog(50),
      ),
    staleTime: 30_000,
  });

  const upsertProviderMutation = useRelayEvidenceMutation<RelayProviderDraft>(
    (input) => relayService.upsert(input),
  );
  const deleteProviderMutation = useRelayEvidenceMutation<string>(
    (providerId) => relayService.delete(providerId),
  );
  const activateProviderMutation = useRelayEvidenceMutation<RelayProviderIdeInput>(
    ({ providerId, ide }) => relayService.activate(providerId, ide),
  );
  const deactivateProviderMutation = useRelayEvidenceMutation<RelayProviderIdeInput>(
    ({ providerId, ide }) => relayService.deactivate(providerId, ide),
  );
  const setNetworkMutation = useRelayEvidenceMutation<RelayNetworkInput>(
    ({ providerId, network }) => relayService.setNetwork(providerId, network),
  );
  const testProviderMutation = useRelayEvidenceMutation<string>(
    (providerId) => relayService.test(providerId),
  );
  const testDraftMutation = useRelayEvidenceMutation<RelayProviderDraft>(
    (input) => relayService.testDraft(input),
  );
  const fetchModelsDraftMutation = useRelayEvidenceMutation<RelayProviderDraft>(
    (input) => relayService.fetchModelsDraft(input),
  );
  const setRouterEnabledMutation = useRelayEvidenceMutation<RelayRouterInput>(
    ({ enabled, relaunch }) => relayService.setCodexRouterEnabled(enabled, relaunch),
  );
  const restartCodexAppMutation = useRelayEvidenceMutation<void>(
    () => relayService.restartCodexApp(),
  );
  const setBlockPassthroughMutation = useRelayEvidenceMutation<boolean>(
    (blocked) => relayService.setBlockOfficialPassthrough(blocked),
  );
  const exportConfigMutation = useRelayEvidenceMutation<RelayExportInput>(
    ({ filePath, includeApiKeys }) =>
      relayService.exportConfig(filePath, includeApiKeys),
  );
  const exportConfigWithDialogMutation =
    useRelayEvidenceMutation<RelayExportDialogInput>((input) =>
      relayService.exportConfigWithDialog(input),
    );
  const importConfigMutation = useRelayEvidenceMutation<string>(
    (filePath) => relayService.importConfig(filePath),
  );
  const importConfigWithDialogMutation =
    useRelayEvidenceMutation<RelayImportDialogInput>((input) =>
      relayService.importConfigWithDialog(input),
    );
  const diagnosticsMutation = useRelayEvidenceMutation<void>(
    () => relayService.runCodexRouterDiagnostics(),
  );
  const diagnoseRouterMutation = useRelayEvidenceMutation<void>(
    () => relayService.diagnoseCodexRouter(),
  );
  const fixRouterIssueMutation = useRelayEvidenceMutation<string>(
    (itemId) => relayService.fixCodexRouterIssue(itemId),
  );

  const isAnyMutationPending =
    upsertProviderMutation.isPending ||
    deleteProviderMutation.isPending ||
    activateProviderMutation.isPending ||
    deactivateProviderMutation.isPending ||
    setNetworkMutation.isPending ||
    testProviderMutation.isPending ||
    testDraftMutation.isPending ||
    fetchModelsDraftMutation.isPending ||
    setRouterEnabledMutation.isPending ||
    restartCodexAppMutation.isPending ||
    setBlockPassthroughMutation.isPending ||
    exportConfigMutation.isPending ||
    exportConfigWithDialogMutation.isPending ||
    importConfigMutation.isPending ||
    importConfigWithDialogMutation.isPending ||
    diagnosticsMutation.isPending ||
    diagnoseRouterMutation.isPending ||
    fixRouterIssueMutation.isPending;

  return {
    stateQuery,
    activeQuery,
    proxyQuery,
    auditLogQuery,
    providerActions: {
      upsertProvider: {
        run: (input: RelayProviderDraft) => upsertProviderMutation.mutateAsync(input),
        isPending: upsertProviderMutation.isPending,
      },
      deleteProvider: {
        run: (providerId: string) => deleteProviderMutation.mutateAsync(providerId),
        isPending: deleteProviderMutation.isPending,
      },
      activateProvider: {
        run: (input: RelayProviderIdeInput) =>
          activateProviderMutation.mutateAsync(input),
        isPending: activateProviderMutation.isPending,
      },
      deactivateProvider: {
        run: (input: RelayProviderIdeInput) =>
          deactivateProviderMutation.mutateAsync(input),
        isPending: deactivateProviderMutation.isPending,
      },
      setNetwork: {
        run: (input: RelayNetworkInput) => setNetworkMutation.mutateAsync(input),
        isPending: setNetworkMutation.isPending,
      },
      testProvider: {
        run: (providerId: string) => testProviderMutation.mutateAsync(providerId),
        isPending: testProviderMutation.isPending,
      },
      testDraft: {
        run: (input: RelayProviderDraft) => testDraftMutation.mutateAsync(input),
        isPending: testDraftMutation.isPending,
      },
      fetchModelsDraft: {
        run: (input: RelayProviderDraft) => fetchModelsDraftMutation.mutateAsync(input),
        isPending: fetchModelsDraftMutation.isPending,
      },
    },
    routerActions: {
      setCodexRouterEnabled: {
        run: (input: RelayRouterInput) => setRouterEnabledMutation.mutateAsync(input),
        isPending: setRouterEnabledMutation.isPending,
      },
      restartCodexApp: {
        run: () => restartCodexAppMutation.mutateAsync(),
        isPending: restartCodexAppMutation.isPending,
      },
      setBlockOfficialPassthrough: {
        run: (blocked: boolean) => setBlockPassthroughMutation.mutateAsync(blocked),
        isPending: setBlockPassthroughMutation.isPending,
      },
      diagnoseCodexRouter: {
        run: () => diagnoseRouterMutation.mutateAsync(),
        isPending: diagnoseRouterMutation.isPending,
      },
      fixCodexRouterIssue: {
        run: (itemId: string) => fixRouterIssueMutation.mutateAsync(itemId),
        isPending: fixRouterIssueMutation.isPending,
      },
    },
    ioActions: {
      exportConfig: {
        run: (input: RelayExportInput) => exportConfigMutation.mutateAsync(input),
        isPending: exportConfigMutation.isPending,
      },
      exportConfigWithDialog: {
        run: (input: RelayExportDialogInput) =>
          exportConfigWithDialogMutation.mutateAsync(input),
        isPending: exportConfigWithDialogMutation.isPending,
      },
      importConfig: {
        run: (filePath: string) => importConfigMutation.mutateAsync(filePath),
        isPending: importConfigMutation.isPending,
      },
      importConfigWithDialog: {
        run: (input: RelayImportDialogInput) =>
          importConfigWithDialogMutation.mutateAsync(input),
        isPending: importConfigWithDialogMutation.isPending,
      },
    },
    diagnosticsAction: {
      id: "diagnostics",
      labelKey: "relay.runDiagnostics",
      run: () => diagnosticsMutation.mutateAsync(),
      isPending: diagnosticsMutation.isPending,
    },
    routerToggleProgress,
    isAnyMutationPending,
  };
}

// 中文职责说明：Relay 页面控制器 owning 页面级状态、派生行数据和用户动作编排，页面文件只消费该门面。
export function useRelayPageController() {
  const { t } = useTranslation();
  const module = useRelayModule();
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [form, setForm] = useState<RelayProviderForm>(DEFAULT_PROVIDER_FORM);
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [networkProviderId, setNetworkProviderId] = useState<string | null>(null);
  const [deleteProviderId, setDeleteProviderId] = useState<string | null>(null);
  const [networkDraft, setNetworkDraft] = useState<RelayNetworkMode>("system");
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [testingDraft, setTestingDraft] = useState(false);
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [ioConfirmOpen, setIoConfirmOpen] = useState(false);
  const [ioIncludeApiKeys, setIoIncludeApiKeys] = useState(false);
  const [ioExporting, setIoExporting] = useState(false);
  const [ioImporting, setIoImporting] = useState(false);

  const state = envelopeData(module.stateQuery.data);
  const active = envelopeData(module.activeQuery.data);
  const proxy = envelopeData(module.proxyQuery.data);
  const audit = envelopeData(module.auditLogQuery.data);
  const providers = readArray(state, ["providers", "items", "relayProviders"]);
  const auditItems = Array.isArray(audit)
    ? audit
    : readArray(audit, ["items", "logs", "entries", "auditLog"]);
  const currentIde = readString(
    active,
    ["ide", "activeIde", "targetIde", "currentIde"],
    readString(state, ["ide", "activeIde", "targetIde", "currentIde"], RELAY_IDE),
  );
  const activeProviderId = readString(
    active,
    ["providerId", "activeProviderId", "id"],
    readString(state, ["providerId", "activeProviderId", "activeProvider"]),
  );
  const activeProviderIds = readArray<string>(state, [
    "activeProviderIds",
    "activeProviders",
    "activeIds",
  ]);
  const providerRows = useMemo(
    () =>
      providers.map((provider, index): RelayProviderRow => {
        const id = readString(provider, ["id", "providerId", "key"]);
        const name = readString(
          provider,
          ["name", "label", "id", "providerId", "key"],
          t("relay.unknownProvider"),
        );
        const ide = readString(provider, ["ide"], currentIde);
        const baseUrl = readString(provider, ["baseUrl", "url", "endpoint"]);
        const model = readString(provider, ["model", "defaultModel"]);
        const network = normalizeNetwork(readString(provider, ["network"], "system"));
        const activeByState = Boolean(
          id && (id === activeProviderId || activeProviderIds.includes(id)),
        );

        return {
          id,
          rowId: id || `${name}-${index}`,
          ide,
          name,
          baseUrl,
          apiKey: "",
          apiKeyStored: readBoolean(provider, ["apiKeyStored", "hasApiKey"]),
          model,
          wireApi: normalizeWireApi(readString(provider, ["wireApi"], "openai-chat")),
          extraHeaders: formatExtraHeaders(provider),
          network,
          active: readBoolean(provider, ["active", "enabled"], activeByState),
          latencyMs: readNumber(provider, ["latencyMs", "latency"]),
          lastError: readString(provider, ["lastError", "errorMessage", "error"]),
        };
      }),
    [activeProviderId, activeProviderIds, currentIde, providers, t],
  );
  const currentProviderRows = providerRows.filter((provider) => provider.ide === currentIde);
  const selectedProvider =
    providerRows.find((provider) => provider.id === editingProviderId) ?? null;
  const networkProvider =
    providerRows.find((provider) => provider.id === networkProviderId) ?? null;
  const deleteProvider =
    providerRows.find((provider) => provider.id === deleteProviderId) ?? null;
  const routerEnabled = readBoolean(state, [
    "routerEnabled",
    "codexRouterEnabled",
    "codexRouter.enabled",
    "enabled",
  ]);
  const blocked = readBoolean(state, [
    "blockOfficialPassthrough",
    "passthroughBlocked",
    "codexRouter.blockOfficialPassthrough",
  ]);
  const proxyRunning = readBoolean(proxy, ["running", "reachable", "enabled", "ok"]);
  const proxyBaseUrl = readString(
    proxy,
    ["baseUrl", "url", "endpoint", "status", "message"],
    t("relay.none"),
  );
  const extraHeadersInvalid = Boolean(validateExtraHeaders(form.extraHeaders));
  const formValid = Boolean(form.name.trim() && form.baseUrl.trim() && !extraHeadersInvalid);
  const locked = routerEnabled;
  const busy =
    module.isAnyMutationPending ||
    deleting ||
    testingDraft ||
    fetchingModels ||
    ioExporting ||
    ioImporting;
  const showRouterProgress =
    module.routerActions.setCodexRouterEnabled.isPending &&
    Boolean(module.routerToggleProgress);
  const presetOptions = RELAY_PROVIDER_PRESETS.filter((preset) =>
    preset.ides.includes(currentIde),
  );
  const ioActionPending =
    module.ioActions.importConfigWithDialog.isPending ||
    module.ioActions.exportConfigWithDialog.isPending;
  const ioMenuPending = ioActionPending || ioExporting || ioImporting;
  const stateErrorDescription = module.stateQuery.isError
    ? toErrorMessage(module.stateQuery.error)
    : "";

  useEffect(() => {
    if (networkProvider) setNetworkDraft(networkProvider.network);
  }, [networkProvider]);

  const resetForm = () => {
    setEditingProviderId(null);
    setForm(DEFAULT_PROVIDER_FORM);
    setModelOptions([]);
  };

  const openNewProvider = () => {
    if (locked) {
      notifyLocked(t);
      return;
    }
    resetForm();
    setProviderDialogOpen(true);
  };

  const openEditor = (provider: RelayProviderRow) => {
    if (locked) {
      notifyLocked(t);
      return;
    }
    setEditingProviderId(provider.id || null);
    setForm(provider);
    setModelOptions([]);
  };

  const openPresetDialog = () => {
    if (locked) {
      notifyLocked(t);
      return;
    }
    setPresetDialogOpen(true);
  };

  const applyPreset = (preset: RelayProviderPreset) => {
    if (locked) {
      notifyLocked(t);
      return;
    }
    setEditingProviderId(null);
    setForm({
      ...DEFAULT_PROVIDER_FORM,
      name: preset.name,
      baseUrl: preset.baseUrl,
      model: preset.defaultModel,
      wireApi: preset.wireApi,
    });
    setModelOptions([]);
    setPresetDialogOpen(false);
    setProviderDialogOpen(true);
  };

  const setProviderDialogOpenState = (open: boolean) => {
    setProviderDialogOpen(open);
    if (!open && !editingProviderId) resetForm();
  };

  const buildUpsertInput = () => ({
    id: form.id,
    ide: currentIde,
    name: form.name.trim(),
    baseUrl: form.baseUrl.trim(),
    apiKey: form.apiKey.trim(),
    model: form.model.trim(),
    wireApi: form.wireApi,
    extraHeaders: form.extraHeaders.trim(),
    network: form.network,
  });

  const buildDraftInput = () => ({
    providerId: form.id,
    ide: currentIde,
    name: form.name,
    baseUrl: form.baseUrl,
    apiKey: form.apiKey,
    model: form.model,
    wireApi: form.wireApi,
    extraHeaders: form.extraHeaders || undefined,
    network: form.network,
  });

  const saveProvider = async (enableAfterSave: boolean) => {
    if (locked) {
      notifyLocked(t);
      return;
    }
    if (!formValid) {
      toast({
        title: t("relay.toast.saveFailed"),
        description: extraHeadersInvalid ? t("relay.extraHeadersInvalid") : undefined,
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await module.providerActions.upsertProvider.run(buildUpsertInput());
      const saved = envelopeData(result);
      const providerId = readString(saved, ["id", "providerId"], form.id);
      const providerName = readString(saved, ["name"], form.name.trim());

      if (enableAfterSave && providerId) {
        try {
          await module.providerActions.activateProvider.run({
            providerId,
            ide: currentIde,
          });
          toast({ title: t("relay.toast.enabled", { name: providerName }) });
        } catch (error) {
          toast({
            title: t("relay.toast.savedButEnableFailed", { name: providerName }),
            description: toErrorMessage(error),
            variant: "destructive",
          });
          return;
        }
      } else {
        toast({ title: t("relay.toast.saved") });
      }

      setProviderDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: t("relay.toast.saveFailed"),
        description: toErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const testDraft = async () => {
    if (!formValid || testingDraft) return;
    setTestingDraft(true);
    const startedAt = Date.now();
    try {
      const result = await module.providerActions.testDraft.run(buildDraftInput());
      showTestResult(t, envelopeData(result));
    } catch (error) {
      toast({
        title: t("relay.toast.testFailed", { error: toErrorMessage(error) }),
        variant: "destructive",
      });
    } finally {
      await waitMinimumDuration(startedAt);
      setTestingDraft(false);
    }
  };

  const fetchModels = async () => {
    if (!form.baseUrl.trim() || fetchingModels) return;
    setFetchingModels(true);
    const startedAt = Date.now();
    try {
      const result = await module.providerActions.fetchModelsDraft.run(buildDraftInput());
      const models = readModelNames(envelopeData(result));
      if (models.length === 0) {
        setModelOptions([]);
        toast({
          title: t("relay.form.fetchModels.empty"),
          variant: "destructive",
        });
        return;
      }
      setModelOptions(models);
      toast({ title: t("relay.form.fetchModels.success", { count: models.length }) });
    } catch (error) {
      setModelOptions([]);
      toast({
        title: t("relay.form.fetchModels.failed"),
        description: toErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      await waitMinimumDuration(startedAt);
      setFetchingModels(false);
    }
  };

  const toggleProvider = async (provider: RelayProviderRow) => {
    if (!provider.id) return;
    if (locked) {
      notifyLocked(t);
      return;
    }

    try {
      if (provider.active) {
        await module.providerActions.deactivateProvider.run({
          providerId: provider.id,
          ide: currentIde,
        });
        toast({ title: t("relay.toast.disabled", { name: provider.name }) });
      } else {
        await module.providerActions.activateProvider.run({
          providerId: provider.id,
          ide: currentIde,
        });
        toast({ title: t("relay.toast.enabled", { name: provider.name }) });
      }
    } catch (error) {
      toast({
        title: provider.active
          ? t("relay.toast.disableFailed", { name: provider.name })
          : t("relay.toast.enableFailed", { name: provider.name }),
        description: toErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const testProvider = async (provider: RelayProviderRow) => {
    if (!provider.id || testingProviderId) return;
    setTestingProviderId(provider.id);
    const startedAt = Date.now();
    try {
      const result = await module.providerActions.testProvider.run(provider.id);
      showTestResult(t, envelopeData(result));
    } catch (error) {
      toast({
        title: t("relay.toast.testFailed", { error: toErrorMessage(error) }),
        variant: "destructive",
      });
    } finally {
      await waitMinimumDuration(startedAt);
      setTestingProviderId(null);
    }
  };

  const requestDeleteProvider = (providerId: string | null) => {
    if (locked) {
      notifyLocked(t);
      return;
    }
    setDeleteProviderId(providerId);
  };

  const deleteProviderAction = async () => {
    if (!deleteProvider?.id) return;
    if (locked) {
      notifyLocked(t);
      setDeleteProviderId(null);
      return;
    }
    setDeleting(true);
    try {
      await module.providerActions.deleteProvider.run(deleteProvider.id);
      toast({ title: t("relay.toast.deleted") });
      if (editingProviderId === deleteProvider.id) resetForm();
      setDeleteProviderId(null);
    } catch (error) {
      toast({
        title: t("relay.deleteFailed"),
        description: toErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const requestNetworkEdit = (provider: RelayProviderRow) => {
    if (locked) {
      notifyLocked(t);
      return;
    }
    setNetworkProviderId(provider.id || null);
    setNetworkDraft(provider.network);
  };

  const closeNetworkDialog = (open: boolean) => {
    if (open) return;
    setNetworkProviderId(null);
    if (networkProvider) setNetworkDraft(networkProvider.network);
  };

  const saveNetwork = async () => {
    if (!networkProvider?.id) return;
    try {
      await module.providerActions.setNetwork.run({
        providerId: networkProvider.id,
        network: networkDraft,
      });
      if (form.id === networkProvider.id) {
        setForm((current) => ({ ...current, network: networkDraft }));
      }
      toast({ title: t("relay.network.toast.saved") });
      setNetworkProviderId(null);
    } catch (error) {
      toast({
        title: t("relay.network.toast.saveFailed"),
        description: toErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const importConfig = async () => {
    setIoImporting(true);
    try {
      const result = await module.ioActions.importConfigWithDialog.run({
        title: t("relay.io.openDialogTitle"),
        filterName: RELAY_BACKUP_FILTER_NAME,
      });
      const data = envelopeData(result);
      const importedCount = readNumber(data, ["importedCount"]);
      const skipped = readArray(data, ["skipped"]);
      if (importedCount <= 0) {
        toast({
          title: t("relay.io.importNothingTitle"),
          description:
            skipped.length > 0
              ? t("relay.io.importNothingDesc", {
                  skipped: skipped.length,
                  reason: formatSkipReasons(t, skipped),
                })
              : t("relay.io.importNothingDescEmpty"),
          variant: "warning",
        });
        return;
      }
      toast({
        title: t("relay.io.importSuccess"),
        description:
          skipped.length > 0
            ? t("relay.io.importSuccessDescPartial", {
                count: importedCount,
                skipped: skipped.length,
                reason: formatSkipReasons(t, skipped),
              })
            : t("relay.io.importSuccessDesc", { count: importedCount }),
        variant: skipped.length > 0 ? "warning" : "success",
      });
    } catch (error) {
      if (!isCancelled(error)) {
        toast({
          title: t("relay.io.importFailed"),
          description: toErrorMessage(error),
          variant: "destructive",
        });
      }
    } finally {
      setIoImporting(false);
    }
  };

  const exportConfig = async () => {
    setIoExporting(true);
    try {
      const result = await module.ioActions.exportConfigWithDialog.run({
        title: t("relay.io.saveDialogTitle"),
        defaultPath: makeRelayBackupPath(),
        filterName: RELAY_BACKUP_FILTER_NAME,
        includeApiKeys: ioIncludeApiKeys,
      });
      const data = envelopeData(result);
      const providerCountFromResult = readNumber(data, ["providerCount"], providerRows.length);
      const filePath = readString(data, ["filePath", "path"]);
      const exportedWithKeys = readBoolean(data, ["includeApiKeys"], ioIncludeApiKeys);
      toast({
        title: t("relay.io.exportSuccess"),
        description: exportedWithKeys
          ? t("relay.io.exportSuccessDescWithKeys", {
              count: providerCountFromResult,
              path: filePath,
            })
          : t("relay.io.exportSuccessDesc", {
              count: providerCountFromResult,
              path: filePath,
            }),
        variant: exportedWithKeys ? "warning" : "success",
      });
      setIoConfirmOpen(false);
      setIoIncludeApiKeys(false);
    } catch (error) {
      if (!isCancelled(error)) {
        toast({
          title: t("relay.io.exportFailed"),
          description: toErrorMessage(error),
          variant: "destructive",
        });
      }
    } finally {
      setIoExporting(false);
    }
  };

  const setIoExportConfirmOpen = (open: boolean) => {
    setIoConfirmOpen(open);
    if (!open) setIoIncludeApiKeys(false);
  };

  return {
    module,
    state,
    active,
    proxy,
    audit,
    providers,
    auditItems,
    currentIde,
    activeProviderId,
    providerRows,
    currentProviderRows,
    selectedProvider,
    networkProvider,
    deleteProvider,
    routerEnabled,
    blocked,
    proxyRunning,
    proxyBaseUrl,
    form,
    providerDialogOpen,
    presetDialogOpen,
    networkDraft,
    modelOptions,
    fetchingModels,
    testingDraft,
    testingProviderId,
    deleting,
    ioConfirmOpen,
    ioIncludeApiKeys,
    ioExporting,
    ioImporting,
    ioMenuPending,
    presetOptions,
    extraHeadersInvalid,
    formValid,
    locked,
    busy,
    showRouterProgress,
    stateErrorDescription,
    actions: {
      setForm,
      openNewProvider,
      openEditor,
      openPresetDialog,
      setProviderDialogOpen: setProviderDialogOpenState,
      setPresetDialogOpen,
      applyPreset,
      fetchModels,
      testDraft,
      saveProvider,
      toggleProvider,
      testProvider,
      requestNetworkEdit,
      closeNetworkDialog,
      setNetworkDraft,
      saveNetwork,
      requestDeleteProvider,
      closeDeleteDialog: (open: boolean) => {
        if (!open) setDeleteProviderId(null);
      },
      deleteProvider: deleteProviderAction,
      setRouterEnabled: (enabled: boolean) =>
        module.routerActions.setCodexRouterEnabled.run({ enabled, relaunch: true }),
      restartCodexApp: () => module.routerActions.restartCodexApp.run(),
      toggleBlockPassthrough: () =>
        module.routerActions.setBlockOfficialPassthrough.run(!blocked),
      diagnoseRouter: () => module.routerActions.diagnoseCodexRouter.run(),
      runDiagnostics: () => module.diagnosticsAction.run(),
      openIoExportConfirm: () => setIoConfirmOpen(true),
      setIoExportConfirmOpen,
      setIoIncludeApiKeys,
      importConfig,
      exportConfig,
      notifyLocked: () => notifyLocked(t),
    },
  };
}

export type RelayPageController = ReturnType<typeof useRelayPageController>;

type RelayTranslator = (key: string, options?: Record<string, unknown>) => string;

function formatExtraHeaders(provider: unknown) {
  const extraHeaders = firstPath(provider, ["extraHeaders"]);
  if (typeof extraHeaders === "string") return extraHeaders;
  if (!isRecord(extraHeaders)) return "";
  try {
    return JSON.stringify(extraHeaders);
  } catch {
    return "";
  }
}

function readModelNames(value: unknown) {
  const direct = Array.isArray(value) ? value : readArray(value, ["models", "items", "data"]);
  return direct
    .map((item) => {
      if (typeof item === "string") return item;
      return readString(item, ["id", "name", "model"]);
    })
    .filter(Boolean);
}

function showTestResult(t: RelayTranslator, value: unknown) {
  const ok = readBoolean(value, ["ok", "success"]);
  if (ok) {
    toast({
      title: t("relay.toast.testOk", {
        ms: readNumber(value, ["latencyMs", "latency"]),
      }),
    });
    return;
  }
  toast({
    title: t("relay.toast.testFailed", {
      error: readString(value, ["errorMessage", "error"], "unknown"),
    }),
    variant: "destructive",
  });
}

function notifyLocked(t: RelayTranslator) {
  toast({
    title: t("relay.codexRouter.providerOperationLocked"),
    variant: "warning",
  });
}

function toErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (isRecord(error) && typeof error.message === "string") return error.message;
  return String(error);
}

function isCancelled(error: unknown) {
  return error instanceof Error && error.message === "CANCELLED";
}

async function waitMinimumDuration(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  if (elapsed >= 600) return;
  await new Promise((resolve) => setTimeout(resolve, 600 - elapsed));
}

function makeRelayBackupPath() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `relay-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.json`;
}

function formatSkipReasons(t: RelayTranslator, skipped: unknown[]) {
  const counts = new Map<string, number>();
  for (const item of skipped) {
    const reason = normalizeSkipReason(readString(item, ["reason"]));
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([reason, count]) => `${t(`relay.io.skipReason.${reason}`)} x ${count}`)
    .join(", ");
}

function normalizeSkipReason(reason: string) {
  switch (reason) {
    case "DUPLICATE_ID":
    case "INVALID_FIELD":
    case "KEYCHAIN_WRITE":
      return reason;
    default:
      return "UNKNOWN";
  }
}
