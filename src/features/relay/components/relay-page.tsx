/**
 * 中文职责说明：Relay 页面只消费 hook 暴露的查询与动作，表单只组装 1.0.9 证据确认的 draft 字段。
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Ban,
  Check,
  Download,
  Edit3,
  FileJson,
  FlaskConical,
  MoreHorizontal,
  Network,
  Plus,
  Power,
  PowerOff,
  RadioTower,
  RotateCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  Wrench,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/button-busy-content";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  envelopeData,
  firstPath,
  isRecord,
  readArray,
  readBoolean,
  readNumber,
  readString,
} from "../utils";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRelayModule } from "../hooks";

type WireApi = "openai-responses" | "anthropic" | "openai-chat";
type RelayNetworkMode = "system" | "direct";

type RelayProviderForm = {
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

type RelayProviderRow = RelayProviderForm & {
  rowId: string;
  ide: string;
  active: boolean;
  latencyMs: number;
  lastError: string;
};

type RelayProviderPreset = {
  slug: string;
  name: string;
  initial: string;
  color: string;
  baseUrl: string;
  defaultModel: string;
  wireApi: WireApi;
  ides: string[];
};

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

export function RelayPage() {
  const { t } = useTranslation();
  const module = useRelayModule();
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [form, setForm] = useState<RelayProviderForm>(DEFAULT_PROVIDER_FORM);
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [networkProviderId, setNetworkProviderId] = useState<string | null>(null);
  const [deleteProviderId, setDeleteProviderId] = useState<string | null>(null);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [testingDraft, setTestingDraft] = useState(false);
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
  const busy = module.isAnyMutationPending || deleting || testingDraft || fetchingModels;

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

  const handleSave = async (enableAfterSave: boolean) => {
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

  const handleTestDraft = async () => {
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

  const handleFetchModels = async () => {
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

  const handleToggleProvider = async (provider: RelayProviderRow) => {
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

  const handleTestProvider = async (provider: RelayProviderRow) => {
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

  const handleDeleteProvider = async () => {
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

  const handleSaveNetwork = async (network: RelayNetworkMode) => {
    if (!networkProvider?.id) return;
    try {
      await module.providerActions.setNetwork.run({
        providerId: networkProvider.id,
        network,
      });
      if (form.id === networkProvider.id) {
        setForm((current) => ({ ...current, network }));
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

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-normal">{t("nav.relay")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("relay.description")}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={module.diagnosticsAction.isPending}
          onClick={() => void module.diagnosticsAction.run()}
        >
          <Wrench className="h-3.5 w-3.5" />
          {t(module.diagnosticsAction.labelKey)}
        </Button>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <RelayMetric
          label={t("relay.providerCount")}
          value={
            <span className="inline-flex items-center gap-2">
              <RadioTower className="h-4 w-4 text-muted-foreground" />
              {providers.length || readNumber(state, ["total", "providerCount"])}
            </span>
          }
        />
        <RelayMetric
          label={t("relay.activeProvider")}
          value={activeProviderId || t("relay.none")}
        />
        <RelayMetric
          label={t("relay.router")}
          value={
            <BoolBadge
              value={routerEnabled}
              trueLabel={t("relay.enabled")}
              falseLabel={t("relay.disabled")}
            />
          }
        />
        <RelayMetric
          label={t("relay.passthrough")}
          value={
            <BoolBadge
              value={blocked}
              trueLabel={t("relay.blocked")}
              falseLabel={t("relay.allowed")}
            />
          }
        />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 rounded-[8px] border border-border bg-card">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <Button type="button" size="sm" onClick={openNewProvider}>
              <Plus className="h-3.5 w-3.5" />
              {t("relay.newProvider")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (locked) notifyLocked(t);
                else setPresetDialogOpen(true);
              }}
            >
              <FileJson className="h-3.5 w-3.5" />
              {t("relay.fromPreset")}
            </Button>
            <div className="ml-auto">
              <RelayIoMenu
                providerCount={providerRows.length}
                isPending={
                  module.ioActions.importConfigWithDialog.isPending ||
                  module.ioActions.exportConfigWithDialog.isPending
                }
                onImport={() =>
                  module.ioActions.importConfigWithDialog.run({
                    title: t("relay.io.openDialogTitle"),
                    filterName: RELAY_BACKUP_FILTER_NAME,
                  })
                }
                onExport={(includeApiKeys) =>
                  module.ioActions.exportConfigWithDialog.run({
                    title: t("relay.io.saveDialogTitle"),
                    defaultPath: makeRelayBackupPath(),
                    filterName: RELAY_BACKUP_FILTER_NAME,
                    includeApiKeys,
                  })
                }
              />
            </div>
          </div>

          {module.stateQuery.isError ? (
            <InlineError
              title={t("common.error")}
              description={toErrorMessage(module.stateQuery.error)}
            />
          ) : currentProviderRows.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-4 text-sm text-muted-foreground">
              <RadioTower className="mb-2 h-8 w-8 text-muted-foreground/40" />
              {t("relay.empty")}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {currentProviderRows.map((provider) => (
                <ProviderListRow
                  key={provider.rowId}
                  provider={provider}
                  locked={locked}
                  selected={provider.id === editingProviderId}
                  testing={testingProviderId === provider.id}
                  activating={module.providerActions.activateProvider.isPending}
                  onToggle={() => void handleToggleProvider(provider)}
                  onTest={() => void handleTestProvider(provider)}
                  onEdit={() => openEditor(provider)}
                  onNetwork={() => setNetworkProviderId(provider.id || null)}
                  onDelete={() => setDeleteProviderId(provider.id || null)}
                  onLocked={() => notifyLocked(t)}
                />
              ))}
            </div>
          )}
        </div>

        <ProviderEditor
          form={form}
          selectedProvider={selectedProvider}
          currentIde={currentIde}
          locked={locked}
          busy={busy}
          formValid={formValid}
          extraHeadersInvalid={extraHeadersInvalid}
          modelOptions={modelOptions}
          fetchingModels={fetchingModels}
          testingDraft={testingDraft}
          onChange={(next) => setForm(next)}
          onFetchModels={() => void handleFetchModels()}
          onTestDraft={() => void handleTestDraft()}
          onSave={(enableAfterSave) => void handleSave(enableAfterSave)}
          onDelete={() => setDeleteProviderId(form.id || null)}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-[8px] border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">{t("relay.codexRouter.title")}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("relay.codexRouter.subtitle")}
              </p>
            </div>
            <Switch
              checked={routerEnabled}
              disabled={module.routerActions.setCodexRouterEnabled.isPending}
              aria-label={t("relay.codexRouter.switchLabel")}
              onCheckedChange={(enabled) =>
                void module.routerActions.setCodexRouterEnabled.run({
                  enabled,
                  relaunch: true,
                })
              }
            />
          </div>
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <BoolBadge
              value={routerEnabled}
              trueLabel={t("relay.codexRouter.switchOn")}
              falseLabel={t("relay.codexRouter.switchOff")}
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={module.routerActions.restartCodexApp.isPending}
                aria-label={t("relay.actionRestartApplication")}
                onClick={() => void module.routerActions.restartCodexApp.run()}
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={module.routerActions.setBlockOfficialPassthrough.isPending}
                aria-label={t("relay.actionSetBlockPassthrough")}
                onClick={() =>
                  void module.routerActions.setBlockOfficialPassthrough.run(!blocked)
                }
              >
                <Ban className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={module.routerActions.diagnoseCodexRouter.isPending}
                aria-label={t("relay.actionDiagnoseRouter")}
                onClick={() => void module.routerActions.diagnoseCodexRouter.run()}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-[8px] border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
              <Network className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">{t("relay.proxyStatus")}</h2>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                {proxyBaseUrl}
              </p>
              <div className="mt-3">
                <BoolBadge
                  value={proxyRunning}
                  trueLabel={t("relay.proxy.running")}
                  falseLabel={t("relay.proxy.stopped")}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[8px] border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">{t("relay.passthrough")}</h2>
          <div className="mt-3 max-h-[168px] space-y-2 overflow-y-auto">
            {auditItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("relay.none")}</p>
            ) : (
              auditItems.slice(0, 6).map((item, index) => (
                <div
                  key={`${readString(item, ["event", "type", "action"], "event")}-${index}`}
                  className="min-w-0 rounded-[8px] border border-border px-3 py-2"
                >
                  <p className="truncate text-xs font-medium text-foreground">
                    {readString(item, ["event", "type", "action"], t("relay.none"))}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {isRecord(item)
                      ? readString(item, ["message", "summary", "timestamp"])
                      : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <ProviderDraftDialog
        open={providerDialogOpen}
        form={form}
        currentIde={currentIde}
        locked={locked}
        busy={busy}
        formValid={formValid}
        extraHeadersInvalid={extraHeadersInvalid}
        modelOptions={modelOptions}
        fetchingModels={fetchingModels}
        testingDraft={testingDraft}
        onOpenChange={(open) => {
          setProviderDialogOpen(open);
          if (!open && !editingProviderId) resetForm();
        }}
        onChange={(next) => setForm(next)}
        onFetchModels={() => void handleFetchModels()}
        onTestDraft={() => void handleTestDraft()}
        onSave={(enableAfterSave) => void handleSave(enableAfterSave)}
      />
      <PresetDialog
        open={presetDialogOpen}
        currentIde={currentIde}
        onOpenChange={setPresetDialogOpen}
        onSelect={applyPreset}
      />
      <NetworkDialog
        provider={networkProvider}
        pending={module.providerActions.setNetwork.isPending}
        onOpenChange={(open) => {
          if (!open) setNetworkProviderId(null);
        }}
        onSave={(network) => void handleSaveNetwork(network)}
      />
      <DeleteProviderDialog
        provider={deleteProvider}
        pending={deleting || module.providerActions.deleteProvider.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteProviderId(null);
        }}
        onConfirm={() => void handleDeleteProvider()}
      />
    </div>
  );
}

function RelayMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-border bg-card p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 min-w-0 truncate text-sm font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}

function BoolBadge({
  value,
  trueLabel,
  falseLabel,
}: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        value
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      {value ? trueLabel : falseLabel}
    </span>
  );
}

function ProviderListRow({
  provider,
  locked,
  selected,
  testing,
  activating,
  onToggle,
  onTest,
  onEdit,
  onNetwork,
  onDelete,
  onLocked,
}: {
  provider: RelayProviderRow;
  locked: boolean;
  selected: boolean;
  testing: boolean;
  activating: boolean;
  onToggle: () => void;
  onTest: () => void;
  onEdit: () => void;
  onNetwork: () => void;
  onDelete: () => void;
  onLocked: () => void;
}) {
  const { t } = useTranslation();
  const initial = provider.name.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "group flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/70",
        selected && "bg-accent",
        provider.active && "bg-primary/5",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-sm font-bold text-white",
          provider.active ? "bg-primary" : "bg-muted-foreground/70",
        )}
      >
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold">{provider.name}</span>
          {locked ? (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              {t("relay.codexRouter.providerOperationLockedBadge")}
            </span>
          ) : null}
          <ProviderHealth provider={provider} />
          <NetworkBadge network={provider.network} />
        </div>
        <div className="mt-0.5 truncate font-mono text-[11.5px] text-muted-foreground">
          {provider.baseUrl}
          {provider.model ? ` · ${provider.model}` : ""}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <IconTooltip label={t("relay.network.button")}>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label={t("relay.network.button")}
            className="relative"
            onClick={locked ? onLocked : onNetwork}
          >
            <Network className="h-3.5 w-3.5" />
            {provider.network === "direct" ? (
              <span
                className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-sky-500"
                aria-hidden
              />
            ) : null}
          </Button>
        </IconTooltip>
        <IconTooltip label={t("relay.test")}>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled={testing}
            aria-busy={testing}
            aria-label={t("relay.test")}
            onClick={onTest}
          >
            <ButtonBusyContent
              busy={testing}
              idleIcon={<FlaskConical className="h-3.5 w-3.5" />}
            />
          </Button>
        </IconTooltip>
        <IconTooltip label={t("relay.edit")}>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label={t("relay.edit")}
            onClick={locked ? onLocked : onEdit}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
        </IconTooltip>
        <IconTooltip label={provider.active ? t("relay.deactivate") : t("relay.enable")}>
          <Button
            type="button"
            size="icon-sm"
            variant={provider.active ? "secondary" : "default"}
            disabled={activating}
            aria-label={provider.active ? t("relay.deactivate") : t("relay.enable")}
            onClick={onToggle}
          >
            {provider.active ? (
              <PowerOff className="h-3.5 w-3.5" />
            ) : (
              <Power className="h-3.5 w-3.5" />
            )}
          </Button>
        </IconTooltip>
        <IconTooltip label={t("relay.delete")}>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            aria-label={t("relay.delete")}
            onClick={locked ? onLocked : onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </IconTooltip>
      </div>
    </div>
  );
}

function ProviderHealth({ provider }: { provider: RelayProviderRow }) {
  const { t } = useTranslation();
  if (provider.lastError) {
    return (
      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
        {t("relay.status.misconfigured")}
      </span>
    );
  }
  if (provider.latencyMs > 0) {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
        {t("relay.status.ms", { ms: provider.latencyMs })}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {t("relay.status.unknown")}
    </span>
  );
}

function NetworkBadge({ network }: { network: RelayNetworkMode }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium",
        network === "direct"
          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      {t(network === "direct" ? "relay.network.badge.direct" : "relay.network.badge.system")}
    </span>
  );
}

function ProviderEditor({
  form,
  selectedProvider,
  currentIde,
  locked,
  busy,
  formValid,
  extraHeadersInvalid,
  modelOptions,
  fetchingModels,
  testingDraft,
  onChange,
  onFetchModels,
  onTestDraft,
  onSave,
  onDelete,
}: {
  form: RelayProviderForm;
  selectedProvider: RelayProviderRow | null;
  currentIde: string;
  locked: boolean;
  busy: boolean;
  formValid: boolean;
  extraHeadersInvalid: boolean;
  modelOptions: string[];
  fetchingModels: boolean;
  testingDraft: boolean;
  onChange: (next: RelayProviderForm) => void;
  onFetchModels: () => void;
  onTestDraft: () => void;
  onSave: (enableAfterSave: boolean) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <aside className="rounded-[8px] border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {t(selectedProvider ? "relay.edit" : "relay.newProvider")}
        </h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {t("relay.form.scope", { ide: t(`relay.ide.${currentIde}`) })}
        </span>
      </div>
      <ProviderFormFields
        form={form}
        disabled={locked || busy}
        extraHeadersInvalid={extraHeadersInvalid}
        modelOptions={modelOptions}
        fetchingModels={fetchingModels}
        onChange={onChange}
        onFetchModels={onFetchModels}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!formValid || locked || busy}
          onClick={() => onSave(true)}
        >
          {t("relay.saveAndEnable")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!formValid || locked || busy}
          onClick={() => onSave(false)}
        >
          <Save className="h-3.5 w-3.5" />
          {t("relay.save")}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!formValid || busy || testingDraft}
              aria-busy={testingDraft}
              onClick={onTestDraft}
            >
              <ButtonBusyContent
                busy={testingDraft}
                idleIcon={<FlaskConical className="h-3.5 w-3.5" />}
                idleLabel={t("relay.test")}
                busyLabel={t("relay.test")}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {t(selectedProvider ? "relay.testDraftHint" : "relay.testDraftHint")}
          </TooltipContent>
        </Tooltip>
        {form.id ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-auto text-destructive hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
            disabled={locked || busy}
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("relay.delete")}
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

function ProviderDraftDialog({
  open,
  form,
  currentIde,
  locked,
  busy,
  formValid,
  extraHeadersInvalid,
  modelOptions,
  fetchingModels,
  testingDraft,
  onOpenChange,
  onChange,
  onFetchModels,
  onTestDraft,
  onSave,
}: {
  open: boolean;
  form: RelayProviderForm;
  currentIde: string;
  locked: boolean;
  busy: boolean;
  formValid: boolean;
  extraHeadersInvalid: boolean;
  modelOptions: string[];
  fetchingModels: boolean;
  testingDraft: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (next: RelayProviderForm) => void;
  onFetchModels: () => void;
  onTestDraft: () => void;
  onSave: (enableAfterSave: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("relay.newProvider")}</DialogTitle>
          <DialogDescription>
            {t("relay.form.scope", { ide: t(`relay.ide.${currentIde}`) })}
          </DialogDescription>
        </DialogHeader>
        <ProviderFormFields
          form={form}
          disabled={locked || busy}
          extraHeadersInvalid={extraHeadersInvalid}
          modelOptions={modelOptions}
          fetchingModels={fetchingModels}
          onChange={onChange}
          onFetchModels={onFetchModels}
        />
        <DialogFooter className="!justify-between gap-2 sm:!justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!formValid || busy || testingDraft}
              aria-busy={testingDraft}
              onClick={onTestDraft}
            >
              <ButtonBusyContent
                busy={testingDraft}
                idleLabel={t("relay.test")}
                busyLabel={t("relay.test")}
              />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!formValid || locked || busy}
              onClick={() => onSave(false)}
            >
              {t("relay.save")}
            </Button>
            <Button
              type="button"
              disabled={!formValid || locked || busy}
              onClick={() => onSave(true)}
            >
              {t("relay.saveAndEnable")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProviderFormFields({
  form,
  disabled,
  extraHeadersInvalid,
  modelOptions,
  fetchingModels,
  onChange,
  onFetchModels,
}: {
  form: RelayProviderForm;
  disabled: boolean;
  extraHeadersInvalid: boolean;
  modelOptions: string[];
  fetchingModels: boolean;
  onChange: (next: RelayProviderForm) => void;
  onFetchModels: () => void;
}) {
  const { t } = useTranslation();
  const anthropic = form.wireApi === "anthropic";
  const inputClassName = "h-8 rounded-[8px] text-xs md:text-xs";
  const monoInputClassName = cn(inputClassName, "font-mono");

  const setModel = (model: string) => {
    const inferred = inferWireApi(model);
    onChange({ ...form, model, ...(inferred ? { wireApi: inferred } : {}) });
  };

  return (
    <div className="space-y-3">
      <FieldLabel label={t("relay.form.name")}>
        <Input
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          placeholder={t("relay.form.namePlaceholder")}
          disabled={disabled}
          className={inputClassName}
        />
      </FieldLabel>
      <FieldLabel label={t("relay.form.baseUrl")}>
        <Input
          value={form.baseUrl}
          onChange={(event) => onChange({ ...form, baseUrl: event.target.value })}
          placeholder={t("relay.form.baseUrlPlaceholder")}
          disabled={disabled}
          className={monoInputClassName}
        />
        {anthropic ? (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("relay.anthropicBaseUrlHint")}
          </p>
        ) : null}
      </FieldLabel>
      <FieldLabel
        label={
          <>
            {t("relay.form.apiKey")}
            {form.apiKeyStored ? (
              <span className="ml-2 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                {t("relay.form.apiKeyStored")}
              </span>
            ) : null}
          </>
        }
      >
        <Input
          type="password"
          value={form.apiKey}
          onChange={(event) => onChange({ ...form, apiKey: event.target.value })}
          placeholder={
            form.apiKeyStored
              ? t("relay.form.apiKeyPlaceholderStored")
              : t("relay.form.apiKeyPlaceholder")
          }
          disabled={disabled}
          className={monoInputClassName}
        />
        {form.apiKeyStored ? (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("relay.form.apiKeyStoredHint")}
          </p>
        ) : null}
      </FieldLabel>
      <FieldLabel label={t("relay.form.model")}>
        <div className="flex gap-1.5">
          <Input
            value={form.model}
            onChange={(event) => setModel(event.target.value)}
            placeholder={t("relay.form.modelPlaceholder")}
            disabled={disabled}
            className={monoInputClassName}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={!form.baseUrl.trim() || disabled || fetchingModels}
                aria-label={t("relay.form.fetchModels.openDropdown")}
                aria-busy={fetchingModels}
                onClick={onFetchModels}
              >
                <ButtonBusyContent
                  busy={fetchingModels}
                  idleIcon={<Download className="h-3.5 w-3.5" />}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {t("relay.form.fetchModels.tooltip")}
            </TooltipContent>
          </Tooltip>
        </div>
        {modelOptions.length > 0 ? (
          <div className="mt-1 max-h-36 overflow-y-auto rounded-[8px] border border-border bg-background p-1">
            {modelOptions.map((model) => (
              <button
                key={model}
                type="button"
                className={cn(
                  "block w-full truncate rounded-[6px] px-2 py-1 text-left font-mono text-[11px] hover:bg-accent",
                  model === form.model && "bg-accent text-accent-foreground",
                )}
                disabled={disabled}
                onClick={() => setModel(model)}
              >
                {model}
              </button>
            ))}
          </div>
        ) : null}
      </FieldLabel>
      <FieldLabel label={t("relay.form.wireApi")}>
        <Select
          value={form.wireApi}
          disabled={disabled}
          onValueChange={(value) =>
            onChange({ ...form, wireApi: normalizeWireApi(value) })
          }
        >
          <SelectTrigger className={inputClassName}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai-responses">
              {t("relay.form.wireApiOpenaiResponses")}
            </SelectItem>
            <SelectItem value="anthropic">{t("relay.form.wireApiAnthropic")}</SelectItem>
            <SelectItem value="openai-chat">
              {t("relay.form.wireApiOpenaiChat")}
            </SelectItem>
          </SelectContent>
        </Select>
      </FieldLabel>
      <FieldLabel label={t("relay.form.extraHeaders")}>
        <Textarea
          value={form.extraHeaders}
          onChange={(event) =>
            onChange({ ...form, extraHeaders: event.target.value })
          }
          placeholder={t("relay.form.extraHeadersPlaceholder")}
          disabled={disabled}
          className={cn(
            "min-h-[72px] font-mono text-xs",
            extraHeadersInvalid && "border-destructive focus:ring-destructive",
          )}
        />
        {extraHeadersInvalid ? (
          <p className="mt-1 text-[11px] text-destructive">
            {t("relay.extraHeadersInvalid")}
          </p>
        ) : null}
      </FieldLabel>
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-xs font-medium text-foreground">
            <span>{t("relay.form.network.label")}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  tabIndex={-1}
                  className="inline-flex h-3.5 w-3.5 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground focus:outline-none"
                  aria-label={t("relay.form.network.tunHintAria")}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="start"
                className="max-w-[280px] whitespace-normal text-left leading-relaxed"
              >
                {t("relay.form.network.tunHint")}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {t("relay.form.network.description")}
          </p>
        </div>
        <Switch
          checked={form.network === "direct"}
          disabled={disabled}
          aria-label={t("relay.form.network.label")}
          onCheckedChange={(checked) =>
            onChange({ ...form, network: checked ? "direct" : "system" })
          }
        />
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function RelayIoMenu({
  providerCount,
  isPending,
  onImport,
  onExport,
}: {
  providerCount: number;
  isPending: boolean;
  onImport: () => Promise<unknown>;
  onExport: (includeApiKeys: boolean) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [includeApiKeys, setIncludeApiKeys] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await onImport();
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
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await onExport(includeApiKeys);
      const data = envelopeData(result);
      const providerCountFromResult = readNumber(data, ["providerCount"], providerCount);
      const filePath = readString(data, ["filePath", "path"]);
      const exportedWithKeys = readBoolean(data, ["includeApiKeys"], includeApiKeys);
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
      setConfirmOpen(false);
      setIncludeApiKeys(false);
    } catch (error) {
      if (!isCancelled(error)) {
        toast({
          title: t("relay.io.exportFailed"),
          description: toErrorMessage(error),
          variant: "destructive",
        });
      }
    } finally {
      setExporting(false);
    }
  };

  const menuPending = isPending || exporting || importing;

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={menuPending}
                aria-busy={menuPending}
                aria-label={t("relay.io.menuLabel")}
              >
                <ButtonBusyContent
                  busy={menuPending}
                  idleIcon={<MoreHorizontal className="h-3.5 w-3.5" />}
                />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">{t("relay.io.menuLabel")}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" sideOffset={6} className="min-w-[160px]">
          <DropdownMenuItem
            disabled={importing}
            className="gap-2 text-xs"
            onSelect={() => void handleImport()}
          >
            <Download className="h-3.5 w-3.5" />
            {t("relay.io.importBtn")}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={providerCount <= 0 || exporting}
            className="gap-2 text-xs"
            onSelect={() => setConfirmOpen(true)}
          >
            <Upload className="h-3.5 w-3.5" />
            {t("relay.io.exportBtn")}
            {providerCount <= 0 ? (
              <span className="ml-auto text-[10px] text-muted-foreground">
                {t("relay.io.exportEmptyHint")}
              </span>
            ) : null}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setIncludeApiKeys(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("relay.io.confirmExportTitle")}</DialogTitle>
            <DialogDescription className="whitespace-pre-line text-left">
              {t("relay.io.confirmExportDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-[8px] border border-border bg-muted/30 px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">
                  {t("relay.io.includeApiKeysLabel")}
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                  {t("relay.io.includeApiKeysHint")}
                </p>
              </div>
              <Switch
                checked={includeApiKeys}
                disabled={exporting}
                aria-label={t("relay.io.includeApiKeysLabel")}
                onCheckedChange={setIncludeApiKeys}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exporting}
              onClick={() => setConfirmOpen(false)}
            >
              {t("relay.io.cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={exporting}
              aria-busy={exporting}
              onClick={() => void handleExport()}
            >
              <ButtonBusyContent
                busy={exporting}
                idleLabel={t("relay.io.confirmExport")}
                busyLabel={t("relay.io.confirmExport")}
              />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PresetDialog({
  open,
  currentIde,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  currentIde: string;
  onOpenChange: (open: boolean) => void;
  onSelect: (preset: RelayProviderPreset) => void;
}) {
  const { t } = useTranslation();
  const presets = RELAY_PROVIDER_PRESETS.filter((preset) =>
    preset.ides.includes(currentIde),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("relay.preset.title")}</DialogTitle>
          <DialogDescription>{t("relay.preset.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {presets.map((preset) => (
            <button
              key={preset.slug}
              type="button"
              className="flex items-center gap-3 rounded-[8px] border border-border p-3 text-left transition-colors hover:bg-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => onSelect(preset)}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-xs font-bold text-white"
                style={{ background: preset.color }}
              >
                {preset.initial}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {preset.name}
                </span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">
                  {preset.baseUrl || "custom"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NetworkDialog({
  provider,
  pending,
  onOpenChange,
  onSave,
}: {
  provider: RelayProviderRow | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (network: RelayNetworkMode) => void;
}) {
  const { t } = useTranslation();
  const [network, setNetwork] = useState<RelayNetworkMode>("system");

  useEffect(() => {
    if (provider) setNetwork(provider.network);
  }, [provider]);

  if (!provider) return null;

  const currentNetwork = provider.network || "system";
  const changed = network !== currentNetwork;
  const options: Array<{
    value: RelayNetworkMode;
    titleKey: string;
    descKey: string;
  }> = [
    {
      value: "system",
      titleKey: "relay.network.option.system.title",
      descKey: "relay.network.option.system.desc",
    },
    {
      value: "direct",
      titleKey: "relay.network.option.direct.title",
      descKey: "relay.network.option.direct.desc",
    },
  ];

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        setNetwork(provider.network);
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("relay.network.dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("relay.network.dialog.description", { name: provider.name })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {options.map((option) => {
            const selected = network === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={pending}
                className={cn(
                  "group relative w-full rounded-[8px] border px-3.5 py-3 text-left transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-foreground/30 hover:bg-accent",
                  pending && "cursor-not-allowed opacity-60",
                )}
                onClick={() => setNetwork(option.value)}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {t(option.titleKey)}
                    </span>
                    <span className="mt-1 block text-[11.5px] leading-relaxed text-muted-foreground">
                      {t(option.descKey)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="rounded-[8px] bg-muted/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          {t("relay.network.dialog.tunHint")}
        </p>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {t("relay.network.dialog.cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!changed || pending}
            aria-busy={pending}
            onClick={() => onSave(network)}
          >
            <ButtonBusyContent
              busy={pending}
              idleLabel={t("relay.network.dialog.save")}
              busyLabel={t("relay.network.dialog.save")}
            />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProviderDialog({
  provider,
  pending,
  onOpenChange,
  onConfirm,
}: {
  provider: RelayProviderRow | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={Boolean(provider)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("relay.delete")}</DialogTitle>
          <DialogDescription>{t("relay.confirmDelete")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            aria-busy={pending}
            onClick={onConfirm}
          >
            <ButtonBusyContent
              busy={pending}
              idleIcon={<Trash2 className="h-3.5 w-3.5" />}
              idleLabel={t("relay.delete")}
              busyLabel={t("relay.delete")}
            />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InlineError({ title, description }: { title: string; description: string }) {
  return (
    <div className="m-4 rounded-[8px] border border-destructive/30 bg-destructive/5 p-3 text-sm">
      <div className="font-medium text-destructive">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </div>
  );
}

function IconTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function normalizeWireApi(value: string): WireApi {
  if (value === "openai-responses" || value === "anthropic") return value;
  return "openai-chat";
}

function normalizeNetwork(value: string): RelayNetworkMode {
  return value === "direct" ? "direct" : "system";
}

function inferWireApi(model: string): WireApi | null {
  const normalized = model.trim().toLowerCase();
  if (normalized.startsWith("gpt")) return "openai-responses";
  if (normalized.startsWith("claude")) return "anthropic";
  return null;
}

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

function validateExtraHeaders(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (!isRecord(parsed)) return "invalid";
    if (Object.values(parsed).some((item) => typeof item !== "string")) {
      return "invalid";
    }
    return null;
  } catch {
    return "invalid";
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

function showTestResult(t: (key: string, options?: Record<string, unknown>) => string, value: unknown) {
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

function notifyLocked(t: (key: string, options?: Record<string, unknown>) => string) {
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

function formatSkipReasons(
  t: (key: string, options?: Record<string, unknown>) => string,
  skipped: unknown[],
) {
  const counts = new Map<string, number>();
  for (const item of skipped) {
    const reason = normalizeSkipReason(readString(item, ["reason"]));
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([reason, count]) => `${t(`relay.io.skipReason.${reason}`)} × ${count}`)
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
