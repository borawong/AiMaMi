import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/toast";
import type { RelayExtraHeaders } from "@/types";
import type {
  RelayModuleController,
  RelayNetworkMode,
  RelayPageController,
  RelayProviderDraft,
  RelayProviderForm,
  RelayProviderPreset,
  RelayProviderRow,
} from "../types";
import {
  envelopeData,
  firstPath,
  isRecord,
  normalizeNetwork,
  normalizeWireApi,
  readArray,
  readBoolean,
  readNumber,
  readString,
  validateExtraHeaders,
} from "../utils";
import { useRelayMutations as useRelayPageMutations } from "./mutation";
import { useRelayQueries as useRelayPageQueries } from "./query";
import { useRelayRuntimeEvents } from "./runtime";

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

export function useRelayModule(): RelayModuleController {
  const queries = useRelayPageQueries();
  const mutations = useRelayPageMutations();
  useRelayRuntimeEvents();

  const isAnyMutationPending =
    mutations.providerActions.upsertProvider.isPending ||
    mutations.providerActions.deleteProvider.isPending ||
    mutations.providerActions.activateProvider.isPending ||
    mutations.providerActions.deactivateProvider.isPending ||
    mutations.providerActions.setNetwork.isPending ||
    mutations.providerActions.testProvider.isPending ||
    mutations.providerActions.testDraft.isPending ||
    mutations.providerActions.fetchModelsDraft.isPending ||
    mutations.routerActions.setCodexRouterEnabled.isPending ||
    mutations.routerActions.restartCodexApp.isPending ||
    mutations.routerActions.setBlockOfficialPassthrough.isPending ||
    mutations.ioActions.exportConfig.isPending ||
    mutations.ioActions.exportConfigWithDialog.isPending ||
    mutations.ioActions.importConfig.isPending ||
    mutations.ioActions.importConfigWithDialog.isPending ||
    mutations.diagnosticsAction.isPending ||
    mutations.routerActions.diagnoseCodexRouter.isPending ||
    mutations.routerActions.fixCodexRouterIssue.isPending;

  return {
    ...queries,
    ...mutations,
    routerToggleProgress: queries.routerToggleProgressQuery.data ?? null,
    isAnyMutationPending,
  };
}

export function useRelayPageController(): RelayPageController {
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
          extraHeaders: formatExtraHeaders(
            readRelayExtraHeaders(firstPath(provider, ["extraHeaders"])),
          ),
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

  const buildUpsertInput = (): RelayProviderDraft => ({
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

  const buildDraftInput = (): RelayProviderDraft => ({
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
      const providerCountFromResult = readNumber(
        data,
        ["providerCount"],
        providerRows.length,
      );
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

type RelayTranslator = (key: string, options?: Record<string, unknown>) => string;

function formatExtraHeaders(extraHeaders: RelayExtraHeaders | undefined) {
  if (typeof extraHeaders === "string") return extraHeaders;
  if (!extraHeaders) return "";
  try {
    return JSON.stringify(extraHeaders);
  } catch {
    return "";
  }
}

function readRelayExtraHeaders(value: unknown): RelayExtraHeaders | undefined {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return undefined;
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
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
