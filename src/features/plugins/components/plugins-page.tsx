/**
 * 中文职责说明：插件页面渲染插件列表、启停和结构化配置编辑，不直接拼进程通信。
 */
import { useState, type ReactNode } from "react";
import { Puzzle, Save, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePluginsModule } from "../hooks";
import type { PluginSettingsDraft } from "../types";
import {
  countEnabledPlugins,
  formatJsonDraft,
  formatJsonSummary,
  readBoolean,
  readString,
  selectPluginEnvelopeData,
  selectPluginRecords,
} from "../utils";

export function PluginsPage() {
  const { t } = useTranslation();
  const [configPluginId, setConfigPluginId] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState("");
  const [configParseErrorKey, setConfigParseErrorKey] = useState<string | null>(
    null,
  );
  const module = usePluginsModule();
  const payload = selectPluginEnvelopeData(module.pluginsQuery.data);
  const plugins = selectPluginRecords(payload);
  const enabledCount = countEnabledPlugins(plugins);

  const openConfig = async (id: string) => {
    setConfigPluginId(id);
    setConfigDraft("");
    setConfigParseErrorKey(null);
    module.updatePluginConfigMutation.reset();

    try {
      const response = await module.loadConfigMutation.mutateAsync(id);
      setConfigDraft(formatJsonDraft(selectPluginEnvelopeData(response)));
    } catch {
      setConfigDraft("null");
    }
  };

  const closeConfig = () => {
    setConfigPluginId(null);
    setConfigDraft("");
    setConfigParseErrorKey(null);
    module.loadConfigMutation.reset();
    module.updatePluginConfigMutation.reset();
  };

  const saveConfig = async () => {
    if (!configPluginId) return;

    let settings: PluginSettingsDraft;
    try {
      settings = JSON.parse(configDraft) as PluginSettingsDraft;
    } catch {
      setConfigParseErrorKey("plugins.configJsonInvalid");
      return;
    }

    setConfigParseErrorKey(null);
    try {
      await module.updatePluginConfigMutation.mutateAsync({
        id: configPluginId,
        settings,
      });
    } catch {}
  };

  return (
    <div className="space-y-5">
      <PluginsPageHeader
        titleKey="nav.plugins"
        descriptionKey="plugins.description"
        actions={[module.refreshAction]}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <PluginMetricCard
          labelKey="plugins.total"
          value={
            <span className="inline-flex items-center gap-2">
              <Puzzle className="h-4 w-4 text-muted-foreground" />
              {plugins.length}
            </span>
          }
        />
        <PluginMetricCard labelKey="plugins.enabledCount" value={enabledCount} />
        <PluginMetricCard
          labelKey="plugins.disabledCount"
          value={Math.max(plugins.length - enabledCount, 0)}
        />
      </div>

      <PluginsListSection titleKey="plugins.list" state={module.pluginsQuery}>
        <PluginRows
          items={plugins}
          emptyKey="plugins.empty"
          loading={module.pluginsQuery.isLoading && plugins.length === 0}
          renderItem={(plugin) => {
            const id = readString(plugin, ["id", "name", "key"], "");
            const enabled = readBoolean(plugin, ["enabled", "active"]);
            return (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {readString(
                      plugin,
                      ["title", "name", "id"],
                      t("plugins.unknown"),
                    )}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {readString(plugin, ["description", "summary", "path"], "")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={enabled}
                    disabled={!id || module.togglePluginMutation.isPending}
                    onCheckedChange={(checked) =>
                      module.togglePluginMutation.mutate({ id, enabled: checked })
                    }
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    disabled={!id || module.loadConfigMutation.isPending}
                    onClick={() => void openConfig(id)}
                    aria-label={t("plugins.config")}
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          }}
        />
      </PluginsListSection>

      <Dialog
        open={configPluginId !== null}
        onOpenChange={(open) => !open && closeConfig()}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("plugins.config")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <PluginConfigSummary
              value={selectPluginEnvelopeData(module.loadConfigMutation.data)}
            />
            <div className="space-y-2">
              <label
                htmlFor="plugin-config-json"
                className="text-xs font-medium text-muted-foreground"
              >
                {t("plugins.configJson")}
              </label>
              <Textarea
                id="plugin-config-json"
                value={configDraft}
                onChange={(event) => {
                  setConfigDraft(event.target.value);
                  if (configParseErrorKey) setConfigParseErrorKey(null);
                }}
                className="min-h-[240px] font-mono text-xs leading-5"
                disabled={
                  module.loadConfigMutation.isPending ||
                  module.updatePluginConfigMutation.isPending
                }
                spellCheck={false}
              />
              {configParseErrorKey ? (
                <p className="text-xs text-destructive" role="alert">
                  {t(configParseErrorKey)}
                </p>
              ) : null}
              {module.loadConfigMutation.isError ? (
                <p className="text-xs text-destructive" role="alert">
                  {t("plugins.configLoadFailed")}
                </p>
              ) : null}
              {module.updatePluginConfigMutation.isError ? (
                <p className="text-xs text-destructive" role="alert">
                  {t("plugins.configSaveFailed")}
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeConfig}>
              {t("plugins.closeConfig")}
            </Button>
            <Button
              type="button"
              disabled={
                !configPluginId ||
                module.loadConfigMutation.isPending ||
                module.loadConfigMutation.isError ||
                module.updatePluginConfigMutation.isPending
              }
              onClick={() => void saveConfig()}
            >
              <Save className="h-3.5 w-3.5" />
              {t("plugins.saveConfig")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PluginsHeaderAction {
  id: string;
  labelKey: string;
  run: () => Promise<unknown> | unknown;
  isPending?: boolean;
}

function PluginsPageHeader({
  titleKey,
  descriptionKey,
  actions,
}: {
  titleKey: string;
  descriptionKey: string;
  actions: PluginsHeaderAction[];
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-foreground">
          {t(titleKey)}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t(descriptionKey)}
        </p>
      </div>
      {actions.length > 0 ? (
        <div className="flex shrink-0 items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              type="button"
              size="sm"
              variant="outline"
              disabled={action.isPending}
              onClick={() => void action.run()}
            >
              {t(action.labelKey)}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PluginMetricCard({
  labelKey,
  value,
}: {
  labelKey: string;
  value: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="text-xs font-medium text-muted-foreground">
        {t(labelKey)}
      </div>
      <div className="mt-2 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

function PluginsListSection({
  titleKey,
  state,
  children,
}: {
  titleKey: string;
  state: { isFetching?: boolean };
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <h2 className="truncate text-sm font-semibold text-foreground">
          {t(titleKey)}
        </h2>
        {state.isFetching ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {t("common.refreshing")}
          </span>
        ) : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function PluginRows({
  items,
  emptyKey,
  loading,
  renderItem,
}: {
  items: unknown[];
  emptyKey: string;
  loading: boolean;
  renderItem: (item: unknown) => ReactNode;
}) {
  const { t } = useTranslation();
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border/60 bg-muted/30 py-12 text-sm text-muted-foreground">
        {t(loading ? "common.loading" : emptyKey)}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/30">
      {items.map((item, index) => (
        <div
          key={readString(item, ["id", "name", "key"], String(index))}
          className="px-4 py-3.5"
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

function PluginConfigSummary({ value }: { value: unknown }) {
  return (
    <pre className="max-h-32 overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
      {formatJsonSummary(value)}
    </pre>
  );
}
