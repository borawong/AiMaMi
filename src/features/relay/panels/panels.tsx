import type { ReactNode } from "react";
import {
  Ban,
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
import { ButtonBusyContent } from "@/components/ui/busy";
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
} from "@/components/ui/menu";
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
import { cn } from "@/lib/utils";
import type { RelayRouterToggleProgress } from "../cache";
import type { RelayPageController } from "../hooks";
import type {
  RelayNetworkMode,
  RelayProviderForm,
  RelayProviderRow,
} from "../types";
import {
  inferWireApi,
  isRecord,
  normalizeWireApi,
  readNumber,
  readString,
} from "../utils";

export function RelayPagePanels({
  controller,
}: {
  controller: RelayPageController;
}) {
  const { t } = useTranslation();
  const module = controller.module;

  return (
    <>
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
          onClick={() => void controller.actions.runDiagnostics()}
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
              {controller.providers.length ||
                readNumber(controller.state, ["total", "providerCount"])}
            </span>
          }
        />
        <RelayMetric
          label={t("relay.activeProvider")}
          value={controller.activeProviderId || t("relay.none")}
        />
        <RelayMetric
          label={t("relay.router")}
          value={
            <BoolBadge
              value={controller.routerEnabled}
              trueLabel={t("relay.enabled")}
              falseLabel={t("relay.disabled")}
            />
          }
        />
        <RelayMetric
          label={t("relay.passthrough")}
          value={
            <BoolBadge
              value={controller.blocked}
              trueLabel={t("relay.blocked")}
              falseLabel={t("relay.allowed")}
            />
          }
        />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 rounded-[8px] border border-border bg-card">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <Button type="button" size="sm" onClick={controller.actions.openNewProvider}>
              <Plus className="h-3.5 w-3.5" />
              {t("relay.newProvider")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={controller.actions.openPresetDialog}
            >
              <FileJson className="h-3.5 w-3.5" />
              {t("relay.fromPreset")}
            </Button>
            <div className="ml-auto">
              <RelayIoMenu controller={controller} />
            </div>
          </div>

          {module.stateQuery.isError ? (
            <InlineError
              title={t("common.error")}
              description={controller.stateErrorDescription}
            />
          ) : controller.currentProviderRows.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-4 text-sm text-muted-foreground">
              <RadioTower className="mb-2 h-8 w-8 text-muted-foreground/40" />
              {t("relay.empty")}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {controller.currentProviderRows.map((provider) => (
                <ProviderListRow
                  key={provider.rowId}
                  provider={provider}
                  locked={controller.locked}
                  selected={provider.id === controller.form.id}
                  testing={controller.testingProviderId === provider.id}
                  activating={module.providerActions.activateProvider.isPending}
                  onToggle={() => void controller.actions.toggleProvider(provider)}
                  onTest={() => void controller.actions.testProvider(provider)}
                  onEdit={() => controller.actions.openEditor(provider)}
                  onNetwork={() => controller.actions.requestNetworkEdit(provider)}
                  onDelete={() =>
                    controller.actions.requestDeleteProvider(provider.id || null)
                  }
                  onLocked={controller.actions.notifyLocked}
                />
              ))}
            </div>
          )}
        </div>

        <ProviderEditor
          form={controller.form}
          selectedProvider={controller.selectedProvider}
          currentIde={controller.currentIde}
          locked={controller.locked}
          busy={controller.busy}
          formValid={controller.formValid}
          extraHeadersInvalid={controller.extraHeadersInvalid}
          modelOptions={controller.modelOptions}
          fetchingModels={controller.fetchingModels}
          testingDraft={controller.testingDraft}
          onChange={controller.actions.setForm}
          onFetchModels={() => void controller.actions.fetchModels()}
          onTestDraft={() => void controller.actions.testDraft()}
          onSave={(enableAfterSave) =>
            void controller.actions.saveProvider(enableAfterSave)
          }
          onDelete={() =>
            controller.actions.requestDeleteProvider(controller.form.id || null)
          }
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
              checked={controller.routerEnabled}
              disabled={module.routerActions.setCodexRouterEnabled.isPending}
              aria-label={t("relay.codexRouter.switchLabel")}
              onCheckedChange={(enabled) =>
                void controller.actions.setRouterEnabled(enabled)
              }
            />
          </div>
          {controller.showRouterProgress && module.routerToggleProgress ? (
            <RelayRouterProgress progress={module.routerToggleProgress} />
          ) : null}
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <BoolBadge
              value={controller.routerEnabled}
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
                onClick={() => void controller.actions.restartCodexApp()}
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={module.routerActions.setBlockOfficialPassthrough.isPending}
                aria-label={t("relay.actionSetBlockPassthrough")}
                onClick={() => void controller.actions.toggleBlockPassthrough()}
              >
                <Ban className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={module.routerActions.diagnoseCodexRouter.isPending}
                aria-label={t("relay.actionDiagnoseRouter")}
                onClick={() => void controller.actions.diagnoseRouter()}
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
                {controller.proxyBaseUrl}
              </p>
              <div className="mt-3">
                <BoolBadge
                  value={controller.proxyRunning}
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
            {controller.auditItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("relay.none")}</p>
            ) : (
              controller.auditItems.slice(0, 6).map((item, index) => (
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
    </>
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
          <TooltipContent side="top">{t("relay.testDraftHint")}</TooltipContent>
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

export function ProviderFormFields({
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

function RelayIoMenu({ controller }: { controller: RelayPageController }) {
  const { t } = useTranslation();

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
                disabled={controller.ioMenuPending}
                aria-busy={controller.ioMenuPending}
                aria-label={t("relay.io.menuLabel")}
              >
                <ButtonBusyContent
                  busy={controller.ioMenuPending}
                  idleIcon={<MoreHorizontal className="h-3.5 w-3.5" />}
                />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">{t("relay.io.menuLabel")}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" sideOffset={6} className="min-w-[160px]">
          <DropdownMenuItem
            disabled={controller.ioImporting}
            className="gap-2 text-xs"
            onSelect={() => void controller.actions.importConfig()}
          >
            <Download className="h-3.5 w-3.5" />
            {t("relay.io.importBtn")}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={controller.providerRows.length <= 0 || controller.ioExporting}
            className="gap-2 text-xs"
            onSelect={controller.actions.openIoExportConfirm}
          >
            <Upload className="h-3.5 w-3.5" />
            {t("relay.io.exportBtn")}
            {controller.providerRows.length <= 0 ? (
              <span className="ml-auto text-[10px] text-muted-foreground">
                {t("relay.io.exportEmptyHint")}
              </span>
            ) : null}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={controller.ioConfirmOpen}
        onOpenChange={controller.actions.setIoExportConfirmOpen}
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
                checked={controller.ioIncludeApiKeys}
                disabled={controller.ioExporting}
                aria-label={t("relay.io.includeApiKeysLabel")}
                onCheckedChange={controller.actions.setIoIncludeApiKeys}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={controller.ioExporting}
              onClick={() => controller.actions.setIoExportConfirmOpen(false)}
            >
              {t("relay.io.cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={controller.ioExporting}
              aria-busy={controller.ioExporting}
              onClick={() => void controller.actions.exportConfig()}
            >
              <ButtonBusyContent
                busy={controller.ioExporting}
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

function InlineError({ title, description }: { title: string; description: string }) {
  return (
    <div
      role="alert"
      className="m-4 rounded-[8px] border border-destructive/30 bg-destructive/5 p-3 text-sm"
    >
      <div className="font-medium text-destructive">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </div>
  );
}

function RelayRouterProgress({
  progress,
}: {
  progress: RelayRouterToggleProgress;
}) {
  const { t } = useTranslation();
  const ratio = progress.total > 0 ? progress.step / progress.total : 0;
  const percent = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  const detailKey =
    progress.label === "migrating_threads"
      ? "relay.codexRouter.progressMigratingDetail"
      : progress.label === "rolling_back_threads"
        ? "relay.codexRouter.progressRollingBackDetail"
        : null;
  const labelKey = `relay.codexRouter.${resolveRouterProgressLabelKey(progress.label)}`;

  return (
    <div className="mt-4 space-y-2 rounded-[8px] border border-border bg-muted/30 px-3 py-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {detailKey && progress.current !== null && progress.totalItems !== null
          ? t(detailKey, {
              current: progress.current,
              total: progress.totalItems,
            })
          : t(labelKey)}
      </p>
    </div>
  );
}

function resolveRouterProgressLabelKey(label: string) {
  switch (label) {
    case "stopping_codex":
      return "progressStoppingCodex";
    case "starting_proxy":
      return "progressStartingProxy";
    case "migrating_threads":
      return "progressMigratingThreads";
    case "rolling_back_threads":
      return "progressRollingBackThreads";
    case "updating_database":
      return "progressUpdatingDatabase";
    case "launching_codex":
      return "progressLaunchingCodex";
    case "writing_config":
    default:
      return "progressWritingConfig";
  }
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
